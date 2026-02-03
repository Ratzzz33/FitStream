import { useState, useEffect, useCallback } from 'react';
import {
  AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel,
  t, DailyGoal, GoalType, UserSettings
} from '@fitstream/shared';
import {
  Dumbbell, Play, BarChart3, Settings, Trophy, Target, Flame,
  TrendingUp, ChevronRight
} from 'lucide-react';
import { StorageService } from './services/storageService';
import { WorkoutSession } from './components/WorkoutSession';
import { AchievementRing } from './components/AchievementRings';
import { GoalSettings } from './components/GoalSettings';
import { GoalDetailsModal } from './components/GoalDetailsModal';
import { HealthConnect } from './components/HealthConnect';
import { getMotivation } from './services/geminiService';

// Goal label helper
const getLabelForType = (type: GoalType): string => {
  switch (type) {
    case 'CALORIES': return t('calories');
    case 'WATER': return t('water');
    case 'STEPS': return t('steps');
    case 'PUSHUPS': return t('pushups');
    case 'SQUATS': return t('squats');
    case 'SITUPS': return t('situps');
    case 'JUMPING_JACKS': return t('jumpingJacks');
    case 'LUNGES': return t('lunges');
    case 'BURPEES': return t('burpees');
    case 'DIPS': return t('dips');
    case 'PULLUPS': return t('pullups');
    default: return type;
  }
};

function AICoachApp() {
  const { theme } = useTheme();
  const [view, setView] = useState<'workout' | 'progress' | 'settings'>('workout');
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [showWorkoutSession, setShowWorkoutSession] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);
  const [motivation, setMotivation] = useState<string>('');

  const isDark = theme === 'dark';
  const weeklyCount = StorageService.getWeeklyWorkoutCount();
  const enabledGoals = settings.goals.filter(g => g.isEnabled);

  // Reload settings
  const refreshSettings = useCallback(() => {
    setSettings(StorageService.getSettings());
  }, []);

  // Load AI motivation on mount
  useEffect(() => {
    const loadMotivation = async () => {
      try {
        const exercises = StorageService.getExercises();
        const todayReps = exercises
          .filter(e => e.date === new Date().toISOString().split('T')[0])
          .reduce((acc, e) => acc + e.reps, 0);
        const msg = await getMotivation(settings.streak || 0, todayReps);
        setMotivation(msg);
      } catch {
        setMotivation(t('keepMoving') || 'Every rep counts. Keep pushing!');
      }
    };
    loadMotivation();
  }, [settings.streak]);

  // Workout session overlay
  if (showWorkoutSession) {
    return (
      <WorkoutSession
        onFinish={() => {
          setShowWorkoutSession(false);
          refreshSettings();
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="text-purple-400" size={24} />
          AI Coach
        </h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {t('poseDetectionTrainer') || 'Pose Detection Personal Trainer'}
        </p>
      </header>

      <main className="px-4">
        {/* ==================== WORKOUT VIEW ==================== */}
        {view === 'workout' && (
          <div className="space-y-4">
            {/* Start Workout Button */}
            <button
              onClick={() => setShowWorkoutSession(true)}
              className="w-full p-6 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex flex-col items-center gap-3 shadow-lg shadow-purple-500/25 active:scale-[0.98] transition-transform"
            >
              <Play size={48} className="text-white" fill="white" />
              <span className="text-lg font-bold">{t('startWorkout') || 'Start Workout'}</span>
              <span className="text-sm text-purple-200">
                {t('aiTracksForm') || 'AI tracks your form with camera'}
              </span>
            </button>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                <Trophy size={24} className="text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{settings.streak || 0}</div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('daysStreak') || 'Day Streak'}
                </div>
              </div>
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                <Dumbbell size={24} className="text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{weeklyCount}</div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('thisWeek') || 'This Week'}
                </div>
              </div>
            </div>

            {/* Motivation */}
            {motivation && (
              <div className={`p-4 rounded-xl ${
                isDark
                  ? 'bg-gradient-to-r from-purple-900/40 to-indigo-900/40'
                  : 'bg-gradient-to-r from-purple-50 to-indigo-50'
              }`}>
                <p className={`text-sm italic ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>
                  "{motivation}"
                </p>
              </div>
            )}

            {/* Achievement Rings */}
            {enabledGoals.length > 0 && (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Target size={18} className="text-purple-400" />
                    {t('todayGoals') || 'Today\'s Goals'}
                  </h3>
                  <button
                    onClick={() => setShowGoalSettings(true)}
                    className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
                  >
                    {t('edit') || 'Edit'}
                  </button>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {enabledGoals.slice(0, 4).map(goal => (
                    <button
                      key={goal.type}
                      onClick={() => setSelectedGoal(goal)}
                      className="transition-transform hover:scale-105"
                    >
                      <AchievementRing
                        radius={45}
                        stroke={6}
                        progress={goal.current}
                        color={goal.color}
                        total={goal.target}
                        label={getLabelForType(goal.type)}
                        compact
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recent exercises */}
            {(() => {
              const recent = StorageService.getExercises().slice(-3).reverse();
              if (recent.length === 0) return null;
              return (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                  <h3 className={`font-bold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Flame size={18} className="text-orange-400" />
                    {t('recentActivity') || 'Recent Activity'}
                  </h3>
                  <div className="space-y-2">
                    {recent.map(ex => (
                      <div
                        key={ex.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-white/5' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {ex.exerciseName}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {ex.date}
                          </div>
                        </div>
                        <div className={`font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {ex.reps}x
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== PROGRESS VIEW ==================== */}
        {view === 'progress' && (
          <div className="space-y-4">
            <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <BarChart3 size={20} className="text-purple-400" />
              {t('progress') || 'Progress'}
            </h2>

            {/* Streak & Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-500'}`}>
                  {settings.streak || 0}
                </div>
                <div className={`text-xs ${isDark ? 'text-orange-300/70' : 'text-orange-600'}`}>
                  {t('streak') || 'Streak'}
                </div>
              </div>
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-500'}`}>
                  {weeklyCount}
                </div>
                <div className={`text-xs ${isDark ? 'text-purple-300/70' : 'text-purple-600'}`}>
                  {t('thisWeek') || 'This Week'}
                </div>
              </div>
              <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-green-900/30' : 'bg-green-50'}`}>
                <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-500'}`}>
                  {StorageService.getExercises().length}
                </div>
                <div className={`text-xs ${isDark ? 'text-green-300/70' : 'text-green-600'}`}>
                  {t('totalWorkouts') || 'Total'}
                </div>
              </div>
            </div>

            {/* Goals with rings */}
            {enabledGoals.length > 0 && (
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('dailyGoals') || 'Daily Goals'}
                  </h3>
                  <button
                    onClick={() => setShowGoalSettings(true)}
                    className={`text-xs flex items-center gap-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}
                  >
                    <Settings size={12} />
                    {t('manage') || 'Manage'}
                  </button>
                </div>
                <div className="space-y-3">
                  {enabledGoals.map(goal => {
                    const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
                    return (
                      <button
                        key={goal.type}
                        onClick={() => setSelectedGoal(goal)}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                          isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <AchievementRing
                          radius={28}
                          stroke={4}
                          progress={goal.current}
                          color={goal.color}
                          total={goal.target}
                        />
                        <div className="flex-1 text-left">
                          <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {getLabelForType(goal.type)}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {goal.current} / {goal.target}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${pct >= 100 ? 'text-green-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {pct}%
                          </span>
                          <ChevronRight size={16} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Health Connect */}
            <HealthConnect settings={settings} onUpdate={refreshSettings} />

            {/* Exercise history */}
            {(() => {
              const exercises = StorageService.getExercises();
              if (exercises.length === 0) {
                return (
                  <div className={`text-center p-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <TrendingUp size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="font-medium">{t('noWorkoutsYet') || 'No workouts yet'}</p>
                    <p className="text-sm mt-1">{t('startTraining') || 'Start training to see your progress!'}</p>
                  </div>
                );
              }

              const recentByDate = exercises.slice(-20).reverse();
              return (
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                  <h3 className={`font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('exerciseHistory') || 'Exercise History'}
                  </h3>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {recentByDate.map(ex => (
                      <div
                        key={ex.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          isDark ? 'bg-white/5' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <div className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {ex.exerciseName}
                          </div>
                          <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {ex.date} {ex.feedback && `- ${ex.feedback}`}
                          </div>
                        </div>
                        <div className={`font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {ex.reps}x
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ==================== SETTINGS VIEW ==================== */}
        {view === 'settings' && <SettingsPanel appName="AI Coach" />}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 inset-x-0 backdrop-blur border-t px-6 py-3 flex justify-around z-20 ${
        isDark ? 'bg-gray-900/95 border-white/10' : 'bg-white/95 border-gray-200'
      }`}>
        <button
          onClick={() => setView('workout')}
          className={`flex flex-col items-center gap-1 ${view === 'workout' ? 'text-purple-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}
        >
          <Dumbbell size={20} />
          <span className="text-xs">{t('workout') || 'Workout'}</span>
        </button>
        <button
          onClick={() => setView('progress')}
          className={`flex flex-col items-center gap-1 ${view === 'progress' ? 'text-purple-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}
        >
          <BarChart3 size={20} />
          <span className="text-xs">{t('progress') || 'Progress'}</span>
        </button>
        <button
          onClick={() => setView('settings')}
          className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-purple-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}
        >
          <Settings size={20} />
          <span className="text-xs">{t('settings') || 'Settings'}</span>
        </button>
      </nav>

      {/* Modals */}
      {showGoalSettings && (
        <GoalSettings
          onClose={() => setShowGoalSettings(false)}
          onUpdate={refreshSettings}
        />
      )}

      {selectedGoal && (
        <GoalDetailsModal
          goal={selectedGoal}
          label={getLabelForType(selectedGoal.type)}
          onClose={() => setSelectedGoal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme="dark">
        <AICoachApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
