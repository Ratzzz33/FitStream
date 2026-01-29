import { test, expect } from './fixtures/test-fixtures';

/**
 * Visual Regression Tests
 * These tests capture screenshots and compare them against baselines.
 *
 * First run: npx playwright test e2e/visual.spec.ts --update-snapshots
 * Subsequent runs will compare against these baselines.
 */

test.describe('Visual Regression', () => {
  test.describe.configure({ mode: 'serial' });

  test('dashboard - default state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Wait for animations to complete
    await authenticatedPage.waitForTimeout(1000);

    // Take screenshot
    await expect(authenticatedPage).toHaveScreenshot('dashboard-default.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('dashboard - dark theme', async ({ authenticatedPage }) => {
    // Set dark theme
    await authenticatedPage.addInitScript(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      settings.theme = 'dark';
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
    });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage).toHaveScreenshot('dashboard-dark.png', {
      maxDiffPixels: 100,
    });
  });

  test('dashboard - light theme', async ({ authenticatedPage }) => {
    // Set light theme
    await authenticatedPage.addInitScript(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      settings.theme = 'light';
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
    });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1000);

    await expect(authenticatedPage).toHaveScreenshot('dashboard-light.png', {
      maxDiffPixels: 100,
    });
  });

  test('dashboard - goals completed', async ({ authenticatedPage }) => {
    // Set completed goals
    await authenticatedPage.addInitScript(() => {
      const settings = JSON.parse(localStorage.getItem('fitstream_settings_v4') || '{}');
      settings.goals = settings.goals?.map((g: any) => ({
        ...g,
        current: g.target + 10, // Exceed target
      }));
      localStorage.setItem('fitstream_settings_v4', JSON.stringify(settings));
    });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(1500); // Wait for completion animations

    await expect(authenticatedPage).toHaveScreenshot('dashboard-completed.png', {
      maxDiffPixels: 200, // More tolerance for animations
    });
  });
});

test.describe('Visual - Mobile', () => {
  test('mobile dashboard', async ({ mobilePage }) => {
    // Set up user data
    await mobilePage.addInitScript(() => {
      localStorage.setItem(
        'fitstream_settings_v4',
        JSON.stringify({
          name: 'Mobile User',
          theme: 'dark',
          goals: [
            { type: 'STEPS', target: 10000, current: 7500, isEnabled: true, color: '#10b981' },
            { type: 'PUSHUPS', target: 50, current: 30, isEnabled: true, color: '#3b82f6' },
          ],
        })
      );
    });

    await mobilePage.goto('/');
    await mobilePage.waitForLoadState('networkidle');
    await mobilePage.waitForTimeout(1000);

    await expect(mobilePage).toHaveScreenshot('mobile-dashboard.png', {
      maxDiffPixels: 150,
    });
  });

  test('mobile navigation', async ({ mobilePage }) => {
    await mobilePage.goto('/');
    await mobilePage.waitForLoadState('networkidle');

    // Focus on bottom navigation
    const nav = mobilePage.locator('nav, .bottom-0').first();

    if (await nav.isVisible()) {
      await expect(nav).toHaveScreenshot('mobile-navigation.png', {
        maxDiffPixels: 50,
      });
    }
  });
});

test.describe('Visual - Components', () => {
  test('achievement ring - in progress', async ({ authenticatedPage }) => {
    await authenticatedPage.addInitScript(() => {
      localStorage.setItem(
        'fitstream_settings_v4',
        JSON.stringify({
          goals: [{ type: 'STEPS', target: 10000, current: 5000, isEnabled: true, color: '#10b981' }],
        })
      );
    });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find and screenshot the first ring
    const ring = authenticatedPage.locator('svg').first();
    if (await ring.isVisible()) {
      await expect(ring).toHaveScreenshot('ring-progress.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('achievement ring - completed', async ({ authenticatedPage }) => {
    await authenticatedPage.addInitScript(() => {
      localStorage.setItem(
        'fitstream_settings_v4',
        JSON.stringify({
          goals: [{ type: 'STEPS', target: 10000, current: 12000, isEnabled: true, color: '#10b981' }],
        })
      );
    });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(500);

    const ring = authenticatedPage.locator('svg').first();
    if (await ring.isVisible()) {
      await expect(ring).toHaveScreenshot('ring-completed.png', {
        maxDiffPixels: 100, // More tolerance for glow effect
      });
    }
  });
});

test.describe('Visual - Accessibility', () => {
  test('high contrast mode', async ({ authenticatedPage }) => {
    // Emulate high contrast
    await authenticatedPage.emulateMedia({ forcedColors: 'active' });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('high-contrast.png', {
      maxDiffPixels: 500, // High tolerance for forced colors
    });
  });

  test('reduced motion', async ({ authenticatedPage }) => {
    // Emulate reduced motion preference
    await authenticatedPage.emulateMedia({ reducedMotion: 'reduce' });

    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    await expect(authenticatedPage).toHaveScreenshot('reduced-motion.png', {
      maxDiffPixels: 100,
    });
  });
});
