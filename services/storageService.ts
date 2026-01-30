

import {
  ExerciseLog, WeightLog, UserSettings, Friend, DailyGoal, GoalType, NutritionLog, Gender, ActivityLevel, WeightGoal,
  KitchenStorage, InventoryItem, Recipe, CookedMeal, Leftover, StorageType, StoragePhoto
} from '../types';
import { ApiService } from './api';

const KEYS = {
  EXERCISES: 'fitstream_exercises',
  WEIGHTS: 'fitstream_weights',
  NUTRITION: 'fitstream_nutrition',
  SETTINGS: 'fitstream_settings_v4',
  FRIENDS: 'fitstream_friends',
  USER_ID: 'fitstream_user_id',
  SYNC_STATUS: 'fitstream_sync_status',
  // Smart Kitchen
  KITCHEN_STORAGES: 'fitstream_kitchen_storages',
  INVENTORY: 'fitstream_inventory',
  COOKING_HISTORY: 'fitstream_cooking_history',
  LEFTOVERS: 'fitstream_leftovers',
  RECENT_RECIPES: 'fitstream_recent_recipes',
  SAVED_RECIPES: 'fitstream_saved_recipes'
};

// Default kitchen storages
const DEFAULT_STORAGES: KitchenStorage[] = [
  { id: 'fridge', name: 'Холодильник', type: 'fridge', lastUpdated: new Date().toISOString() },
  { id: 'cabinet', name: 'Шкаф', type: 'cabinet', lastUpdated: new Date().toISOString() },
  { id: 'freezer', name: 'Морозилка', type: 'freezer', lastUpdated: new Date().toISOString() }
];

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
    PULLUPS: { color: '#7c3aed' },
    PLANK: { color: '#14b8a6' },
    MOUNTAIN_CLIMBERS: { color: '#f59e0b' },
    CRUNCHES: { color: '#ec4899' },
    LEG_RAISES: { color: '#6366f1' },
    BICYCLE_CRUNCHES: { color: '#84cc16' },
    HIGH_KNEES: { color: '#ef4444' }
};

const DEFAULT_GOALS: DailyGoal[] = [
  { type: 'STEPS', target: 5000, current: 0, isEnabled: true, unit: 'steps', color: GOAL_DEFAULTS.STEPS.color },
  { type: 'PUSHUPS', target: 50, current: 0, isEnabled: true, unit: 'reps', color: GOAL_DEFAULTS.PUSHUPS.color },
  { type: 'SQUATS', target: 50, current: 0, isEnabled: true, unit: 'reps', color: GOAL_DEFAULTS.SQUATS.color },
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
  coachVoice: 'Fenrir', // Default to Male voice
  shoppingPreferences: {
    daysCount: 3,
    peopleCount: 2,
    cookingDifficulty: 'easy' as const,
    maxCookingTime: 'quick' as const,
    budget: undefined
  }
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

  calculateDailyNeeds: (): { calories: number, water: number, tdee: number, deficit: number, weightGoal: WeightGoal } => {
      const s = StorageService.getSettings();
      const currentWeight = StorageService.getLastWeight() || s.targetWeight || 70;
      const targetWeight = s.targetWeight || currentWeight;

      // Calculate BMR using Mifflin-St Jeor formula
      let bmr = (10 * currentWeight) + (6.25 * s.height) - (5 * s.age);
      bmr += s.gender === 'MALE' ? 5 : -161;

      const activityMultipliers: Record<ActivityLevel, number> = {
          'SEDENTARY': 1.2,
          'LIGHT': 1.375,
          'MODERATE': 1.55,
          'VERY_ACTIVE': 1.725
      };

      // TDEE = Total Daily Energy Expenditure (maintenance calories)
      const tdee = Math.round(bmr * (activityMultipliers[s.activityLevel] || 1.2));

      // Determine weight goal from settings or auto-detect
      let weightGoal: WeightGoal = s.weightGoal || 'MAINTAIN';
      const weightDifference = currentWeight - targetWeight;

      // Auto-detect goal if not explicitly set
      if (!s.weightGoal) {
          if (weightDifference > 2) {
              weightGoal = 'LOSE';
          } else if (weightDifference < -2) {
              weightGoal = 'GAIN';
          } else {
              weightGoal = 'MAINTAIN';
          }
      }

      // Calculate calorie adjustment based on goal
      // 500 kcal deficit/surplus = ~0.5 kg/week
      // Scale deficit based on how much weight to lose (more aggressive for obesity)
      let deficit = 0;
      if (weightGoal === 'LOSE') {
          // Calculate BMI to determine safe deficit
          const heightM = s.height / 100;
          const bmi = currentWeight / (heightM * heightM);

          if (bmi >= 35) {
              // Severe obesity: can safely have larger deficit (750-1000 kcal)
              deficit = 750;
          } else if (bmi >= 30) {
              // Obesity: moderate deficit (600-750 kcal)
              deficit = 600;
          } else if (bmi >= 25) {
              // Overweight: standard deficit (500 kcal)
              deficit = 500;
          } else {
              // Normal weight: smaller deficit (300-400 kcal)
              deficit = 400;
          }
      } else if (weightGoal === 'GAIN') {
          deficit = -300; // Surplus for gaining
      }

      let calories = tdee - deficit;

      // Ensure minimum safe calories
      const minCalories = s.gender === 'MALE' ? 1500 : 1200;
      calories = Math.max(calories, minCalories);

      // Water needs (ml per day)
      const water = Math.round(currentWeight * 35);

      return {
          calories: Math.round(calories),
          water,
          tdee,
          deficit,
          weightGoal
      };
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
    if (!settings.installDate || isNaN(new Date(settings.installDate).getTime())) {
      settings.installDate = new Date().toISOString();
    }
    if (!settings.lastActiveDate || isNaN(new Date(settings.lastActiveDate).getTime())) {
      settings.lastActiveDate = new Date().toISOString().split('T')[0];
    }
    // Validate backendUrl - reset if malformed (e.g., missing subdomain like "https://.fitstream.health")
    if (!settings.backendUrl ||
        settings.backendUrl.includes('://.') ||
        !settings.backendUrl.match(/^https?:\/\/[a-zA-Z0-9]/)) {
      settings.backendUrl = DEFAULT_SETTINGS.backendUrl;
    }
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
      const lastActiveDate = new Date(settings.lastActiveDate);
      const lastActive = isNaN(lastActiveDate.getTime()) ? new Date() : lastActiveDate;
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
  },

  // === SMART KITCHEN: Storages ===

  getStorages: (): KitchenStorage[] => {
    const data = localStorage.getItem(KEYS.KITCHEN_STORAGES);
    const storages = data ? JSON.parse(data) : DEFAULT_STORAGES;
    // Миграция: конвертировать старый single photo в массив
    return storages.map((s: KitchenStorage) => {
      if (s.photo && (!s.photos || s.photos.length === 0)) {
        s.photos = [{
          id: `photo_migrated_${Date.now()}`,
          base64: s.photo,
          createdAt: s.lastUpdated || new Date().toISOString()
        }];
      }
      return s;
    });
  },

  // Deprecated: для обратной совместимости
  saveStoragePhoto: (storageId: string, photo: string): void => {
    const photoId = StorageService.addStoragePhoto(storageId, photo);
    // Также обновляем старое поле для совместимости
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx !== -1) {
      storages[idx].photo = photo;
      localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
    }
  },

  // === Мультифото методы ===

  addStoragePhoto: (storageId: string, photoBase64: string, label?: string): string => {
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx === -1) return '';

    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPhoto: StoragePhoto = {
      id: photoId,
      base64: photoBase64,
      createdAt: new Date().toISOString(),
      label
    };

    if (!storages[idx].photos) {
      storages[idx].photos = [];
    }
    storages[idx].photos!.push(newPhoto);
    storages[idx].lastUpdated = new Date().toISOString();
    // Также обновляем legacy поле (последнее фото)
    storages[idx].photo = photoBase64;

    localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
    return photoId;
  },

  getStoragePhotos: (storageId: string): StoragePhoto[] => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    return storage?.photos || [];
  },

  removeStoragePhoto: (storageId: string, photoId: string): void => {
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx === -1 || !storages[idx].photos) return;

    storages[idx].photos = storages[idx].photos!.filter(p => p.id !== photoId);
    storages[idx].lastUpdated = new Date().toISOString();

    // Обновляем legacy поле (последнее фото или пусто)
    storages[idx].photo = storages[idx].photos!.length > 0
      ? storages[idx].photos![storages[idx].photos!.length - 1].base64
      : undefined;

    // Удаляем inventory items привязанные только к этому фото
    const inventory = StorageService.getInventory();
    const updatedInventory = inventory.filter(item => {
      // Оставляем если:
      // 1. Продукт не из фото
      // 2. Продукт с другого фото
      // 3. Продукт виден на нескольких фото (удаляем только эту позицию)
      if (item.source !== 'photo') return true;
      if (item.photoId !== photoId) {
        // Проверяем mergedFromPhotoIds
        if (item.mergedFromPhotoIds?.includes(photoId)) {
          item.mergedFromPhotoIds = item.mergedFromPhotoIds.filter(id => id !== photoId);
          // Если продукт всё ещё виден на других фото — оставляем
          return item.mergedFromPhotoIds.length > 0 || (item.photoId && item.photoId !== photoId);
        }
        return true;
      }
      // Если только на этом фото — удаляем
      return item.mergedFromPhotoIds && item.mergedFromPhotoIds.length > 0;
    });

    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(updatedInventory));
    localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
  },

  updateStoragePhotoLabel: (storageId: string, photoId: string, label: string): void => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    if (!storage?.photos) return;

    const photo = storage.photos.find(p => p.id === photoId);
    if (photo) {
      photo.label = label;
      localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
    }
  },

  // Заменить фото (тот же ракурс, новое фото)
  replaceStoragePhoto: (storageId: string, oldPhotoId: string, newPhotoBase64: string): string => {
    const storages = StorageService.getStorages();
    const storage = storages.find(s => s.id === storageId);
    if (!storage?.photos) return '';

    const photoIdx = storage.photos.findIndex(p => p.id === oldPhotoId);
    if (photoIdx === -1) return '';

    // Сохраняем label от старого фото
    const oldLabel = storage.photos[photoIdx].label;

    // Создаём новое фото с тем же ID (чтобы сохранить связи с inventory)
    const newPhotoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storage.photos[photoIdx] = {
      id: newPhotoId,
      base64: newPhotoBase64,
      createdAt: new Date().toISOString(),
      label: oldLabel
    };

    storage.lastUpdated = new Date().toISOString();
    storage.photo = newPhotoBase64; // legacy

    // Обновляем inventory items — переносим со старого photoId на новый
    const inventory = StorageService.getInventory();
    inventory.forEach(item => {
      if (item.photoId === oldPhotoId) {
        item.photoId = newPhotoId;
      }
      if (item.mergedFromPhotoIds?.includes(oldPhotoId)) {
        item.mergedFromPhotoIds = item.mergedFromPhotoIds.map(id =>
          id === oldPhotoId ? newPhotoId : id
        );
      }
    });

    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));

    return newPhotoId;
  },

  // Удалить depleted items для фото (после пересканирования)
  clearDepletedForPhoto: (photoId: string): void => {
    const inventory = StorageService.getInventory().filter(item => {
      // Удаляем depleted items только для этого фото
      if (item.depleted && item.photoId === photoId) {
        return false;
      }
      // Или если в mergedFromPhotoIds
      if (item.depleted && item.mergedFromPhotoIds?.includes(photoId)) {
        // Удаляем этот photoId из merged
        item.mergedFromPhotoIds = item.mergedFromPhotoIds.filter(id => id !== photoId);
        return item.mergedFromPhotoIds.length > 0;
      }
      return true;
    });
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  },

  // Получить активные (не depleted) items
  getActiveInventory: (): InventoryItem[] => {
    return StorageService.getInventory().filter(item => !item.depleted);
  },

  // Получить все items включая depleted (для показа на фото)
  getInventoryWithDepleted: (storageId?: string): InventoryItem[] => {
    const inventory = StorageService.getInventory();
    return storageId
      ? inventory.filter(i => i.storageId === storageId)
      : inventory;
  },

  clearStoragePhotos: (storageId: string): void => {
    const storages = StorageService.getStorages();
    const idx = storages.findIndex(s => s.id === storageId);
    if (idx === -1) return;

    storages[idx].photos = [];
    storages[idx].photo = undefined;
    storages[idx].lastUpdated = new Date().toISOString();

    // Удаляем все inventory items с фото для этого хранилища
    const inventory = StorageService.getInventory().filter(
      item => item.storageId !== storageId || item.source !== 'photo'
    );

    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    localStorage.setItem(KEYS.KITCHEN_STORAGES, JSON.stringify(storages));
  },

  // Получить inventory items для конкретного фото
  getInventoryByPhoto: (photoId: string): InventoryItem[] => {
    return StorageService.getInventory().filter(item =>
      item.photoId === photoId || item.mergedFromPhotoIds?.includes(photoId)
    );
  },

  // === SMART KITCHEN: Inventory ===

  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  },

  getInventoryByStorage: (storageId: string): InventoryItem[] => {
    return StorageService.getInventory().filter(item => item.storageId === storageId);
  },

  saveInventoryItem: (item: InventoryItem): void => {
    const inventory = StorageService.getInventory();
    const existingIdx = inventory.findIndex(i => i.id === item.id);
    if (existingIdx !== -1) {
      inventory[existingIdx] = item;
    } else {
      inventory.push(item);
    }
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    // Sync to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'INVENTORY' as any, { inventory }, s.backendUrl);
  },

  saveInventoryBulk: (items: InventoryItem[]): void => {
    const inventory = StorageService.getInventory();
    items.forEach(item => {
      const existingIdx = inventory.findIndex(i => i.id === item.id);
      if (existingIdx !== -1) {
        inventory[existingIdx] = item;
      } else {
        inventory.push(item);
      }
    });
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  },

  removeInventoryItem: (id: string): void => {
    const inventory = StorageService.getInventory().filter(i => i.id !== id);
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  },

  updateInventoryQuantity: (id: string, newQuantity: number): void => {
    const inventory = StorageService.getInventory();
    const idx = inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      if (newQuantity <= 0) {
        // Не удаляем, а помечаем как depleted (для показа X на фото)
        inventory[idx].quantity = 0;
        inventory[idx].depleted = true;
        inventory[idx].depletedAt = new Date().toISOString();
      } else {
        inventory[idx].quantity = newQuantity;
        // Если было depleted и добавили — снимаем метку
        if (inventory[idx].depleted) {
          inventory[idx].depleted = false;
          inventory[idx].depletedAt = undefined;
        }
      }
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    }
  },

  consumeInventoryItems: (items: { itemId: string; quantity: number }[]): void => {
    const inventory = StorageService.getInventory();
    items.forEach(({ itemId, quantity }) => {
      const idx = inventory.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        inventory[idx].quantity -= quantity;
        if (inventory[idx].quantity <= 0) {
          inventory.splice(idx, 1);
        }
      }
    });
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  },

  getExpiringItems: (days: number = 3): InventoryItem[] => {
    const inventory = StorageService.getInventory();
    const now = new Date();
    const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return inventory.filter(item => {
      if (!item.expiresAt) return false;
      const expDate = new Date(item.expiresAt);
      return expDate <= threshold && expDate >= now;
    }).sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime());
  },

  getExpiredItems: (): InventoryItem[] => {
    const inventory = StorageService.getInventory();
    const now = new Date();
    return inventory.filter(item => {
      if (!item.expiresAt) return false;
      return new Date(item.expiresAt) < now;
    });
  },

  // === SMART KITCHEN: Cooking History ===

  getCookingHistory: (): CookedMeal[] => {
    const data = localStorage.getItem(KEYS.COOKING_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveCookedMeal: (meal: CookedMeal): void => {
    const history = StorageService.getCookingHistory();
    history.push(meal);
    localStorage.setItem(KEYS.COOKING_HISTORY, JSON.stringify(history));

    // Also log calories to nutrition
    const nutritionLog: NutritionLog = {
      id: 'cooked_' + meal.id,
      date: meal.cookedAt.split('T')[0],
      timestamp: new Date(meal.cookedAt).getTime(),
      type: 'FOOD',
      name: meal.recipeName,
      calories: meal.caloriesEaten,
      manualEntry: false
    };
    StorageService.saveNutrition(nutritionLog);
  },

  getRecentRecipeIds: (limit: number = 5): string[] => {
    const history = StorageService.getCookingHistory();
    return history
      .sort((a, b) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime())
      .slice(0, limit)
      .map(m => m.recipeId);
  },

  // === SMART KITCHEN: Leftovers ===

  getLeftovers: (): Leftover[] => {
    const data = localStorage.getItem(KEYS.LEFTOVERS);
    const leftovers: Leftover[] = data ? JSON.parse(data) : [];
    // Filter out expired leftovers
    const now = new Date();
    return leftovers.filter(l => new Date(l.expiresAt) >= now);
  },

  saveLeftover: (leftover: Leftover): void => {
    const leftovers = StorageService.getLeftovers();
    leftovers.push(leftover);
    localStorage.setItem(KEYS.LEFTOVERS, JSON.stringify(leftovers));
  },

  removeLeftover: (id: string): void => {
    const leftovers = StorageService.getLeftovers().filter(l => l.id !== id);
    localStorage.setItem(KEYS.LEFTOVERS, JSON.stringify(leftovers));
  },

  consumeLeftover: (id: string, portions: number): void => {
    const leftovers = StorageService.getLeftovers();
    const idx = leftovers.findIndex(l => l.id === id);
    if (idx !== -1) {
      const leftover = leftovers[idx];
      leftover.portions -= portions;
      if (leftover.portions <= 0) {
        leftovers.splice(idx, 1);
      }
      localStorage.setItem(KEYS.LEFTOVERS, JSON.stringify(leftovers));

      // Log consumed calories
      const nutritionLog: NutritionLog = {
        id: 'leftover_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        type: 'FOOD',
        name: leftover.name + ' (остатки)',
        calories: leftover.caloriesPerPortion * portions,
        manualEntry: false
      };
      StorageService.saveNutrition(nutritionLog);
    }
  },

  // --- Saved Recipes (Favorites) ---
  getSavedRecipes: (): Recipe[] => {
    const data = localStorage.getItem(KEYS.SAVED_RECIPES);
    return data ? JSON.parse(data) : [];
  },

  saveSavedRecipes: (recipes: Recipe[]) => {
    localStorage.setItem(KEYS.SAVED_RECIPES, JSON.stringify(recipes));
  },

  addSavedRecipe: (recipe: Recipe) => {
    const recipes = StorageService.getSavedRecipes();
    recipes.push(recipe);
    StorageService.saveSavedRecipes(recipes);
  },

  removeSavedRecipe: (recipeId: string) => {
    const recipes = StorageService.getSavedRecipes().filter(r => r.id !== recipeId);
    StorageService.saveSavedRecipes(recipes);
  },

  // === SYNC ALL KITCHEN DATA TO BACKEND ===
  syncKitchenData: () => {
    const s = StorageService.getSettings();
    const userId = StorageService.getUserId();

    // Sync inventory
    const inventory = StorageService.getInventory();
    ApiService.pushLog(userId, 'INVENTORY' as any, { items: inventory }, s.backendUrl);

    // Sync kitchen storages (with photos)
    const storages = StorageService.getStorages();
    ApiService.pushLog(userId, 'KITCHEN_STORAGES' as any, { storages }, s.backendUrl);

    // Sync cooking history
    const cookingHistory = StorageService.getCookingHistory();
    ApiService.pushLog(userId, 'COOKING_HISTORY' as any, { history: cookingHistory }, s.backendUrl);

    // Sync leftovers
    const leftovers = StorageService.getLeftovers();
    ApiService.pushLog(userId, 'LEFTOVERS' as any, { items: leftovers }, s.backendUrl);

    // Sync saved recipes
    const savedRecipes = StorageService.getSavedRecipes();
    ApiService.pushLog(userId, 'SAVED_RECIPES' as any, { recipes: savedRecipes }, s.backendUrl);
  }
};