import { test as base, expect } from '@playwright/test';

// Extend base test with custom fixtures
export const test = base.extend<{
  // Authenticated user fixture
  authenticatedPage: any;
  // Mobile viewport fixture
  mobilePage: any;
}>({
  // Setup authenticated user
  authenticatedPage: async ({ page }, use) => {
    // Set up localStorage with user data before navigation
    await page.addInitScript(() => {
      const settings = {
        name: 'Test User',
        email: 'test@example.com',
        avatar: '',
        age: 25,
        height: 175,
        gender: 'MALE',
        activityLevel: 'MODERATE',
        installDate: new Date().toISOString(),
        referenceObject: '',
        referenceDimensions: '',
        phoneModel: 'Test Phone',
        phoneWeight: 0.2,
        goals: [
          { type: 'STEPS', target: 10000, current: 5000, isEnabled: true, unit: 'steps', color: '#10b981' },
          { type: 'PUSHUPS', target: 50, current: 25, isEnabled: true, unit: 'reps', color: '#3b82f6' },
        ],
        targetWeight: 70,
        streak: 5,
        lastActiveDate: new Date().toISOString().split('T')[0],
        theme: 'dark',
        connectedPlatforms: { googleFit: false, appleHealth: false, lastSync: null },
        isPro: false,
        backendUrl: 'http://localhost:3001',
        coachVoice: 'Fenrir',
      };
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
      localStorage.setItem('fitstream_user_id', 'test_user_123');
    });

    await use(page);
  },

  // Mobile viewport with touch support
  mobilePage: async ({ browser }, use) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, // iPhone 14
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };

// Test data generators
export const generateExerciseLog = (overrides = {}) => ({
  id: `ex_${Date.now()}`,
  date: new Date().toISOString().split('T')[0],
  timestamp: Date.now(),
  exerciseName: 'PUSHUPS',
  reps: 10,
  feedback: 'Great form!',
  ...overrides,
});

export const generateWeightLog = (overrides = {}) => ({
  id: `w_${Date.now()}`,
  date: new Date().toISOString().split('T')[0],
  timestamp: Date.now(),
  weight: 75.5,
  ...overrides,
});

export const generateNutritionLog = (overrides = {}) => ({
  id: `n_${Date.now()}`,
  date: new Date().toISOString().split('T')[0],
  timestamp: Date.now(),
  type: 'FOOD' as const,
  name: 'Test Food',
  calories: 300,
  protein: 20,
  carbs: 30,
  fat: 10,
  ...overrides,
});
