import {
  ExerciseLog, UserSettings, Friend, DailyGoal, GoalType,
  BaseStorageService, PREDEFINED_AVATARS, GOAL_DEFAULTS, DEFAULT_GOALS, DEFAULT_SETTINGS, KEYS,
  ApiService,
} from '@fitstream/shared';

const EXERCISE_KEY = 'fitstream_exercises';

export const StorageService = {
  // --- Delegate auth/settings to BaseStorageService ---
  getUserId: BaseStorageService.getUserId,
  setUserId: BaseStorageService.setUserId,
  isLoggedIn: BaseStorageService.isLoggedIn,
  getSettings: BaseStorageService.getSettings,
  saveSettings: BaseStorageService.saveSettings,
  logout: BaseStorageService.logout,

  // --- Exercises ---
  getExercises: (): ExerciseLog[] => {
    const data = localStorage.getItem(EXERCISE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getWeeklyWorkoutCount: (): number => {
    const exercises = StorageService.getExercises();
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    startOfWeek.setHours(0, 0, 0, 0);
    return exercises.filter(e => e.timestamp >= startOfWeek.getTime()).length;
  },

  saveExercise: (log: ExerciseLog) => {
    const exercises = StorageService.getExercises();
    exercises.push(log);
    localStorage.setItem(EXERCISE_KEY, JSON.stringify(exercises));
    StorageService.updateGoalProgress(log.exerciseName, log.reps);
    StorageService.updateStreak();

    // Background Push
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'EXERCISE', log, s.backendUrl);
  },

  // --- Goals ---
  updateGoalProgress: (exerciseName: string, amount: number) => {
    const settings = StorageService.getSettings();
    const normalized = exerciseName.toUpperCase().replace('-', '').replace('_', '');
    const goalIndex = settings.goals.findIndex(g => {
      const gName = g.type.replace('_', '');
      return normalized.includes(gName) || gName.includes(normalized);
    });
    if (goalIndex !== -1) {
      settings.goals[goalIndex].current += amount;
      StorageService.saveSettings(settings);
    }
  },

  updateSteps: (steps: number) => {
    const settings = StorageService.getSettings();
    const stepGoal = settings.goals.find(g => g.type === 'STEPS');
    if (stepGoal) {
      stepGoal.current += steps;
      StorageService.saveSettings(settings);
    }
  },

  syncExternalSteps: (stepsToAdd: number) => {
    const settings = StorageService.getSettings();
    const stepGoal = settings.goals.find(g => g.type === 'STEPS');
    if (stepGoal) {
      stepGoal.current += stepsToAdd;
      settings.connectedPlatforms.lastSync = new Date().toISOString();
      StorageService.saveSettings(settings);
    }
  },

  // --- Streak ---
  updateStreak: () => {
    const settings = StorageService.getSettings();
    const lastActiveDate = new Date(settings.lastActiveDate);
    const lastActive = isNaN(lastActiveDate.getTime()) ? new Date() : lastActiveDate;
    const today = new Date();

    lastActive.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(today.getTime() - lastActive.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      settings.streak += 1;
    } else if (diffDays > 1) {
      settings.streak = 1;
    }

    settings.lastActiveDate = new Date().toISOString().split('T')[0];
    StorageService.saveSettings(settings);
  },

  // --- Friends (for social/leaderboard) ---
  getFriends: (): Friend[] => {
    return [
      { id: '1', name: 'Alex', score: 120, avatar: PREDEFINED_AVATARS[1].url },
      { id: '2', name: 'Jordan', score: 85, avatar: PREDEFINED_AVATARS[2].url },
      { id: '3', name: 'Casey', score: 45, avatar: PREDEFINED_AVATARS[3].url },
    ];
  },
};
