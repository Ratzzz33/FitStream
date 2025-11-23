import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { Camera, X, Play, Square, Mic, MicOff, AlertCircle } from 'lucide-react';
import { ExerciseLog } from '../types';
import { StorageService } from '../services/storageService';
import { t } from '../services/i18n';

interface WorkoutSessionProps {
  onFinish: () => void;
}

// Function declaration for the model
const updateStatsTool: FunctionDeclaration = {
  name: 'updateWorkoutStats',
  parameters: {
    type: Type.OBJECT,
    properties: {
      count: { type: Type.NUMBER, description: "The total number of completed repetitions so far." },
      exercise: { type: Type.STRING, description: "Name of the exercise being performed. Choose from: 'Steps', 'Push-ups', 'Squats', 'Sit-ups', 'Jumping Jacks', 'Lunges', 'Burpees' or 'Other'." },
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

        // "Ding" sound effect
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1); // Slide up to A6 (sharp ding)

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
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

  const startSession = async () => {
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

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const lang = navigator.language;
      
      const systemInstruction = `
You are an energetic fitness coach. Your primary job is to accurately count repetitions for specific exercises using video input.

**Supported Exercises & Counting Rules:**
1. **Push-ups**: Count 1 rep when the user lowers their chest near the floor and returns to a high plank position. Do not count partial dips.
2. **Squats**: Count 1 rep when hips descend below knee level and user returns to standing.
3. **Sit-ups**: Count 1 rep when the torso rises from the floor to a vertical position and returns down.
4. **Jumping Jacks**: Count 1 rep when hands touch above the head (legs wide) and return to sides (legs closed).
5. **Lunges**: Count 1 rep per leg when the back knee lowers close to the ground and user returns to standing.
6. **Burpees**: Count 1 rep when the user goes from standing -> plank/floor -> standing -> jump.
7. **Steps**: If the user is just walking or running in place, count every 2 steps as 1 unit.

**General Rules:**
- **Ignore** small movements, fidgeting, or setup time.
- Only update the count when a **full** repetition is completed with good form.
- If the exercise is unclear, wait for a distinct movement pattern before counting.
- Provide brief, encouraging form correction in ${lang} language.
- Call \`updateWorkoutStats\` **immediately** when a rep is completed.
`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          tools: [{ functionDeclarations: [updateStatsTool] }],
          systemInstruction: systemInstruction,
          responseModalities: [Modality.AUDIO], 
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
                <div className="bg-red-500/80 px-3 py-1 rounded-full text-xs font-bold animate-pulse text-white uppercase">
                    {t('liveAiVision')}
                </div>
            </div>

            {/* Center Info */}
            <div className="flex flex-col items-center justify-center space-y-2">
                 {!isStreaming && !error && (
                    <button 
                        onClick={startSession}
                        className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white rounded-full p-6 shadow-xl transition-all transform hover:scale-105"
                    >
                        <Play size={48} fill="currentColor" />
                    </button>
                 )}
            </div>

            {/* Bottom Stats */}
            {isStreaming && (
                <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center space-y-2 pointer-events-auto">
                    <h2 className="text-gray-400 text-sm uppercase tracking-widest">{exerciseName}</h2>
                    <div className="text-7xl font-bold text-white font-mono">{repCount}</div>
                    <p className="text-blue-400 font-medium">{feedback}</p>
                    
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
                     <h3 className="text-xl font-bold text-white mb-2">Oops!</h3>
                     <p className="text-gray-300 mb-6">{error}</p>
                     <button 
                         onClick={() => setError(null)} 
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