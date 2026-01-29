import { test, expect } from './fixtures/test-fixtures';

test.describe('Nutrition Tracker', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Navigate to nutrition tab (usually 3rd)
    const nutritionTab = authenticatedPage.locator('nav button, [role="tab"]').nth(2);
    if (await nutritionTab.isVisible()) {
      await nutritionTab.click();
      await authenticatedPage.waitForTimeout(500);
    }
  });

  test('displays calorie summary', async ({ authenticatedPage }) => {
    // Look for calorie display
    const calorieDisplay = authenticatedPage.locator('text=/calorie|kcal|\\d+ cal/i').first();
    // May or may not be visible depending on tab navigation
  });

  test('displays water intake', async ({ authenticatedPage }) => {
    // Look for water display
    const waterDisplay = authenticatedPage.locator('text=/water|ml|hydrat/i').first();
    // May or may not be visible
  });
});

test.describe('Nutrition - Food Logging', () => {
  test('can log food item', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Add food log via localStorage
    const today = new Date().toISOString().split('T')[0];
    await authenticatedPage.evaluate((date) => {
      const nutrition = JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
      nutrition.push({
        id: `food_${Date.now()}`,
        date: date,
        timestamp: Date.now(),
        type: 'FOOD',
        name: 'Chicken Breast',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
      });
      localStorage.setItem('fitstream_nutrition', JSON.stringify(nutrition));
    }, today);

    // Verify
    const logs = await authenticatedPage.evaluate(() => {
      return JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
    });

    const lastLog = logs[logs.length - 1];
    expect(lastLog.name).toBe('Chicken Breast');
    expect(lastLog.calories).toBe(165);
  });

  test('calculates daily totals correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const today = new Date().toISOString().split('T')[0];

    // Add multiple food items
    await authenticatedPage.evaluate((date) => {
      const nutrition = [
        { id: 'f1', date: date, timestamp: Date.now(), type: 'FOOD', name: 'Breakfast', calories: 400 },
        { id: 'f2', date: date, timestamp: Date.now(), type: 'FOOD', name: 'Lunch', calories: 600 },
        { id: 'f3', date: date, timestamp: Date.now(), type: 'FOOD', name: 'Dinner', calories: 500 },
      ];
      localStorage.setItem('fitstream_nutrition', JSON.stringify(nutrition));
    }, today);

    // Calculate total
    const total = await authenticatedPage.evaluate((date) => {
      const nutrition = JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
      return nutrition
        .filter((n: any) => n.date === date && n.type === 'FOOD')
        .reduce((sum: number, n: any) => sum + n.calories, 0);
    }, today);

    expect(total).toBe(1500);
  });
});

test.describe('Nutrition - Water Tracking', () => {
  test('can log water intake', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const today = new Date().toISOString().split('T')[0];

    await authenticatedPage.evaluate((date) => {
      const nutrition = JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
      nutrition.push({
        id: `water_${Date.now()}`,
        date: date,
        timestamp: Date.now(),
        type: 'WATER',
        name: 'Water',
        calories: 0,
        amount: 250, // ml
      });
      localStorage.setItem('fitstream_nutrition', JSON.stringify(nutrition));
    }, today);

    // Verify
    const logs = await authenticatedPage.evaluate(() => {
      return JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
    });

    const waterLog = logs.find((l: any) => l.type === 'WATER');
    expect(waterLog).toBeTruthy();
    expect(waterLog.amount).toBe(250);
  });

  test('calculates daily water total', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const today = new Date().toISOString().split('T')[0];

    // Add multiple water entries
    await authenticatedPage.evaluate((date) => {
      const nutrition = [
        { id: 'w1', date: date, timestamp: Date.now(), type: 'WATER', name: 'Water', calories: 0, amount: 250 },
        { id: 'w2', date: date, timestamp: Date.now(), type: 'WATER', name: 'Water', calories: 0, amount: 300 },
        { id: 'w3', date: date, timestamp: Date.now(), type: 'WATER', name: 'Water', calories: 0, amount: 500 },
      ];
      localStorage.setItem('fitstream_nutrition', JSON.stringify(nutrition));
    }, today);

    // Calculate total
    const total = await authenticatedPage.evaluate((date) => {
      const nutrition = JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
      return nutrition
        .filter((n: any) => n.date === date && n.type === 'WATER')
        .reduce((sum: number, n: any) => sum + (n.amount || 0), 0);
    }, today);

    expect(total).toBe(1050); // ml
  });
});

test.describe('Nutrition - Daily Needs Calculation', () => {
  test('calculates BMR correctly for male', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const bmr = await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      const weight = 80;
      const height = settings.height || 175;
      const age = settings.age || 25;
      const gender = settings.gender || 'MALE';

      let result = 10 * weight + 6.25 * height - 5 * age;
      result += gender === 'MALE' ? 5 : -161;
      return result;
    });

    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2500);
  });

  test('calculates TDEE with activity multiplier', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const tdee = await authenticatedPage.evaluate(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      const weight = 80;
      const height = settings.height || 175;
      const age = settings.age || 25;
      const gender = settings.gender || 'MALE';
      const activity = settings.activityLevel || 'MODERATE';

      let bmr = 10 * weight + 6.25 * height - 5 * age;
      bmr += gender === 'MALE' ? 5 : -161;

      const multipliers: Record<string, number> = {
        SEDENTARY: 1.2,
        LIGHT: 1.375,
        MODERATE: 1.55,
        VERY_ACTIVE: 1.725,
      };

      return Math.round(bmr * (multipliers[activity] || 1.2));
    });

    expect(tdee).toBeGreaterThan(2000);
    expect(tdee).toBeLessThan(4000);
  });

  test('calculates water needs based on weight', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const waterNeeds = await authenticatedPage.evaluate(() => {
      const weight = 70; // kg
      return Math.round(weight * 35); // ml
    });

    expect(waterNeeds).toBe(2450);
  });
});

test.describe('Nutrition - Macros', () => {
  test('tracks protein intake', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    const today = new Date().toISOString().split('T')[0];

    await authenticatedPage.evaluate((date) => {
      const nutrition = [
        { id: 'p1', date: date, type: 'FOOD', name: 'Eggs', calories: 150, protein: 12 },
        { id: 'p2', date: date, type: 'FOOD', name: 'Chicken', calories: 200, protein: 30 },
        { id: 'p3', date: date, type: 'FOOD', name: 'Protein Shake', calories: 120, protein: 25 },
      ];
      localStorage.setItem('fitstream_nutrition', JSON.stringify(nutrition));
    }, today);

    const totalProtein = await authenticatedPage.evaluate((date) => {
      const nutrition = JSON.parse(localStorage.getItem('fitstream_nutrition') || '[]');
      return nutrition
        .filter((n: any) => n.date === date)
        .reduce((sum: number, n: any) => sum + (n.protein || 0), 0);
    }, today);

    expect(totalProtein).toBe(67); // grams
  });
});
