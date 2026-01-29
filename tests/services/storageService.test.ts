import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService, generateTotem, AVATAR_ANIMALS, AVATAR_THEMES } from '../../services/storageService';
import type { ExerciseLog, WeightLog, NutritionLog, UserSettings } from '../../types';

// Mock ApiService
vi.mock('../../services/api', () => ({
  ApiService: {
    syncUser: vi.fn(),
    pushLog: vi.fn(),
    pushBulk: vi.fn(),
    fetchFullUserData: vi.fn(),
  },
}));

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getUserId', () => {
    it('generates a new user ID if none exists', () => {
      const userId = StorageService.getUserId();
      expect(userId).toMatch(/^user_[a-z0-9]+$/);
    });

    it('returns the same user ID on subsequent calls', () => {
      const firstId = StorageService.getUserId();
      const secondId = StorageService.getUserId();
      expect(firstId).toBe(secondId);
    });

    it('persists user ID in localStorage', () => {
      const userId = StorageService.getUserId();
      expect(localStorage.getItem('fitstream_user_id')).toBe(userId);
    });
  });

  describe('getSettings', () => {
    it('returns default settings when none exist', () => {
      const settings = StorageService.getSettings();
      expect(settings.name).toBe('User');
      expect(settings.theme).toBe('dark');
      expect(settings.goals).toHaveLength(9);
    });

    it('migrates settings with missing goals', () => {
      const partialSettings = {
        name: 'Test User',
        goals: [],
      };
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(partialSettings));

      const settings = StorageService.getSettings();
      expect(settings.goals.length).toBeGreaterThan(0);
    });

    it('preserves existing settings while adding defaults', () => {
      const customSettings = {
        name: 'Custom User',
        age: 30,
        height: 180,
        gender: 'FEMALE',
        goals: [{ type: 'STEPS', target: 10000, current: 5000, isEnabled: true, unit: 'steps', color: '#10b981' }],
      };
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(customSettings));

      const settings = StorageService.getSettings();
      expect(settings.name).toBe('Custom User');
      expect(settings.age).toBe(30);
      expect(settings.gender).toBe('FEMALE');
    });
  });

  describe('saveSettings', () => {
    it('saves settings to localStorage', () => {
      const settings = StorageService.getSettings();
      settings.name = 'Updated Name';
      StorageService.saveSettings(settings, false);

      const savedSettings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      expect(savedSettings.name).toBe('Updated Name');
    });
  });

  describe('Exercises', () => {
    it('returns empty array when no exercises exist', () => {
      const exercises = StorageService.getExercises();
      expect(exercises).toEqual([]);
    });

    it('saves and retrieves exercises', () => {
      const exercise: ExerciseLog = {
        id: 'ex_1',
        date: '2025-01-29',
        timestamp: Date.now(),
        exerciseName: 'PUSHUPS',
        reps: 20,
        feedback: 'Great form!',
      };

      StorageService.saveExercise(exercise);
      const exercises = StorageService.getExercises();

      expect(exercises).toHaveLength(1);
      expect(exercises[0].exerciseName).toBe('PUSHUPS');
      expect(exercises[0].reps).toBe(20);
    });

    it('updates goal progress when saving exercise', () => {
      // Get initial goal value
      const initialSettings = StorageService.getSettings();
      const initialPushupGoal = initialSettings.goals.find(g => g.type === 'PUSHUPS');
      const initialValue = initialPushupGoal?.current ?? 0;

      const exercise: ExerciseLog = {
        id: 'ex_2',
        date: '2025-01-29',
        timestamp: Date.now(),
        exerciseName: 'PUSHUPS',
        reps: 15,
        feedback: '',
      };

      StorageService.saveExercise(exercise);
      const settings = StorageService.getSettings();
      const pushupGoal = settings.goals.find(g => g.type === 'PUSHUPS');

      // Check that the goal increased by 15
      expect(pushupGoal?.current).toBe(initialValue + 15);
    });
  });

  describe('Weights', () => {
    it('returns empty array when no weights exist', () => {
      const weights = StorageService.getWeights();
      expect(weights).toEqual([]);
    });

    it('saves weight log', () => {
      const weight: WeightLog = {
        id: 'w_1',
        date: '2025-01-29',
        timestamp: Date.now(),
        weight: 75.5,
      };

      StorageService.saveWeight(weight);
      const weights = StorageService.getWeights();

      expect(weights).toHaveLength(1);
      expect(weights[0].weight).toBe(75.5);
    });

    it('returns last weight', () => {
      const weight1: WeightLog = {
        id: 'w_1',
        date: '2025-01-28',
        timestamp: Date.now() - 86400000,
        weight: 76,
      };
      const weight2: WeightLog = {
        id: 'w_2',
        date: '2025-01-29',
        timestamp: Date.now(),
        weight: 75.5,
      };

      StorageService.saveWeight(weight1);
      StorageService.saveWeight(weight2);

      expect(StorageService.getLastWeight()).toBe(75.5);
    });

    it('returns 0 when no weights exist', () => {
      expect(StorageService.getLastWeight()).toBe(0);
    });

    it('updates recent entry instead of creating new one', () => {
      const timestamp = Date.now();
      const weight1: WeightLog = {
        id: 'w_1',
        date: '2025-01-29',
        timestamp: timestamp,
        weight: 75,
      };
      const weight2: WeightLog = {
        id: 'w_2',
        date: '2025-01-29',
        timestamp: timestamp + 60000, // 1 minute later
        weight: 75.5,
      };

      StorageService.saveWeight(weight1);
      StorageService.saveWeight(weight2);

      const weights = StorageService.getWeights();
      expect(weights).toHaveLength(1);
      expect(weights[0].weight).toBe(75.5);
    });
  });

  describe('Nutrition', () => {
    it('returns empty array when no logs exist', () => {
      const logs = StorageService.getNutritionLogs();
      expect(logs).toEqual([]);
    });

    it('saves nutrition log', () => {
      const log: NutritionLog = {
        id: 'n_1',
        date: '2025-01-29',
        timestamp: Date.now(),
        type: 'FOOD',
        name: 'Apple',
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
      };

      StorageService.saveNutrition(log);
      const logs = StorageService.getNutritionLogs();

      expect(logs).toHaveLength(1);
      expect(logs[0].name).toBe('Apple');
    });

    it('calculates today nutrition correctly', () => {
      const today = new Date().toISOString().split('T')[0];

      const food: NutritionLog = {
        id: 'n_1',
        date: today,
        timestamp: Date.now(),
        type: 'FOOD',
        name: 'Lunch',
        calories: 500,
      };

      const water: NutritionLog = {
        id: 'n_2',
        date: today,
        timestamp: Date.now(),
        type: 'WATER',
        name: 'Water',
        calories: 0,
        amount: 250,
      };

      StorageService.saveNutrition(food);
      StorageService.saveNutrition(water);

      const todayNutrition = StorageService.getTodayNutrition();
      expect(todayNutrition.calories).toBe(500);
      expect(todayNutrition.water).toBe(250);
    });

    it('calculates daily needs based on user settings', () => {
      const settings = StorageService.getSettings();
      settings.gender = 'MALE';
      settings.age = 30;
      settings.height = 180;
      settings.activityLevel = 'MODERATE';
      StorageService.saveSettings(settings, false);

      // Save a weight
      const weight: WeightLog = {
        id: 'w_1',
        date: '2025-01-29',
        timestamp: Date.now(),
        weight: 80,
      };
      StorageService.saveWeight(weight);

      const needs = StorageService.calculateDailyNeeds();
      expect(needs.calories).toBeGreaterThan(0);
      expect(needs.water).toBeGreaterThan(0);
    });
  });

  describe('Goals', () => {
    it('updates step goal', () => {
      // Get initial value
      const initialSettings = StorageService.getSettings();
      const initialStepGoal = initialSettings.goals.find(g => g.type === 'STEPS');
      const initialValue = initialStepGoal?.current ?? 0;

      StorageService.updateSteps(1000);
      const settings = StorageService.getSettings();
      const stepGoal = settings.goals.find(g => g.type === 'STEPS');
      expect(stepGoal?.current).toBe(initialValue + 1000);
    });

    it('syncs external steps', () => {
      // Get initial value
      const initialSettings = StorageService.getSettings();
      const initialStepGoal = initialSettings.goals.find(g => g.type === 'STEPS');
      const initialValue = initialStepGoal?.current ?? 0;

      StorageService.syncExternalSteps(5000);
      const settings = StorageService.getSettings();
      const stepGoal = settings.goals.find(g => g.type === 'STEPS');
      expect(stepGoal?.current).toBe(initialValue + 5000);
      expect(settings.connectedPlatforms.lastSync).not.toBeNull();
    });
  });

  describe('Streak', () => {
    it('increments streak for consecutive days', () => {
      const settings = StorageService.getSettings();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      settings.lastActiveDate = yesterday.toISOString().split('T')[0];
      settings.streak = 5;
      StorageService.saveSettings(settings, false);

      StorageService.updateStreak();

      const updatedSettings = StorageService.getSettings();
      expect(updatedSettings.streak).toBe(6);
    });

    it('resets streak after missing days', () => {
      const settings = StorageService.getSettings();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      settings.lastActiveDate = threeDaysAgo.toISOString().split('T')[0];
      settings.streak = 10;
      StorageService.saveSettings(settings, false);

      StorageService.updateStreak();

      const updatedSettings = StorageService.getSettings();
      expect(updatedSettings.streak).toBe(1);
    });
  });
});

describe('Avatar Utilities', () => {
  describe('generateTotem', () => {
    it('generates a valid data URL', () => {
      const totem = generateTotem('🐺', '#1a1a1a', '#000000', '#38bdf8');
      expect(totem).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    it('creates different totems for different emojis', () => {
      const wolf = generateTotem('🐺', '#1a1a1a', '#000000');
      const lion = generateTotem('🦁', '#1a1a1a', '#000000');
      expect(wolf).not.toBe(lion);
    });
  });

  describe('AVATAR_ANIMALS', () => {
    it('contains expected animals', () => {
      expect(AVATAR_ANIMALS).toContainEqual(expect.objectContaining({ id: 'wolf' }));
      expect(AVATAR_ANIMALS).toContainEqual(expect.objectContaining({ id: 'lion' }));
    });

    it('has emoji for each animal', () => {
      AVATAR_ANIMALS.forEach(animal => {
        expect(animal.emoji).toBeDefined();
        expect(animal.emoji.length).toBeGreaterThan(0);
      });
    });
  });

  describe('AVATAR_THEMES', () => {
    it('contains color definitions', () => {
      AVATAR_THEMES.forEach(theme => {
        expect(theme.from).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.to).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(theme.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });
  });
});
