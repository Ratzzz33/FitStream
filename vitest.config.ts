import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react() as any],
  test: {
    // Окружение для тестирования React компонентов
    environment: 'jsdom',

    // Глобальные переменные (describe, it, expect без импорта)
    globals: true,

    // Setup файлы
    setupFiles: ['./tests/setup.ts'],

    // Паттерны для поиска тестов
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
    ],

    // Исключения
    exclude: [
      'node_modules',
      'dist',
      'android',
      'ios',
      'backend',
    ],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      // Пороги покрытия
      thresholds: {
        statements: 50,
        branches: 50,
        functions: 50,
        lines: 50,
      },
    },

    // Таймауты
    testTimeout: 30000,
    hookTimeout: 30000,

    // Параллельный запуск (Vitest 4+ config)
    pool: 'threads',
    maxWorkers: 4,
    minWorkers: 1,

    // Reporter для CI
    reporters: process.env.CI
      ? ['default', 'junit']
      : ['default'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
  },
});
