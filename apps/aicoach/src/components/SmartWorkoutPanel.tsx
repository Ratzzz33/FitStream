/**
 * SmartWorkoutPanel - Combined recommendations + feedback UI
 */

import React, { useState, useEffect } from 'react';
import {
  Zap, Sun, Moon, Coffee, Flame, Clock, ChevronRight, ChevronDown,
  TrendingUp, Target, Sparkles, AlertCircle, Smile, Meh, Frown,
  TrendingDown, Minus, AlertTriangle, Play, CheckCircle, X
} from 'lucide-react';
import {
  getWorkoutAdvisor,
  WorkoutRecommendation,
  SessionType,
  SESSION_TYPE_NAMES,
  FitnessProfile,
  RecommendedExercise,
  DifficultyFeedback,
  OfficeBreakRecommendation,
  OfficeBreakExercise,
  OfficeExercise,
  SIMPLE_EXERCISE_INFO,
  SimpleExercise
} from '../services/workoutAdvisor';
import { getExerciseNameRu, TrackableExercise } from '../services/poseTracker';
import { t } from '@fitstream/shared';

// Helper to check if exercise is simple (office) type
function isSimpleExercise(ex: OfficeBreakExercise): ex is OfficeExercise {
  return 'type' in ex && ex.type === 'simple';
}

// Helper to get exercise name for any type
function getExerciseName(ex: OfficeBreakExercise): string {
  if (isSimpleExercise(ex)) {
    return SIMPLE_EXERCISE_INFO[ex.exercise].name;
  }
  return getExerciseNameRu(ex.exercise);
}

// Helper to get exercise duration/reps display
function getExerciseDisplay(ex: OfficeBreakExercise): string {
  if (isSimpleExercise(ex)) {
    return `${SIMPLE_EXERCISE_INFO[ex.exercise].duration} sec`;
  }
  return ex.duration ? `${ex.duration} sec` : `${ex.reps}x`;
}

// ==================== TYPES ====================

interface SmartWorkoutPanelProps {
  onStartWorkout: (exercises: RecommendedExercise[], needsWarmup: boolean) => void;
  onStartExercise: (exercise: TrackableExercise, reps: number) => void;
  onStartOfficeBreak?: (exercises: OfficeBreakExercise[]) => void;
  theme: 'light' | 'dark';
}

interface WorkoutFeedbackProps {
  exercise: TrackableExercise;
  reps: number;
  formScore: number;
  duration: number;
  onFeedback: (difficulty: DifficultyFeedback) => void;
  onSkip: () => void;
  theme: 'light' | 'dark';
}

interface WarmupReminderProps {
  onStartWarmup: () => void;
  onSkipWarmup: () => void;
  onAlreadyWarmedUp: () => void;
  theme: 'light' | 'dark';
}

// ==================== SESSION CONFIG ====================

const SESSION_ICONS: Record<SessionType, React.ReactNode> = {
  morning_warmup: <Sun className="w-5 h-5" />,
  office_break: <Coffee className="w-5 h-5" />,
  full_workout: <Flame className="w-5 h-5" />,
  evening_stretch: <Moon className="w-5 h-5" />,
  quick_energy: <Zap className="w-5 h-5" />
};

const SESSION_COLORS: Record<SessionType, string> = {
  morning_warmup: 'from-amber-500 to-orange-500',
  office_break: 'from-blue-500 to-cyan-500',
  full_workout: 'from-red-500 to-pink-500',
  evening_stretch: 'from-purple-500 to-indigo-500',
  quick_energy: 'from-green-500 to-emerald-500'
};

// ==================== WARMUP REMINDER ====================

export const WarmupReminder: React.FC<WarmupReminderProps> = ({
  onStartWarmup,
  onSkipWarmup,
  onAlreadyWarmedUp,
  theme
}) => {
  const isDark = theme === 'dark';
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      <h2 className={`text-xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('warmupFirst')}
      </h2>
      <p className={`text-sm text-center mb-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
        {t('warmedMusclesWork')}
      </p>

      <button
        onClick={() => setShowWhy(!showWhy)}
        className={`w-full mb-4 p-3 rounded-xl flex items-center justify-between ${
          isDark ? 'bg-amber-900/20' : 'bg-amber-50'
        }`}
      >
        <span className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
          {t('whyImportant')}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showWhy ? 'rotate-180' : ''} ${
          isDark ? 'text-amber-400' : 'text-amber-600'
        }`} />
      </button>

      {showWhy && (
        <ul className={`mb-4 space-y-1 text-sm ${isDark ? 'text-amber-200/70' : 'text-amber-800'}`}>
          <li>- {t('improveCirculation')}</li>
          <li>- {t('reducesInjury')}</li>
          <li>- {t('improvesEfficiency')}</li>
        </ul>
      )}

      <div className="space-y-3">
        <button
          onClick={onStartWarmup}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" fill="white" />
          {t('startWarmup')}
        </button>

        <button
          onClick={onAlreadyWarmedUp}
          className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${
            isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          {t('alreadyWarmedUp')}
        </button>

        <button
          onClick={() => confirmSkip ? onSkipWarmup() : setConfirmSkip(true)}
          className={`w-full py-2 text-sm ${
            confirmSkip ? 'text-red-500 font-medium' : isDark ? 'text-white/40' : 'text-gray-400'
          }`}
        >
          {confirmSkip ? t('sureToSkip') : t('skip')}
        </button>
      </div>
    </div>
  );
};

// ==================== WORKOUT FEEDBACK ====================

export const WorkoutFeedback: React.FC<WorkoutFeedbackProps> = ({
  exercise,
  reps,
  formScore,
  duration,
  onFeedback,
  onSkip,
  theme
}) => {
  const isDark = theme === 'dark';

  const handleFeedback = (difficulty: DifficultyFeedback) => {
    const advisor = getWorkoutAdvisor();
    advisor.recordExercise({
      exercise,
      reps,
      duration,
      formScore,
      difficulty,
      timestamp: Date.now()
    });
    onFeedback(difficulty);
  };

  const options = [
    { value: 'easy' as const, icon: <Smile className="w-8 h-8" />, label: t('feedbackEasy'), desc: t('canDoMore'), color: 'text-green-500', bg: isDark ? 'bg-green-900/30' : 'bg-green-50' },
    { value: 'normal' as const, icon: <Meh className="w-8 h-8" />, label: t('feedbackNormal'), desc: t('justRight'), color: 'text-blue-500', bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50' },
    { value: 'hard' as const, icon: <Frown className="w-8 h-8" />, label: t('feedbackHard'), desc: t('barelyMadeIt'), color: 'text-amber-500', bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50' }
  ];

  return (
    <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
      <h3 className={`text-lg font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('howWasIt')}
      </h3>
      <p className={`text-sm text-center mb-6 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
        {t('helpsAdjustLoad')}
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleFeedback(opt.value)}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all hover:scale-105 ${opt.bg}`}
          >
            <div className={opt.color}>{opt.icon}</div>
            <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{opt.label}</div>
            <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <div className={`p-3 rounded-lg text-xs space-y-1 ${isDark ? 'bg-white/5 text-white/50' : 'bg-gray-50 text-gray-500'}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3 h-3 text-green-500" />
          <span>{t('easyMoreReps')}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3 h-3 text-amber-500" />
          <span>{t('hardReduceLoad')}</span>
        </div>
      </div>

      <button onClick={onSkip} className={`w-full mt-4 py-2 text-sm ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
        {t('skip')}
      </button>
    </div>
  );
};

// ==================== MAIN PANEL ====================

export const SmartWorkoutPanel: React.FC<SmartWorkoutPanelProps> = ({
  onStartWorkout,
  onStartExercise,
  onStartOfficeBreak,
  theme
}) => {
  const [recommendations, setRecommendations] = useState<(WorkoutRecommendation | OfficeBreakRecommendation)[]>([]);
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [motivation, setMotivation] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [activeOfficeExercise, setActiveOfficeExercise] = useState<SimpleExercise | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const advisor = getWorkoutAdvisor();
    const recs = advisor.getRecommendations();
    // Replace office_break with improved version
    const improvedRecs = recs.map(rec => {
      if (rec.sessionType === 'office_break') {
        return advisor.getOfficeBreak();
      }
      return rec;
    });
    setRecommendations(improvedRecs);
    setProfile(advisor.getProfile());
    setMotivation(advisor.getMotivation());
  }, []);

  const handleSelectRecommendation = (rec: WorkoutRecommendation | OfficeBreakRecommendation) => {
    // Check if this is an office break with simple exercises
    if (rec.sessionType === 'office_break' && onStartOfficeBreak) {
      onStartOfficeBreak((rec as OfficeBreakRecommendation).exercises);
      return;
    }

    // Regular workout
    const advisor = getWorkoutAdvisor();
    const needsWarmup = advisor.needsWarmup() && rec.sessionType !== 'morning_warmup';
    // Filter only trackable exercises for regular workouts
    const trackableExercises = rec.exercises.filter(
      (ex): ex is RecommendedExercise => !('type' in ex)
    );
    onStartWorkout(trackableExercises, needsWarmup);
  };

  const handleExerciseClick = (ex: OfficeBreakExercise) => {
    if (isSimpleExercise(ex)) {
      // Show instruction for simple exercise
      setActiveOfficeExercise(ex.exercise);
    } else {
      // Start camera tracking for trackable exercise
      onStartExercise(ex.exercise, ex.reps);
    }
  };

  return (
    <div className="space-y-4">
      {/* Motivation */}
      <div className={`p-4 rounded-xl ${
        isDark ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40' : 'bg-gradient-to-r from-blue-50 to-purple-50'
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{t('tipOfTheDay')}</span>
        </div>
        <p className={`text-sm ${isDark ? 'text-white/90' : 'text-gray-700'}`}>{motivation}</p>
      </div>

      {/* Stats */}
      {profile && profile.totalWorkouts > 0 && (
        <div className="flex gap-2">
          {profile.currentStreak > 0 && (
            <div className={`flex-1 p-3 rounded-xl text-center ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
              <div className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>
                {profile.currentStreak}
              </div>
              <div className={`text-xs ${isDark ? 'text-orange-300/70' : 'text-orange-600'}`}>{t('daysStreak')}</div>
            </div>
          )}
          <div className={`flex-1 p-3 rounded-xl text-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-500'}`}>
              {profile.totalWorkouts}
            </div>
            <div className={`text-xs ${isDark ? 'text-green-300/70' : 'text-green-600'}`}>{t('workoutsCount')}</div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          <Target className="w-4 h-4" />
          {t('recommendations')}
        </h3>

        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded-xl overflow-hidden transition-all ${
                isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-white hover:bg-gray-50 shadow-sm'
              } ${expandedCard === index ? 'ring-2 ring-blue-500' : ''}`}
            >
              <button
                onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${SESSION_COLORS[rec.sessionType]} text-white`}>
                  {SESSION_ICONS[rec.sessionType]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rec.title}</h4>
                    {rec.priority === 'high' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">{t('important')}</span>
                    )}
                  </div>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>{rec.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-400'}`}>
                    <Clock className="w-4 h-4 inline mr-1" />{rec.duration} {t('minUnit')}
                  </div>
                  <ChevronRight className={`w-5 h-5 transition-transform ${expandedCard === index ? 'rotate-90' : ''} ${
                    isDark ? 'text-white/40' : 'text-gray-400'
                  }`} />
                </div>
              </button>

              {expandedCard === index && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                  <div className={`mt-3 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{rec.reason}</div>

                  <div className="mt-3 space-y-2">
                    {rec.exercises.map((ex, exIndex) => (
                      <button
                        key={exIndex}
                        onClick={() => handleExerciseClick(ex as OfficeBreakExercise)}
                        className={`w-full p-3 rounded-lg flex items-center justify-between transition-colors ${
                          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isSimpleExercise(ex as OfficeBreakExercise) && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              no camera
                            </span>
                          )}
                          <div>
                            <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {getExerciseName(ex as OfficeBreakExercise)}
                            </div>
                            {ex.note && (
                              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{ex.note}</div>
                            )}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          {getExerciseDisplay(ex as OfficeBreakExercise)}
                        </div>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectRecommendation(rec)}
                    className={`w-full mt-4 py-3 rounded-xl font-medium text-white bg-gradient-to-r ${SESSION_COLORS[rec.sessionType]} flex items-center justify-center gap-2`}
                  >
                    <Zap className="w-5 h-5" />
                    {t('start')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Beginner tip */}
      {profile && profile.totalWorkouts < 5 && (
        <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>{t('forBeginners')}</span>
          </div>
          <p className={`text-xs ${isDark ? 'text-blue-300/70' : 'text-blue-600'}`}>
            {t('startWith5Min')}
          </p>
        </div>
      )}

      {/* Simple exercise instruction modal */}
      {activeOfficeExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {SIMPLE_EXERCISE_INFO[activeOfficeExercise].name}
              </h3>
              <button
                onClick={() => setActiveOfficeExercise(null)}
                className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-gray-500'}`} />
              </button>
            </div>

            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
              <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                {SIMPLE_EXERCISE_INFO[activeOfficeExercise].instruction}
              </p>
            </div>

            <div className={`flex items-center justify-center gap-2 mb-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              <Clock className="w-4 h-4" />
              <span className="text-sm">{SIMPLE_EXERCISE_INFO[activeOfficeExercise].duration} seconds</span>
            </div>

            <button
              onClick={() => setActiveOfficeExercise(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartWorkoutPanel;
