import { defineConfig, devices } from '@playwright/test';

/**
 * FitStream Playwright E2E Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Директория с тестами
  testDir: './e2e',

  // Паттерн для файлов тестов
  testMatch: '**/*.spec.ts',

  // Полностью параллельный запуск
  fullyParallel: true,

  // Fail build при test.only в CI
  forbidOnly: !!process.env.CI,

  // Количество повторов при падении
  retries: process.env.CI ? 2 : 0,

  // Количество воркеров
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
        ['github'],
      ]
    : [['html', { open: 'never' }], ['list']],

  // Глобальные настройки для всех тестов
  use: {
    // Base URL для навигации
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Трейсинг при первом retry
    trace: 'on-first-retry',

    // Скриншоты при падении
    screenshot: 'only-on-failure',

    // Видео при retry
    video: 'on-first-retry',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Игнорировать HTTPS ошибки
    ignoreHTTPSErrors: true,

    // Таймауты
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Глобальный таймаут теста
  timeout: 60000,

  // Expect таймаут
  expect: {
    timeout: 10000,
  },

  // Проекты (браузеры)
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Dev server для локального запуска
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // Output директория
  outputDir: 'test-results/e2e',
});
