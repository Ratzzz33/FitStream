import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { X, Play, Square, Mic, MicOff, AlertCircle, Sparkles, Cpu, ChevronRight, ArrowLeft } from 'lucide-react';
import { ExerciseLog } from '../types';
import { StorageService } from '../services/storageService';
import { t } from '../services/i18n';
import { PoseWorkout } from './PoseWorkout';
import { TrackableExercise, isExerciseTrackable, getExerciseNameRu, isTimeBased } from '../services/poseTracker';
import { SmartWorkoutPanel, WorkoutFeedback, WarmupReminder } from './SmartWorkoutPanel';
import { getWorkoutAdvisor, RecommendedExercise, DifficultyFeedback } from '../services/workoutAdvisor';

interface WorkoutSessionProps {
  onFinish: () => void;
}

// Workout modes
type WorkoutMode = 'smart_panel' | 'warmup_reminder' | 'select' | 'local' | 'local_active' | 'feedback' | 'ai';

// Exercise selection for local mode - ordered by popularity
const LOCAL_EXERCISES: TrackableExercise[] = [
  'SQUATS', 'PUSHUPS', 'PLANK', 'LUNGES', 'SITUPS', 'BURPEES',
  'JUMPING_JACKS', 'HIGH_KNEES', 'MOUNTAIN_CLIMBERS', 'LEG_RAISES',
  'GLUTE_BRIDGES', 'CALF_RAISES', 'WALL_SIT', 'SIDE_LUNGES', 'TRICEP_DIPS'
];

// Exercise icon component - uses custom SVG icons from public/icons/exercises/
const EXERCISE_SVG_MAP: Record<TrackableExercise, string> = {
  'SQUATS': '/icons/exercises/squats.svg',
  'PUSHUPS': '/icons/exercises/pushups.svg',
  'PLANK': '/icons/exercises/plank.svg',
  'LUNGES': '/icons/exercises/lunges.svg',
  'SITUPS': '/icons/exercises/situps.svg',
  'BURPEES': '/icons/exercises/burpees.svg',
  'JUMPING_JACKS': '/icons/exercises/jumping_jacks.svg',
  'HIGH_KNEES': '/icons/exercises/high_knees.svg',
  'MOUNTAIN_CLIMBERS': '/icons/exercises/mountain_climbers.svg',
  'LEG_RAISES': '/icons/exercises/leg_raises.svg',
  'GLUTE_BRIDGES': '/icons/exercises/glute_bridges.svg',
  'CALF_RAISES': '/icons/exercises/calf_raises.svg',
  'WALL_SIT': '/icons/exercises/wall_sit.svg',
  'SIDE_LUNGES': '/icons/exercises/side_lunges.svg',
  'TRICEP_DIPS': '/icons/exercises/tricep_dips.svg',
};

const ExerciseIcon: React.FC<{ exercise: TrackableExercise; className?: string }> = ({ exercise, className = "w-8 h-8" }) => {
  const svgPath = EXERCISE_SVG_MAP[exercise] || '/icons/exercises/squats.svg';
  return (
    <img
      src={svgPath}
      alt={exercise}
      className={className}
      style={{ filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.3))' }}
    />
  );
};

// Function declaration for the model
const updateStatsTool: FunctionDeclaration = {
  name: 'updateWorkoutStats',
  parameters: {
    type: Type.OBJECT,
    properties: {
      count: { type: Type.NUMBER, description: "The total number of completed repetitions so far." },
      exercise: { type: Type.STRING, description: "Name of the exercise being performed. Choose from: 'Steps', 'Push-ups', 'Squats', 'Sit-ups', 'Jumping Jacks', 'Lunges', 'Burpees', 'Dips', 'Pull-ups' or 'Other'." },
      feedback: { type: Type.STRING, description: "Short feedback on form." }
    },
    required: ['count', 'exercise']
  }
};

function pcmToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16Data = new Int16Array(bytes.buffer);
  const floatData = new Float32Array(int16Data.length);
  for(let i=0; i<int16Data.length; i++) {
    floatData[i] = int16Data[i] / 32768.0;
  }
  return floatData;
}

function encodeAudioChunk(inputData: Float32Array): string {
    const l = inputData.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = inputData[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mode selection - start with smart panel for recommendations
  const [mode, setMode] = useState<WorkoutMode>('smart_panel');
  const [selectedExercise, setSelectedExercise] = useState<TrackableExercise>('SQUATS');
  const [targetReps, setTargetReps] = useState(10);

  // Smart workout queue
  const [workoutQueue, setWorkoutQueue] = useState<RecommendedExercise[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [needsWarmup, setNeedsWarmup] = useState(false);

  // Feedback state
  const [lastExerciseInfo, setLastExerciseInfo] = useState<{
    exercise: TrackableExercise;
    reps: number;
    formScore: number;
    duration: number;
  } | null>(null);

  // Get theme from settings
  const settings = StorageService.getSettings();

  // AI mode state
  const [isStreaming, setIsStreaming] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [exerciseName, setExerciseName] = useState(t('detecting'));
  const [feedback, setFeedback] = useState(t('getReady'));
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Use refs for values accessed inside closures/callbacks to avoid stale state
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Audio Context Refs to prevent leaks
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Track previous rep count for sound effects
  const prevRepCountRef = useRef(0);

  // Setup audio context for sound effects and voice
  useEffect(() => {
     if (!outputAudioContextRef.current) {
         outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
     }
     return () => {
         // Cleanup handled in main cleanup effect
     }
  }, []);

  const playRepSound = useCallback(() => {
    const ctx = outputAudioContextRef.current;
    if (!ctx || ctx.state === 'closed') return;

    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // "Ding" sound effect - faster decay for rapid reps
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up to A6 (sharp ding)

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // Snappy 150ms decay

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
        console.error("Error playing rep sound:", e);
    }
  }, []);

  // Monitor rep count changes to play sound
  useEffect(() => {
    if (repCount > prevRepCountRef.current) {
        // Only play if streaming (active workout) and not 0 (initial)
        if (isStreaming) {
            playRepSound();
        }
        prevRepCountRef.current = repCount;
    } else if (repCount === 0) {
        prevRepCountRef.current = 0;
    }
  }, [repCount, isStreaming, playRepSound]);

  // ========== AI MODE (Gemini Live) ==========
  const startAiSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Resume context if suspended (browser policy)
      if (outputAudioContextRef.current?.state === 'suspended') {
          await outputAudioContextRef.current.resume();
      }

      const settings = StorageService.getSettings();
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const lang = navigator.language;
      const voice = settings.coachVoice || 'Fenrir';

      const systemInstruction = `
You are an AI fitness coach powered by computer vision. Your task is to track repetitions via the \`updateWorkoutStats\` tool.

**AUDIO & INTERACTION RULES:**
1. **FAST PACED EXERCISES (Jumping Jacks, Burpees, High Knees):**
   - **SILENCE IS GOLDEN.** Do NOT count out loud. The app generates a sound effect for every rep you log.
   - **NO MOTIVATION.** Do not say "Good job" or "Keep going" during the set.
   - **ONLY SPEAK** if the user stops unexpectedly or has dangerous form.

2. **STRENGTH EXERCISES (Push-ups, Squats, Pull-ups):**
   - You MAY count out loud ("One", "Two") to help pace the user.
   - Keep any form corrections under 3 words (e.g., "Chin up", "Lower").

3. **PRIORITY:**
   - Latency is critical. Call \`updateWorkoutStats\` the INSTANT a rep completes.
   - Do not buffer reps. 1 rep = 1 tool call immediately.

**Exercise Definitions:**
- **Push-ups**: Chest lowers to floor level.
- **Squats**: Hips descend parallel to knees.
- **Jumping Jacks**: Hands meet above head.
- **Lunges**: Back knee hovers off ground.
- **Sit-ups**: Torso comes fully upright.

**Language:** Respond in ${lang}.
`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          tools: [{ functionDeclarations: [updateStatsTool] }],
          systemInstruction: systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
          }
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            setIsStreaming(true);

            // Audio Stream Setup (Input)
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
               const inputData = e.inputBuffer.getChannelData(0);
               const b64 = encodeAudioChunk(inputData);

               sessionPromise.then(session => session.sendRealtimeInput({
                   media: { mimeType: 'audio/pcm;rate=16000', data: b64 }
               }));
            };
            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);

            // Video Frame Loop
            intervalRef.current = window.setInterval(() => {
                if (videoRef.current && canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    canvasRef.current.width = videoRef.current.videoWidth * 0.5; // Downscale for bandwidth
                    canvasRef.current.height = videoRef.current.videoHeight * 0.5;
                    ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];

                    sessionPromise.then(session => session.sendRealtimeInput({
                        media: { mimeType: 'image/jpeg', data: base64 }
                    }));
                }
            }, 500); // 2 FPS is enough for basic rep counting
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Function Calls (The Source of Truth for State)
            if (msg.toolCall) {
                for (const fc of msg.toolCall.functionCalls) {
                    if (fc.name === 'updateWorkoutStats') {
                        const args = fc.args as any;
                        setRepCount(Number(args.count));
                        setExerciseName(args.exercise);
                        if (args.feedback) setFeedback(args.feedback);

                        // Respond to tool call
                        sessionPromise.then(session => session.sendToolResponse({
                            functionResponses: {
                                id: fc.id,
                                name: fc.name,
                                response: { result: "ok" }
                            }
                        }));
                    }
                }
            }

            // Handle Audio Response (Motivational Voice)
            if (!isMuted && msg.serverContent?.modelTurn?.parts?.[0]?.inlineData) {
                const audioData = msg.serverContent.modelTurn.parts[0].inlineData.data;
                playAudio(audioData);
            }
          },
          onclose: () => {
             console.log("Session Closed");
             setIsStreaming(false);
          },
          onerror: (err) => {
              console.error("Session Error", err);
              setError(t('connectionError'));
              setIsStreaming(false);
          }
        }
      });
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setError(t('cameraDenied'));
    }
  };

  const playAudio = async (base64: string) => {
    if (!outputAudioContextRef.current) return;
    const ctx = outputAudioContextRef.current;

    try {
        const floatData = pcmToFloat32(base64);
        const buffer = ctx.createBuffer(1, floatData.length, 24000);
        buffer.copyToChannel(floatData, 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.addEventListener('ended', () => {
            sourcesRef.current.delete(source);
        });

        // Ensure smooth scheduling
        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
        sourcesRef.current.add(source);
    } catch(e) {
        console.error("Audio Playback Error", e);
    }
  };

  const stopSession = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
    }

    // Close audio contexts
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        sourcesRef.current.forEach(s => s.stop());
        sourcesRef.current.clear();
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;

    sessionRef.current?.then((s: any) => s.close && s.close());

    // Save Data
    if (repCount > 0) {
        const log: ExerciseLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: Date.now(),
            exerciseName: exerciseName,
            reps: repCount,
            feedback: feedback
        };
        StorageService.saveExercise(log);
    }

    onFinish();
  };

  // ========== SMART WORKOUT HANDLERS ==========
  const handleStartWorkout = (exercises: RecommendedExercise[], warmupNeeded: boolean) => {
    setWorkoutQueue(exercises);
    setCurrentQueueIndex(0);
    setNeedsWarmup(warmupNeeded);

    if (warmupNeeded) {
      setMode('warmup_reminder');
    } else {
      startQueuedExercise(exercises, 0);
    }
  };

  const handleStartExercise = (exercise: TrackableExercise, reps: number) => {
    setSelectedExercise(exercise);
    setTargetReps(reps);
    setWorkoutQueue([{ exercise, reps }]); // Single exercise
    setCurrentQueueIndex(0);

    const advisor = getWorkoutAdvisor();
    if (advisor.needsWarmup()) {
      setNeedsWarmup(true);
      setMode('warmup_reminder');
    } else {
      setMode('local_active');
    }
  };

  const startQueuedExercise = (queue: RecommendedExercise[], index: number) => {
    if (index < queue.length) {
      const ex = queue[index];
      setSelectedExercise(ex.exercise);
      setTargetReps(ex.duration || ex.reps);
      setMode('local_active');
    } else {
      // All exercises done
      onFinish();
    }
  };

  const handleWarmupComplete = () => {
    setNeedsWarmup(false);
    if (workoutQueue.length > 0) {
      startQueuedExercise(workoutQueue, currentQueueIndex);
    } else {
      setMode('local');
    }
  };

  const handleSkipWarmup = () => {
    setNeedsWarmup(false);
    if (workoutQueue.length > 0) {
      startQueuedExercise(workoutQueue, currentQueueIndex);
    } else {
      setMode('local');
    }
  };

  // ========== LOCAL MODE HANDLERS ==========
  const handleLocalComplete = (reps: number, formScore: number, stats?: { totalTime: number }) => {
    // Save exercise log
    const log: ExerciseLog = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      exerciseName: getExerciseNameRu(selectedExercise),
      reps: reps,
      feedback: `Форма: ${formScore}%`
    };
    StorageService.saveExercise(log);

    // Show feedback screen
    setLastExerciseInfo({
      exercise: selectedExercise,
      reps,
      formScore,
      duration: stats?.totalTime || 0
    });
    setMode('feedback');
  };

  const handleFeedbackSubmit = (difficulty: DifficultyFeedback) => {
    // Check if there are more exercises in queue
    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < workoutQueue.length) {
      setCurrentQueueIndex(nextIndex);
      startQueuedExercise(workoutQueue, nextIndex);
    } else {
      onFinish();
    }
  };

  const handleFeedbackSkip = () => {
    // Record without explicit feedback
    if (lastExerciseInfo) {
      const advisor = getWorkoutAdvisor();
      advisor.recordExercise({
        exercise: lastExerciseInfo.exercise,
        reps: lastExerciseInfo.reps,
        duration: lastExerciseInfo.duration,
        formScore: lastExerciseInfo.formScore,
        difficulty: 'normal', // Default
        timestamp: Date.now()
      });
    }

    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < workoutQueue.length) {
      setCurrentQueueIndex(nextIndex);
      startQueuedExercise(workoutQueue, nextIndex);
    } else {
      onFinish();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (inputAudioContextRef.current) {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current) {
            sourcesRef.current.forEach(s => s.stop());
            outputAudioContextRef.current.close();
        }
        sessionRef.current?.then((s: any) => s.close && s.close());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== SMART PANEL (MAIN ENTRY) ==========
  if (mode === 'smart_panel') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button onClick={onFinish} className="p-2 text-gray-400">
            <X size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">{t('workoutTitle')}</h1>
          <button onClick={() => setMode('local')} className="p-2 text-gray-400">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Smart recommendations */}
        <div className="flex-1 p-4 overflow-auto">
          <SmartWorkoutPanel
            onStartWorkout={handleStartWorkout}
            onStartExercise={handleStartExercise}
            theme={settings.theme}
          />
        </div>

        {/* Custom workout button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setMode('local')}
            className="w-full py-3 rounded-xl text-gray-400 border border-gray-700 flex items-center justify-center gap-2"
          >
            <Cpu className="w-5 h-5" />
            {t('customWorkout')}
          </button>
        </div>
      </div>
    );
  }

  // ========== WARMUP REMINDER ==========
  if (mode === 'warmup_reminder') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button onClick={() => setMode('smart_panel')} className="p-2 text-gray-400">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">{t('warmup')}</h1>
          <div className="w-10" />
        </div>

        {/* Warmup reminder */}
        <div className="flex-1 flex items-center justify-center p-4">
          <WarmupReminder
            onStartWarmup={() => {
              // Start warmup routine
              const advisor = getWorkoutAdvisor();
              const warmupExercises = advisor.getWarmupExercises();
              setWorkoutQueue([...warmupExercises, ...workoutQueue]);
              setNeedsWarmup(false);
              startQueuedExercise([...warmupExercises, ...workoutQueue], 0);
            }}
            onSkipWarmup={handleSkipWarmup}
            onAlreadyWarmedUp={handleWarmupComplete}
            theme={settings.theme}
          />
        </div>
      </div>
    );
  }

  // ========== FEEDBACK SCREEN ==========
  if (mode === 'feedback' && lastExerciseInfo) {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="w-10" />
          <h1 className="text-lg font-bold text-white">{getExerciseNameRu(lastExerciseInfo.exercise)}</h1>
          <div className="w-10" />
        </div>

        {/* Feedback */}
        <div className="flex-1 flex items-center justify-center p-4">
          <WorkoutFeedback
            exercise={lastExerciseInfo.exercise}
            reps={lastExerciseInfo.reps}
            formScore={lastExerciseInfo.formScore}
            duration={lastExerciseInfo.duration}
            onFeedback={handleFeedbackSubmit}
            onSkip={handleFeedbackSkip}
            theme={settings.theme}
          />
        </div>

        {/* Queue progress */}
        {workoutQueue.length > 1 && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-center gap-2">
              {workoutQueue.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full ${
                    idx < currentQueueIndex + 1 ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-2">
              {currentQueueIndex + 1} из {workoutQueue.length}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ========== MODE SELECTION SCREEN ==========
  if (mode === 'select') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button onClick={onFinish} className="p-2 text-gray-400">
            <X size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">{t('workoutTitle')}</h1>
          <div className="w-10" />
        </div>

        {/* Mode selection */}
        <div className="flex-1 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white text-center mb-8">
            {t('chooseMode')}
          </h2>

          {/* Local Mode - Recommended */}
          <button
            onClick={() => setMode('local')}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-left relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 bg-white/20 text-white text-xs px-2 py-1 rounded-full">
              {t('recommended')}
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Cpu className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{t('localTracker')}</h3>
                <p className="text-green-100 text-sm mb-3">
                  {t('localTrackerDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {t('freeFeature')}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {t('worksOffline')}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {t('fastResponse')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/60 mt-2" />
            </div>
          </button>

          {/* AI Coach Mode */}
          <button
            onClick={() => {
              setMode('ai');
              startAiSession();
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-left relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
              💰 Premium
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">{t('aiCoach')}</h3>
                <p className="text-purple-100 text-sm mb-3">
                  {t('aiCoachDesc')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {t('voiceCoach')}
                  </span>
                  <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    {t('anyExercises')}
                  </span>
                  <span className="bg-amber-500/50 text-white text-xs px-2 py-1 rounded-full">
                    {t('pricePerMin')}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-white/60 mt-2" />
            </div>
          </button>

          {/* Info */}
          <div className="text-center text-gray-500 text-sm mt-8">
            <p>{t('localModeInfo')}</p>
            <p>{t('aiCoachInfo')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ========== LOCAL MODE: Exercise Selection ==========
  if (mode === 'local') {
    return (
      <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button onClick={() => setMode('smart_panel')} className="p-2 text-gray-400">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">{t('exerciseSelection')}</h1>
          <button onClick={onFinish} className="p-2 text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Exercise selection */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-3 gap-2">
            {LOCAL_EXERCISES.map(exercise => (
              <button
                key={exercise}
                onClick={() => setSelectedExercise(exercise)}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center ${
                  selectedExercise === exercise
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-gray-700 bg-gray-800 text-gray-400'
                }`}
              >
                <div className="mb-1">
                  <ExerciseIcon exercise={exercise} className="w-8 h-8" />
                </div>
                <div className="text-white font-medium text-xs text-center leading-tight">
                  {getExerciseNameRu(exercise)}
                </div>
                {isTimeBased(exercise) && (
                  <div className="text-[10px] text-gray-500 mt-0.5">время</div>
                )}
              </button>
            ))}
          </div>

          {/* Target selector */}
          <div className="mt-4 bg-gray-800 rounded-xl p-4">
            <label className="text-gray-400 text-sm mb-2 block">
              {isTimeBased(selectedExercise) ? t('goalSeconds') : t('goalReps')}
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTargetReps(Math.max(5, targetReps - 5))}
                className="w-12 h-12 bg-gray-700 rounded-xl text-white text-xl font-bold active:bg-gray-600"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <span className="text-4xl font-bold text-white">{targetReps}</span>
                <span className="text-gray-400 ml-2">
                  {isTimeBased(selectedExercise) ? t('secUnit') : t('repsUnit')}
                </span>
              </div>
              <button
                onClick={() => setTargetReps(Math.min(120, targetReps + 5))}
                className="w-12 h-12 bg-gray-700 rounded-xl text-white text-xl font-bold active:bg-gray-600"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Start button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => setMode('local_active')}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Play className="w-6 h-6" fill="white" />
            {t('start')}
          </button>
        </div>
      </div>
    );
  }

  // ========== LOCAL MODE: Active Workout ==========
  if (mode === 'local_active') {
    return (
      <PoseWorkout
        exercise={selectedExercise}
        targetReps={isTimeBased(selectedExercise) ? undefined : targetReps}
        targetSeconds={isTimeBased(selectedExercise) ? targetReps : undefined}
        onComplete={handleLocalComplete}
        onCancel={() => setMode('local')}
      />
    );
  }

  // ========== AI MODE (Gemini Live) ==========
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 bg-gray-900 overflow-hidden">
        <video
           ref={videoRef}
           className="absolute inset-0 w-full h-full object-cover opacity-80"
           muted
           playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* HUD Overlay */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                <button onClick={stopSession} className="bg-gray-800/50 p-2 rounded-full backdrop-blur text-white">
                    <X size={24} />
                </button>
                <div className="bg-purple-500/80 px-3 py-1 rounded-full text-xs font-bold animate-pulse text-white uppercase flex items-center gap-1">
                    <Sparkles size={12} />
                    {t('liveAiVision')}
                </div>
            </div>

            {/* Center Info */}
            <div className="flex flex-col items-center justify-center space-y-2">
                 {!isStreaming && !error && (
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4" />
                      <p>{t('connectingToAi')}</p>
                    </div>
                 )}
            </div>

            {/* Bottom Stats */}
            {isStreaming && (
                <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center space-y-2 pointer-events-auto">
                    <h2 className="text-gray-400 text-sm uppercase tracking-widest">{exerciseName}</h2>
                    <div className="text-7xl font-bold text-white font-mono">{repCount}</div>
                    <p className="text-purple-400 font-medium">{feedback}</p>

                    <div className="flex justify-center gap-4 mt-4">
                        <button
                           onClick={stopSession}
                           className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-bold"
                        >
                           <Square size={20} fill="currentColor" /> {t('finish')}
                        </button>
                        <button
                           onClick={() => setIsMuted(!isMuted)}
                           className="bg-gray-700 p-3 rounded-full text-white"
                        >
                            {isMuted ? <MicOff size={20}/> : <Mic size={20} />}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Error Modal Overlay */}
        {error && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 pointer-events-auto animate-in fade-in duration-200">
                 <div className="bg-gray-900 border border-red-500/30 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
                     <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} className="text-red-500" />
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{t('oops')}</h3>
                     <p className="text-gray-300 mb-6">{error}</p>
                     <button
                         onClick={() => {
                           setError(null);
                           setMode('select');
                         }}
                         className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition"
                     >
                         {t('dismiss')}
                     </button>
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};
