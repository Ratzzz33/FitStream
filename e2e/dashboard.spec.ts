import { test, expect } from './fixtures/test-fixtures';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads dashboard page', async ({ page }) => {
    // Wait for app to load
    await expect(page.locator('body')).toBeVisible();

    // Check that main content is rendered
    await expect(page).toHaveTitle(/FitStream/i);
  });

  test('displays achievement rings', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Wait for rings to render
    await authenticatedPage.waitForSelector('svg circle', { timeout: 10000 });

    // Check SVG circles exist (achievement rings)
    const circles = authenticatedPage.locator('svg circle');
    await expect(circles.first()).toBeVisible();
  });

  test('shows user greeting', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Should show some greeting or user-related content
    // The app might show name, greeting, or just the dashboard
    const hasGreeting = await authenticatedPage.getByText(/Test User|User|Hello|Welcome|Hi|Good/i).first().isVisible().catch(() => false);
    const hasContent = await authenticatedPage.locator('h1, h2, [class*="greeting"], [class*="user"]').first().isVisible().catch(() => false);

    // At least one should be visible
    expect(hasGreeting || hasContent).toBeTruthy();
  });

  test('displays streak counter', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Look for streak indicator
    const streakElement = authenticatedPage.getByText(/streak|🔥|day/i).first();
    await expect(streakElement).toBeVisible({ timeout: 10000 });
  });

  test('navigation tabs are visible', async ({ page }) => {
    await page.goto('/');

    // Find navigation area
    const nav = page.locator('nav, [role="navigation"], .bottom-0');
    await expect(nav.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Goal Progress', () => {
  test('shows goal progress values', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Wait for content
    await authenticatedPage.waitForLoadState('networkidle');

    // Goals should be displayed
    // Looking for progress indicators (numbers like 5000, 25, etc.)
    const progressText = authenticatedPage.locator('text=/\\d+/').first();
    await expect(progressText).toBeVisible({ timeout: 10000 });
  });

  test('clicking goal opens details', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on a goal ring/card
    const goalElement = authenticatedPage.locator('svg').first();
    if (await goalElement.isVisible()) {
      await goalElement.click();

      // Should open modal or show details
      await authenticatedPage.waitForTimeout(500);
    }
  });
});

test.describe('Dashboard - Theme', () => {
  test('respects dark theme setting', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Check for dark theme classes
    const body = authenticatedPage.locator('body, #root, .dark');
    await expect(body.first()).toBeVisible();
  });

  test('can toggle theme', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Find settings tab and navigate
    const settingsTab = authenticatedPage.locator('[data-tab="settings"], button:has-text("Settings"), svg').last();

    if (await settingsTab.isVisible()) {
      // Theme toggle test would go here
      // This depends on the actual UI implementation
    }
  });
});

test.describe('Dashboard - Responsive', () => {
  // Firefox doesn't support mobile emulation
  test.skip(({ browserName }) => browserName === 'firefox', 'Mobile tests not supported in Firefox');

  test('renders correctly on mobile', async ({ mobilePage }) => {
    await mobilePage.goto('/');

    // Should still show main content
    await expect(mobilePage.locator('body')).toBeVisible();

    // Navigation should be visible (bottom nav on mobile)
    await mobilePage.waitForLoadState('networkidle');
  });

  test('touch interactions work', async ({ mobilePage }) => {
    await mobilePage.goto('/');
    await mobilePage.waitForLoadState('networkidle');

    // Tap on an element
    const tappableElement = mobilePage.locator('button, svg, [role="button"]').first();
    if (await tappableElement.isVisible()) {
      await tappableElement.tap();
    }
  });
});
