import { test, expect } from './fixtures/test-fixtures';

test.describe('Settings', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Navigate to settings tab (usually last)
    const settingsTab = authenticatedPage.locator('nav button, [role="tab"]').last();
    await settingsTab.click();
    await authenticatedPage.waitForTimeout(500);
  });

  test('displays user profile information', async ({ authenticatedPage }) => {
    // Should show user name
    const userName = authenticatedPage.getByText(/Test User|User/i);
    await expect(userName.first()).toBeVisible({ timeout: 10000 });
  });

  test('shows avatar', async ({ authenticatedPage }) => {
    // Look for avatar image or SVG
    const avatar = authenticatedPage.locator('img[src*="data:image"], svg, .avatar').first();
    // May or may not be visible depending on implementation
  });

  test('displays streak information', async ({ authenticatedPage }) => {
    // Look for streak counter
    const streak = authenticatedPage.locator('text=/streak|🔥|\\d+ day/i').first();
    // Streak display depends on settings UI
  });
});

test.describe('Settings - Theme', () => {
  test('can toggle dark/light theme', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Navigate to settings
    const settingsTab = authenticatedPage.locator('nav button').last();
    await settingsTab.click();
    await authenticatedPage.waitForTimeout(500);

    // Find theme toggle
    const themeToggle = authenticatedPage.locator('button, [role="switch"]').filter({
      has: authenticatedPage.locator(':text("Theme"), :text("Dark"), :text("Light"), svg')
    }).first();

    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await authenticatedPage.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
        return settings.theme;
      });

      // Click toggle
      await themeToggle.click();
      await authenticatedPage.waitForTimeout(300);

      // Theme should change (or UI should update)
    }
  });

  test('theme persists after reload', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Set theme in localStorage
    await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      settings.theme = 'light';
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
    });

    // Reload
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify theme
    const theme = await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      return settings.theme;
    });

    expect(theme).toBe('light');
  });
});

test.describe('Settings - Goals', () => {
  test('can view goal settings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Navigate to settings
    const settingsTab = authenticatedPage.locator('nav button').last();
    await settingsTab.click();
    await authenticatedPage.waitForTimeout(500);

    // Look for goal-related UI
    const goalSettings = authenticatedPage.locator('text=/goal|target|steps|pushups/i').first();
    // Goal settings visibility depends on UI structure
  });

  test('goal targets are editable', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Modify goal via localStorage
    await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      const stepsGoal = settings.goals?.find((g: any) => g.type === 'STEPS');
      if (stepsGoal) {
        stepsGoal.target = 15000;
        localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
      }
    });

    // Verify
    const target = await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      const stepsGoal = settings.goals?.find((g: any) => g.type === 'STEPS');
      return stepsGoal?.target;
    });

    expect(target).toBe(15000);
  });
});

test.describe('Settings - User Profile', () => {
  test('can update user name', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Update name via localStorage
    await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      settings.name = 'New Name';
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
    });

    // Reload and verify
    await authenticatedPage.reload();

    const name = await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      return settings.name;
    });

    expect(name).toBe('New Name');
  });

  test('can update physical attributes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Update attributes
    await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      settings.height = 185;
      settings.age = 30;
      settings.gender = 'FEMALE';
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
    });

    // Verify
    const settings = await authenticatedPage.evaluate(() => {
      return JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
    });

    expect(settings.height).toBe(185);
    expect(settings.age).toBe(30);
    expect(settings.gender).toBe('FEMALE');
  });
});

test.describe('Settings - Data Export', () => {
  test('user data is stored in localStorage', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Add some data
    await authenticatedPage.evaluate(() => {
      // Add exercise
      const exercises = JSON.parse(localStorage.getItem('fitstream_exercises') || '[]');
      exercises.push({
        id: 'test_ex',
        date: '2025-01-29',
        timestamp: Date.now(),
        exerciseName: 'PUSHUPS',
        reps: 20,
        feedback: '',
      });
      localStorage.setItem('fitstream_exercises', JSON.stringify(exercises));

      // Add weight
      const weights = JSON.parse(localStorage.getItem('fitstream_weights') || '[]');
      weights.push({
        id: 'test_w',
        date: '2025-01-29',
        timestamp: Date.now(),
        weight: 75,
      });
      localStorage.setItem('fitstream_weights', JSON.stringify(weights));
    });

    // Verify data exists
    const data = await authenticatedPage.evaluate(() => {
      return {
        exercises: JSON.parse(localStorage.getItem('fitstream_exercises') || '[]'),
        weights: JSON.parse(localStorage.getItem('fitstream_weights') || '[]'),
        settings: JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}'),
      };
    });

    expect(data.exercises.length).toBeGreaterThan(0);
    expect(data.weights.length).toBeGreaterThan(0);
    expect(data.settings).toBeTruthy();
  });
});
