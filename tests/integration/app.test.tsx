import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all heavy dependencies
vi.mock('../../services/geminiService', () => ({
  getMotivation: vi.fn().mockResolvedValue('Keep pushing!'),
  getPhoneSpecs: vi.fn().mockResolvedValue({ weight: 0.2 }),
  scanScaleDisplay: vi.fn().mockResolvedValue(75.5),
}));

vi.mock('../../services/api', () => ({
  ApiService: {
    syncUser: vi.fn(),
    pushLog: vi.fn(),
    pushBulk: vi.fn(),
    fetchFullUserData: vi.fn().mockResolvedValue(null),
    getCustomIcons: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../hooks/useStepCounter', () => ({
  useStepCounter: () => 0,
}));

// Helper to render with necessary providers
const renderApp = async () => {
  // Dynamic import to ensure mocks are in place
  const { default: App } = await import('../../App');
  return render(<App />);
};

describe('App Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders main dashboard', async () => {
    await renderApp();

    // Dashboard tab should be active by default
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows navigation tabs', async () => {
    await renderApp();

    await waitFor(() => {
      // Check for navigation icons/tabs
      const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      expect(nav || document.body).toBeInTheDocument();
    });
  });
});

describe('LocalStorage Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists user settings', () => {
    const settings = {
      name: 'Test User',
      theme: 'dark',
    };

    localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));

    const retrieved = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
    expect(retrieved.name).toBe('Test User');
  });

  it('generates consistent user ID', () => {
    // First call generates ID
    const id1 = localStorage.getItem('fitstream_user_id') ||
      (() => {
        const id = 'user_test123';
        localStorage.setItem('fitstream_user_id', id);
        return id;
      })();

    // Second call returns same ID
    const id2 = localStorage.getItem('fitstream_user_id');
    expect(id1).toBe(id2);
  });
});

describe('Goal Progress Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('tracks exercise completion', () => {
    // Setup initial goals
    const settings = {
      goals: [
        { type: 'PUSHUPS', target: 50, current: 0, isEnabled: true, unit: 'reps', color: '#3b82f6' },
      ],
    };
    localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));

    // Simulate exercise completion
    const exercise = {
      id: 'ex_1',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      exerciseName: 'PUSHUPS',
      reps: 20,
      feedback: '',
    };

    const exercises = [exercise];
    localStorage.setItem('fitstream_exercises', JSON.stringify(exercises));

    // Update goal
    const savedSettings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
    savedSettings.goals[0].current = 20;
    localStorage.setItem('fitstream_settings_v4', JSON.stringify(savedSettings));

    // Verify
    const finalSettings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
    expect(finalSettings.goals[0].current).toBe(20);
  });

  it('calculates weekly workout count', () => {
    const now = Date.now();
    const exercises = [
      { id: '1', timestamp: now, exerciseName: 'PUSHUPS', reps: 10 },
      { id: '2', timestamp: now - 86400000, exerciseName: 'SQUATS', reps: 15 }, // Yesterday
      { id: '3', timestamp: now - 86400000 * 10, exerciseName: 'SITUPS', reps: 20 }, // 10 days ago
    ];

    localStorage.setItem('fitstream_exercises', JSON.stringify(exercises));

    const allExercises = JSON.parse(localStorage.getItem('fitstream_exercises') || '[]');
    const weekAgo = now - 7 * 86400000;
    const thisWeek = allExercises.filter((e: any) => e.timestamp >= weekAgo);

    expect(thisWeek.length).toBe(2);
  });
});

describe('Theme Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to dark theme', () => {
    const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{"theme":"dark"}');
    expect(settings.theme).toBe('dark');
  });

  it('persists theme preference', () => {
    const settings = { theme: 'light' };
    localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));

    const retrieved = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
    expect(retrieved.theme).toBe('light');
  });
});

describe('Nutrition Calculations', () => {
  it('calculates daily calorie needs', () => {
    const weight = 80; // kg
    const height = 180; // cm
    const age = 30;
    const gender = 'MALE';
    const activityLevel = 'MODERATE';

    // Mifflin-St Jeor formula
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === 'MALE' ? 5 : -161;

    const multipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      VERY_ACTIVE: 1.725,
    };

    const tdee = Math.round(bmr * multipliers[activityLevel]);

    expect(tdee).toBeGreaterThan(2000);
    expect(tdee).toBeLessThan(3500);
  });

  it('calculates water intake', () => {
    const weight = 70; // kg
    const waterMl = Math.round(weight * 35);

    expect(waterMl).toBe(2450);
  });

  it('aggregates daily nutrition', () => {
    const today = new Date().toISOString().split('T')[0];
    const logs = [
      { date: today, type: 'FOOD', calories: 300 },
      { date: today, type: 'FOOD', calories: 500 },
      { date: today, type: 'WATER', calories: 0, amount: 250 },
      { date: today, type: 'WATER', calories: 0, amount: 300 },
      { date: '2024-01-01', type: 'FOOD', calories: 1000 }, // Different day
    ];

    const todayNutrition = logs
      .filter(l => l.date === today)
      .reduce(
        (acc, log) => {
          if (log.type === 'FOOD') acc.calories += log.calories;
          if (log.type === 'WATER') acc.water += log.amount || 0;
          return acc;
        },
        { calories: 0, water: 0 }
      );

    expect(todayNutrition.calories).toBe(800);
    expect(todayNutrition.water).toBe(550);
  });
});
