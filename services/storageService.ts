
import { ExerciseLog, WeightLog, UserSettings, Friend, DailyGoal, GoalType, NutritionLog, Gender, ActivityLevel } from '../types';
import { ApiService } from './api';

const KEYS = {
  EXERCISES: 'fitstream_exercises',
  WEIGHTS: 'fitstream_weights',
  NUTRITION: 'fitstream_nutrition',
  SETTINGS: 'fitstream_settings_v4',
  FRIENDS: 'fitstream_friends',
  USER_ID: 'fitstream_user_id'
};

// --- Avatar Helpers ---
export const generateTotem = (emoji: string, colorFrom: string, colorTo: string) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorFrom};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorTo};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#grad)" />
      <text x="50" y="55" font-size="50" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>`.trim();
    
    const encoder = new TextEncoder();
    const data = encoder.encode(svg);
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`;
};

export const AVATAR_ANIMALS = [
    { id: 'wolf', emoji: '🐺', name: 'Wolf' },
    { id: 'lion', emoji: '🦁', name: 'Lion' },
    { id: 'eagle', emoji: '🦅', name: 'Eagle' },
    { id: 'bear', emoji: '🐻', name: 'Bear' },
    { id: 'tiger', emoji: '🐯', name: 'Tiger' },
    { id: 'fox', emoji: '🦊', name: 'Fox' },
    { id: 'gorilla', emoji: '🦍', name: 'Gorilla' },
    { id: 'owl', emoji: '🦉', name: 'Owl' },
    { id: 'panda', emoji: '🐼', name: 'Panda' },
    { id: 'koala', emoji: '🐨', name: 'Koala' },
    { id: 'cat', emoji: '🐱', name: 'Cat' },
    { id: 'dog', emoji: '🐶', name: 'Dog' },
    { id: 'dragon', emoji: '🐲', name: 'Dragon' },
    { id: 'unicorn', emoji: '🦄', name: 'Unicorn' },
    { id: 'rabbit', emoji: '🐰', name: 'Rabbit' },
    { id: 'turtle', emoji: '🐢', name: 'Turtle' },
    { id: 'shark', emoji: '🦈', name: 'Shark' },
    { id: 'butterfly', emoji: '🦋', name: 'Butterfly' },
];

export const AVATAR_THEMES = [
    { id: 'forest', from: '#4ade80', to: '#065f46', name: 'Forest' },
    { id: 'sun', from: '#fbbf24', to: '#b45309', name: 'Sun' },
    { id: 'ocean', from: '#60a5fa', to: '#1e3a8a', name: 'Ocean' },
    { id: 'royal', from: '#a78bfa', to: '#581c87', name: 'Royal' },
    { id: 'fire', from: '#f87171', to: '#991b1b', name: 'Fire' },
    { id: 'midnight', from: '#94a3b8', to: '#1e293b', name: 'Midnight' },
    { id: 'candy', from: '#f472b6', to: '#be185d', name: 'Candy' },
    { id: 'earth', from: '#a3e635', to: '#3f6212', name: 'Earth' },
];

export const PREDEFINED_AVATARS = AVATAR_ANIMALS.slice(0, 8).map((a, i) => ({
    ...a,
    url: generateTotem(a.emoji, AVATAR_THEMES[i % AVATAR_THEMES.length].from, AVATAR_THEMES[i % AVATAR_THEMES.length].to)
}));

const GOAL_DEFAULTS: Record<GoalType, { color: string }> = {
    STEPS: { color: '#10b981' },
    PUSHUPS: { color: '#3b82f6' },
    SQUATS: { color: '#c084fc' },
    SITUPS: { color: '#fb923c' },
    JUMPING_JACKS: { color: '#f43f5e' },
    LUNGES: { color: '#8b5cf6' },
    BURPEES: { color: '#ea580c' }
};

const DEFAULT_GOALS: DailyGoal[] = [
  { type: 'STEPS', target: 5000, current: 0, isEnabled: true, unit: 'steps', color: GOAL_DEFAULTS.STEPS.color },
  { type: 'PUSHUPS', target: 50, current: 0, isEnabled: true, unit: 'reps', color: GOAL_DEFAULTS.PUSHUPS.color },
  { type: 'SQUATS', target: 50, current: 0, isEnabled: true, unit: 'reps', color: GOAL_DEFAULTS.SQUATS.color },
  { type: 'SITUPS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.SITUPS.color },
  { type: 'JUMPING_JACKS', target: 100, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.JUMPING_JACKS.color },
  { type: 'LUNGES', target: 40, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.LUNGES.color },
  { type: 'BURPEES', target: 20, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.BURPEES.color },
];

const DEFAULT_SETTINGS: UserSettings = {
  name: 'User',
  avatar: PREDEFINED_AVATARS[0].url, 
  age: 25,
  height: 175,
  gender: 'MALE',
  activityLevel: 'MODERATE',
  installDate: new Date().toISOString(),
  referenceObject: '',
  referenceDimensions: '',
  phoneModel: 'Unknown Device',
  goals: DEFAULT_GOALS,
  targetWeight: 70,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  theme: 'dark',
  connectedPlatforms: {
      googleFit: false,
      appleHealth: false,
      lastSync: null
  },
  isPro: false,
  backendUrl: 'https://fitstream-production.up.railway.app'
};

export const StorageService = {
  // --- Auth / User ID Logic ---
  getUserId: (): string => {
      let id = localStorage.getItem(KEYS.USER_ID);
      if (!id) {
          id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
          localStorage.setItem(KEYS.USER_ID, id);
      }
      return id;
  },

  syncWithBackend: async () => {
      const userId = StorageService.getUserId();
      const settings = StorageService.getSettings();
      
      const result = await ApiService.syncUser(userId, settings, settings.backendUrl);
      
      if (result) {
          // Update local status based on server truth
          if (settings.isPro !== result.isPro) {
              settings.isPro = result.isPro;
              StorageService.saveSettings(settings);
              return true; // Status changed
          }
      }
      return false;
  },

  // --- Exercises ---
  getExercises: (): ExerciseLog[] => {
    const data = localStorage.getItem(KEYS.EXERCISES);
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
    localStorage.setItem(KEYS.EXERCISES, JSON.stringify(exercises));
    StorageService.updateGoalProgress(log.exerciseName, log.reps);
    StorageService.updateStreak();
  },

  // --- Nutrition ---
  getNutritionLogs: (): NutritionLog[] => {
      const data = localStorage.getItem(KEYS.NUTRITION);
      return data ? JSON.parse(data) : [];
  },

  getTodayNutrition: (): { calories: number, water: number } => {
      const logs = StorageService.getNutritionLogs();
      const today = new Date().toISOString().split('T')[0];
      return logs
        .filter(l => l.date === today)
        .reduce((acc, log) => {
            if (log.type === 'FOOD') acc.calories += log.calories;
            if (log.type === 'WATER') acc.water += (log.amount || 0);
            return acc;
        }, { calories: 0, water: 0 });
  },

  saveNutrition: (log: NutritionLog) => {
      const logs = StorageService.getNutritionLogs();
      logs.push(log);
      localStorage.setItem(KEYS.NUTRITION, JSON.stringify(logs));
  },

  calculateDailyNeeds: (): { calories: number, water: number } => {
      const s = StorageService.getSettings();
      const weight = StorageService.getLastWeight() || s.targetWeight || 70;
      
      // Mifflin-St Jeor Equation
      let bmr = (10 * weight) + (6.25 * s.height) - (5 * s.age);
      bmr += s.gender === 'MALE' ? 5 : -161;

      const activityMultipliers: Record<ActivityLevel, number> = {
          'SEDENTARY': 1.2,
          'LIGHT': 1.375,
          'MODERATE': 1.55,
          'VERY_ACTIVE': 1.725
      };

      const calories = Math.round(bmr * (activityMultipliers[s.activityLevel] || 1.2));
      const water = Math.round(weight * 35); // Approx 35ml per kg

      return { calories, water };
  },

  // --- Weights ---
  getWeights: (): WeightLog[] => {
    const data = localStorage.getItem(KEYS.WEIGHTS);
    return data ? JSON.parse(data) : [];
  },

  getLastWeight: (): number => {
      const weights = StorageService.getWeights();
      return weights.length > 0 ? weights[weights.length - 1].weight : 0;
  },

  saveWeight: (log: WeightLog) => {
    const weights = StorageService.getWeights();
    const lastLog = weights[weights.length - 1];
    const fiveMinutes = 5 * 60 * 1000;
    
    if (lastLog && (log.timestamp - lastLog.timestamp < fiveMinutes)) {
        lastLog.weight = log.weight;
        weights[weights.length - 1] = lastLog;
    } else {
        weights.push(log);
    }
    weights.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(weights));
  },

  // --- Settings ---
  getSettings: (): UserSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    
    const settings = JSON.parse(data);
    
    // Migrations
    if (!settings.goals || settings.goals.length === 0) settings.goals = DEFAULT_GOALS;
    settings.goals.forEach((g: DailyGoal) => {
        if (!g.color) g.color = GOAL_DEFAULTS[g.type]?.color || '#94a3b8';
    });
    if (!settings.avatar) settings.avatar = DEFAULT_SETTINGS.avatar;
    if (settings.isPro === undefined) settings.isPro = false;
    
    // New Fields Migration
    if (!settings.height) settings.height = 175;
    if (!settings.gender) settings.gender = 'MALE';
    if (!settings.activityLevel) settings.activityLevel = 'MODERATE';
    if (!settings.referenceObject) settings.referenceObject = '';
    
    // Migration for trial tracking
    if (!settings.installDate) settings.installDate = new Date().toISOString();

    // Auto-update to production URL if empty or undefined
    if (!settings.backendUrl) {
        settings.backendUrl = DEFAULT_SETTINGS.backendUrl;
    }
    
    return settings;
  },

  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

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

  updateStreak: () => {
      const settings = StorageService.getSettings();
      const lastActive = new Date(settings.lastActiveDate);
      const today = new Date();
      
      // Reset hours to compare dates only
      lastActive.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      
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

  getFriends: (): Friend[] => {
      return [
          { id: '1', name: 'Alex', score: 120, avatar: PREDEFINED_AVATARS[1].url },
          { id: '2', name: 'Jordan', score: 85, avatar: PREDEFINED_AVATARS[2].url },
          { id: '3', name: 'Casey', score: 45, avatar: PREDEFINED_AVATARS[3].url },
      ];
  }
};
