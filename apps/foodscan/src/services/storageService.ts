// FoodScan Storage Service
// Extends BaseStorageService with nutrition/weight tracking methods

import {
  NutritionLog, WeightLog, UserSettings, DailyGoal, GoalType,
  ActivityLevel, WeightGoal,
  BaseStorageService, ApiService, KEYS as SHARED_KEYS
} from '@fitstream/shared';

const KEYS = {
  ...SHARED_KEYS,
  EXERCISES: 'fitstream_exercises',
  WEIGHTS: 'fitstream_weights',
  NUTRITION: 'fitstream_nutrition',
};

export const StorageService = {
  // Delegate auth/settings to BaseStorageService
  getUserId: BaseStorageService.getUserId,
  setUserId: BaseStorageService.setUserId,
  isLoggedIn: BaseStorageService.isLoggedIn,
  getSettings: BaseStorageService.getSettings,
  saveSettings: BaseStorageService.saveSettings,
  logout: BaseStorageService.logout,

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
      let deficit = 0;
      if (weightGoal === 'LOSE') {
          const heightM = s.height / 100;
          const bmi = currentWeight / (heightM * heightM);

          if (bmi >= 35) {
              deficit = 750;
          } else if (bmi >= 30) {
              deficit = 600;
          } else if (bmi >= 25) {
              deficit = 500;
          } else {
              deficit = 400;
          }
      } else if (weightGoal === 'GAIN') {
          deficit = -300;
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

    if (lastLog && (log.timestamp - lastLog.timestamp < fiveMinutes)) {
        lastLog.weight = log.weight;
        weights[weights.length - 1] = lastLog;
        const s = StorageService.getSettings();
        ApiService.pushLog(StorageService.getUserId(), 'WEIGHT', lastLog, s.backendUrl);
    } else {
        weights.push(log);
        const s = StorageService.getSettings();
        ApiService.pushLog(StorageService.getUserId(), 'WEIGHT', log, s.backendUrl);
    }
    weights.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem(KEYS.WEIGHTS, JSON.stringify(weights));
  },

  // --- Goal Progress ---
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

  // --- Inventory helpers (used by NutritionTracker for home-made verification) ---
  getActiveInventory: (): Array<{ name: string }> => {
      const data = localStorage.getItem('fitstream_inventory');
      if (!data) return [];
      const items = JSON.parse(data);
      return items.filter((item: any) => !item.depleted);
  },
};
