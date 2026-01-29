

import { ExerciseLog, WeightLog, UserSettings, Friend, DailyGoal, GoalType, NutritionLog, Gender, ActivityLevel } from '../types';
import { ApiService } from './api';

const KEYS = {
  EXERCISES: 'fitstream_exercises',
  WEIGHTS: 'fitstream_weights',
  NUTRITION: 'fitstream_nutrition',
  SETTINGS: 'fitstream_settings_v4',
  FRIENDS: 'fitstream_friends',
  USER_ID: 'fitstream_user_id',
  SYNC_STATUS: 'fitstream_sync_status'
};

// --- Avatar Helpers ---
export const generateTotem = (emoji: string, colorFrom: string, colorTo: string, accent: string = '#ffffff') => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorFrom};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorTo};stop-opacity:1" />
        </linearGradient>
        
        <filter id="shadow">
           <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.2" stroke-dasharray="4 2" />
      <text x="50" y="68" font-size="55" text-anchor="middle" style="filter: url(#shadow);">${emoji}</text>
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
    { id: 'tiger', emoji: '🐯', name: 'Tiger' },
    { id: 'dragon', emoji: '🐲', name: 'Dragon' },
    { id: 'eagle', emoji: '🦅', name: 'Eagle' },
    { id: 'gorilla', emoji: '🦍', name: 'Gorilla' },
    { id: 'fox', emoji: '🦊', name: 'Fox' },
    { id: 'bull', emoji: '🐂', name: 'Bull' },
    { id: 'leopard', emoji: '🐆', name: 'Leopard' },
    { id: 'snake', emoji: '🐍', name: 'Snake' },
    { id: 'shark', emoji: '🦈', name: 'Shark' },
    { id: 'scorpion', emoji: '🦂', name: 'Scorpion' },
];

export const AVATAR_THEMES = [
    { id: 'obsidian', from: '#1a1a1a', to: '#000000', accent: '#38bdf8', name: 'Obsidian' },
    { id: 'crimson', from: '#2a0a0a', to: '#000000', accent: '#f87171', name: 'Crimson' },
    { id: 'midnight', from: '#1e1b4b', to: '#020617', accent: '#818cf8', name: 'Midnight' },
    { id: 'gold', from: '#271a00', to: '#000000', accent: '#facc15', name: 'Gold' },
    { id: 'venom', from: '#052e16', to: '#000000', accent: '#4ade80', name: 'Venom' },
    { id: 'neon', from: '#2e0225', to: '#000000', accent: '#e879f9', name: 'Neon' },
];

export const PREDEFINED_AVATARS = AVATAR_ANIMALS.slice(0, 8).map((a, i) => ({
    ...a,
    url: generateTotem(a.emoji, AVATAR_THEMES[i % AVATAR_THEMES.length].from, AVATAR_THEMES[i % AVATAR_THEMES.length].to, AVATAR_THEMES[i % AVATAR_THEMES.length].accent)
}));

const GOAL_DEFAULTS: Record<GoalType, { color: string }> = {
    STEPS: { color: '#10b981' },
    PUSHUPS: { color: '#3b82f6' },
    SQUATS: { color: '#c084fc' },
    SITUPS: { color: '#fb923c' },
    JUMPING_JACKS: { color: '#f43f5e' },
    LUNGES: { color: '#8b5cf6' },
    BURPEES: { color: '#ea580c' },
    DIPS: { color: '#06b6d4' },
    PULLUPS: { color: '#7c3aed' }
};

const DEFAULT_GOALS: DailyGoal[] = [
  { type: 'STEPS', target: 5000, current: 0, isEnabled: true, unit: 'steps', color: GOAL_DEFAULTS.STEPS.color },
  { type: 'PUSHUPS', target: 50, current: 0, isEnabled: true, unit: 'reps', color: GOAL_DEFAULTS.PUSHUPS.color },
  { type: 'SQUATS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.SQUATS.color },
  { type: 'SITUPS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.SITUPS.color },
  { type: 'JUMPING_JACKS', target: 100, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.JUMPING_JACKS.color },
  { type: 'LUNGES', target: 40, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.LUNGES.color },
  { type: 'BURPEES', target: 20, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.BURPEES.color },
  { type: 'DIPS', target: 30, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.DIPS.color },
  { type: 'PULLUPS', target: 20, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.PULLUPS.color },
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
  phoneModel: '',
  phoneWeight: 0,
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
  backendUrl: 'https://api.fitstream.health',
  coachVoice: 'Fenrir' // Default to Male voice
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

  // Set user ID (used after Google login to switch to cloud account)
  setUserId: (newUserId: string): void => {
      localStorage.setItem(KEYS.USER_ID, newUserId);
  },

  // Check if user is logged in with Google
  isLoggedIn: (): boolean => {
      const settings = StorageService.getSettings();
      return !!(settings.email && settings.googleId);
  },

  // Merge cloud data with local storage after Google login
  mergeCloudData: (cloudData: {
      settings?: any;
      exercises?: any[];
      weights?: any[];
      nutrition?: any[];
      isPro?: boolean;
  }): void => {
      // Merge exercises
      if (cloudData.exercises?.length) {
          const localEx = StorageService.getExercises();
          const existingIds = new Set(localEx.map(e => e.id));
          const newEx = cloudData.exercises.filter(e => !existingIds.has(e.id));
          if (newEx.length > 0) {
              const merged = [...localEx, ...newEx].sort((a, b) => a.timestamp - b.timestamp);
              localStorage.setItem(KEYS.EXERCISES, JSON.stringify(merged));
          }
      }

      // Merge weights
      if (cloudData.weights?.length) {
          const localW = StorageService.getWeights();
          const existingIds = new Set(localW.map(w => w.id));
          const newW = cloudData.weights.filter(w => !existingIds.has(w.id));
          if (newW.length > 0) {
              const merged = [...localW, ...newW].sort((a, b) => a.timestamp - b.timestamp);
              localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(merged));
          }
      }

      // Merge nutrition
      if (cloudData.nutrition?.length) {
          const localN = StorageService.getNutritionLogs();
          const existingIds = new Set(localN.map(n => n.id));
          const newN = cloudData.nutrition.filter(n => !existingIds.has(n.id));
          if (newN.length > 0) {
              const merged = [...localN, ...newN].sort((a, b) => a.timestamp - b.timestamp);
              localStorage.setItem(KEYS.NUTRITION, JSON.stringify(merged));
          }
      }

      // Merge settings (cloud takes precedence for isPro)
      if (cloudData.settings || cloudData.isPro !== undefined) {
          const localSettings = StorageService.getSettings();
          const mergedSettings = {
              ...localSettings,
              ...(cloudData.settings || {}),
              isPro: cloudData.isPro || localSettings.isPro
          };
          localStorage.setItem(KEYS.SETTINGS, JSON.stringify(mergedSettings));
      }
  },

  // Logout - clear Google-specific data but keep local data
  logout: (): void => {
      const settings = StorageService.getSettings();
      const newSettings = {
          ...settings,
          email: undefined,
          googleId: undefined
      };
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(newSettings));

      // Generate new anonymous user ID
      const newId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem(KEYS.USER_ID, newId);
  },

  // --- INITIALIZATION ---
  initializeFromBackend: async (): Promise<boolean> => {
      const userId = StorageService.getUserId();
      const settings = StorageService.getSettings();
      
      console.log("📥 Background Sync: Checking server...");
      
      const fullData = await ApiService.fetchFullUserData(userId, settings.backendUrl);
      
      if (fullData) {
          let hasChanges = false;

          // Merge Settings
          if (fullData.settings) {
              const mergedSettings = { ...settings, ...fullData.settings, isPro: fullData.isPro };
              // Preserve locally active backend URL if different
              mergedSettings.backendUrl = settings.backendUrl;
              
              // Only trigger update if something actually changed deep down, but for now strict sync:
              StorageService.saveSettings(mergedSettings, false); 
              hasChanges = true;
          }
          
          // Merge Logs
          const localExercises = StorageService.getExercises();
          const localWeights = StorageService.getWeights();
          const localNutrition = StorageService.getNutritionLogs();
          
          if (fullData.exercises && fullData.exercises.length > 0) {
              const newEx = fullData.exercises.filter((r: any) => !localExercises.find(l => l.id === r.id));
              if (newEx.length > 0) {
                  const mergedEx = [...localExercises, ...newEx].sort((a,b) => a.timestamp - b.timestamp);
                  localStorage.setItem(KEYS.EXERCISES, JSON.stringify(mergedEx));
                  hasChanges = true;
              }
          }
          if (fullData.weights && fullData.weights.length > 0) {
               const newW = fullData.weights.filter((r: any) => !localWeights.find(l => l.id === r.id));
               if (newW.length > 0) {
                   const mergedW = [...localWeights, ...newW].sort((a,b) => a.timestamp - b.timestamp);
                   localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(mergedW));
                   hasChanges = true;
               }
          }
          if (fullData.nutrition && fullData.nutrition.length > 0) {
               const newN = fullData.nutrition.filter((r: any) => !localNutrition.find(l => l.id === r.id));
               if (newN.length > 0) {
                   const mergedN = [...localNutrition, ...newN].sort((a,b) => a.timestamp - b.timestamp);
                   localStorage.setItem(KEYS.NUTRITION, JSON.stringify(mergedN));
                   hasChanges = true;
               }
          }
          
          console.log(`✅ Background Sync complete. Updates found: ${hasChanges}`);
          return hasChanges;
      } else {
          // New user or offline - Push local data if it exists
          const ex = StorageService.getExercises();
          if (ex.length > 0) {
              console.log("📤 Pushing local data to fresh backend account...");
              ApiService.pushBulk(userId, {
                  exercises: ex,
                  weights: StorageService.getWeights(),
                  nutrition: StorageService.getNutritionLogs()
              }, settings.backendUrl);
          }
          return false;
      }
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
    
    // Background Push
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'EXERCISE', log, s.backendUrl);
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
      
      // Background Push
      const s = StorageService.getSettings();
      ApiService.pushLog(StorageService.getUserId(), 'NUTRITION', log, s.backendUrl);
  },

  calculateDailyNeeds: (): { calories: number, water: number } => {
      const s = StorageService.getSettings();
      const weight = StorageService.getLastWeight() || s.targetWeight || 70;
      
      let bmr = (10 * weight) + (6.25 * s.height) - (5 * s.age);
      bmr += s.gender === 'MALE' ? 5 : -161;

      const activityMultipliers: Record<ActivityLevel, number> = {
          'SEDENTARY': 1.2,
          'LIGHT': 1.375,
          'MODERATE': 1.55,
          'VERY_ACTIVE': 1.725
      };

      const calories = Math.round(bmr * (activityMultipliers[s.activityLevel] || 1.2));
      const water = Math.round(weight * 35); 

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
    
    // Logic to update recent entry or add new
    if (lastLog && (log.timestamp - lastLog.timestamp < fiveMinutes)) {
        lastLog.weight = log.weight;
        weights[weights.length - 1] = lastLog;
        // Push update
        const s = StorageService.getSettings();
        ApiService.pushLog(StorageService.getUserId(), 'WEIGHT', lastLog, s.backendUrl);
    } else {
        weights.push(log);
        // Push new
        const s = StorageService.getSettings();
        ApiService.pushLog(StorageService.getUserId(), 'WEIGHT', log, s.backendUrl);
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
    
    // Check for new goals that might be missing in existing user settings
    const currentGoalTypes = new Set(settings.goals.map((g: DailyGoal) => g.type));
    DEFAULT_GOALS.forEach(defGoal => {
        if (!currentGoalTypes.has(defGoal.type)) {
            settings.goals.push(defGoal);
        }
    });

    settings.goals.forEach((g: DailyGoal) => {
        if (!g.color) g.color = GOAL_DEFAULTS[g.type]?.color || '#94a3b8';
    });
    if (!settings.avatar) settings.avatar = DEFAULT_SETTINGS.avatar;
    if (settings.isPro === undefined) settings.isPro = false;
    
    if (!settings.height) settings.height = 175;
    if (!settings.gender) settings.gender = 'MALE';
    if (!settings.activityLevel) settings.activityLevel = 'MODERATE';
    if (!settings.referenceObject) settings.referenceObject = '';
    if (!settings.phoneModel) settings.phoneModel = '';
    if (settings.phoneWeight === undefined) settings.phoneWeight = 0;
    if (!settings.installDate) settings.installDate = new Date().toISOString();
    if (!settings.backendUrl) settings.backendUrl = DEFAULT_SETTINGS.backendUrl;
    if (!settings.coachVoice) settings.coachVoice = DEFAULT_SETTINGS.coachVoice;
    
    return settings;
  },

  saveSettings: (settings: UserSettings, pushToBackend: boolean = true) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    if (pushToBackend) {
        ApiService.syncUser(StorageService.getUserId(), settings, settings.backendUrl);
    }
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
          StorageService.saveSettings(settings); // This triggers sync
      }
  },

  updateSteps: (steps: number) => {
      const settings = StorageService.getSettings();
      const stepGoal = settings.goals.find(g => g.type === 'STEPS');
      if (stepGoal) {
          stepGoal.current += steps;
          StorageService.saveSettings(settings); // Triggers sync
      }
  },
  
  syncExternalSteps: (stepsToAdd: number) => {
      const settings = StorageService.getSettings();
      const stepGoal = settings.goals.find(g => g.type === 'STEPS');
      if (stepGoal) {
          stepGoal.current += stepsToAdd;
          settings.connectedPlatforms.lastSync = new Date().toISOString();
          StorageService.saveSettings(settings); // Triggers sync
      }
  },

  updateStreak: () => {
      const settings = StorageService.getSettings();
      const lastActive = new Date(settings.lastActiveDate);
      const today = new Date();
      
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