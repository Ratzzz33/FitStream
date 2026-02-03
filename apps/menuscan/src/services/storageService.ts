// MenuScan Storage Service
// Extends BaseStorageService with nutrition logging for restaurant meals

import {
  BaseStorageService,
  ApiService,
} from '@fitstream/shared';
import type {
  NutritionLog,
  UserSettings,
  WeightGoal,
  ActivityLevel,
} from '@fitstream/shared';
import type { MenuScanEntry, DailyNutritionSummary } from '../types';

const KEYS = {
  NUTRITION: 'fitstream_nutrition',
  WEIGHTS: 'fitstream_weights',
  MENU_HISTORY: 'menuscan_history',
};

export const StorageService = {
  // Delegate to base
  ...BaseStorageService,

  // --- Nutrition Logs ---
  getNutritionLogs: (): NutritionLog[] => {
    const data = localStorage.getItem(KEYS.NUTRITION);
    return data ? JSON.parse(data) : [];
  },

  getTodayNutrition: (): { calories: number; water: number } => {
    const logs = StorageService.getNutritionLogs();
    const today = new Date().toISOString().split('T')[0];
    return logs
      .filter(l => l.date === today)
      .reduce(
        (acc, log) => {
          if (log.type === 'FOOD') acc.calories += log.calories;
          if (log.type === 'WATER') acc.water += (log.amount || 0);
          return acc;
        },
        { calories: 0, water: 0 }
      );
  },

  getTodayNutritionDetailed: (): DailyNutritionSummary => {
    const logs = StorageService.getNutritionLogs();
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === today && l.type === 'FOOD');
    return todayLogs.reduce(
      (acc, log) => {
        acc.calories += log.calories;
        acc.protein += log.protein || 0;
        acc.carbs += log.carbs || 0;
        acc.fat += log.fat || 0;
        acc.meals += 1;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, meals: 0 }
    );
  },

  saveNutrition: (log: NutritionLog) => {
    const logs = StorageService.getNutritionLogs();
    logs.push(log);
    localStorage.setItem(KEYS.NUTRITION, JSON.stringify(logs));

    // Background push to backend
    const s = StorageService.getSettings();
    ApiService.pushLog(StorageService.getUserId(), 'NUTRITION', log, s.backendUrl);
  },

  // --- Daily Calorie Needs ---
  calculateDailyNeeds: (): {
    calories: number;
    water: number;
    tdee: number;
    deficit: number;
    weightGoal: WeightGoal;
  } => {
    const s = StorageService.getSettings();
    const currentWeight = StorageService.getLastWeight() || s.targetWeight || 70;
    const targetWeight = s.targetWeight || currentWeight;

    // BMR using Mifflin-St Jeor formula
    let bmr = (10 * currentWeight) + (6.25 * s.height) - (5 * s.age);
    bmr += s.gender === 'MALE' ? 5 : -161;

    const activityMultipliers: Record<ActivityLevel, number> = {
      'SEDENTARY': 1.2,
      'LIGHT': 1.375,
      'MODERATE': 1.55,
      'VERY_ACTIVE': 1.725,
    };

    const tdee = Math.round(bmr * (activityMultipliers[s.activityLevel] || 1.2));

    let weightGoal: WeightGoal = s.weightGoal || 'MAINTAIN';
    const weightDifference = currentWeight - targetWeight;

    if (!s.weightGoal) {
      if (weightDifference > 2) weightGoal = 'LOSE';
      else if (weightDifference < -2) weightGoal = 'GAIN';
      else weightGoal = 'MAINTAIN';
    }

    let deficit = 0;
    if (weightGoal === 'LOSE') {
      const heightM = s.height / 100;
      const bmi = currentWeight / (heightM * heightM);
      if (bmi >= 35) deficit = 750;
      else if (bmi >= 30) deficit = 600;
      else if (bmi >= 25) deficit = 500;
      else deficit = 400;
    } else if (weightGoal === 'GAIN') {
      deficit = -300;
    }

    let calories = tdee - deficit;
    const minCalories = s.gender === 'MALE' ? 1500 : 1200;
    calories = Math.max(calories, minCalories);

    const water = Math.round(currentWeight * 35);

    return {
      calories: Math.round(calories),
      water,
      tdee,
      deficit,
      weightGoal,
    };
  },

  getLastWeight: (): number => {
    const data = localStorage.getItem(KEYS.WEIGHTS);
    if (!data) return 0;
    const weights = JSON.parse(data);
    return weights.length > 0 ? weights[weights.length - 1].weight : 0;
  },

  // --- Menu Scan History ---
  getMenuHistory: (): MenuScanEntry[] => {
    const data = localStorage.getItem(KEYS.MENU_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveMenuScan: (entry: MenuScanEntry) => {
    const history = StorageService.getMenuHistory();
    history.unshift(entry); // newest first
    // Keep max 50 entries
    const trimmed = history.slice(0, 50);
    localStorage.setItem(KEYS.MENU_HISTORY, JSON.stringify(trimmed));
  },

  removeMenuScan: (id: string) => {
    const history = StorageService.getMenuHistory().filter(h => h.id !== id);
    localStorage.setItem(KEYS.MENU_HISTORY, JSON.stringify(history));
  },

  clearMenuHistory: () => {
    localStorage.setItem(KEYS.MENU_HISTORY, JSON.stringify([]));
  },
};
