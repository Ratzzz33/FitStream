import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Расширяем expect матчерами из jest-dom
expect.extend(matchers);

// Очистка после каждого теста
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Мок для matchMedia (нужен для некоторых UI компонентов)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Мок для IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Мок для Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
  },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(),
    notification: vi.fn(),
    vibrate: vi.fn(),
  },
}));

// Мок для offlineStorage сервиса
vi.mock('../services/offlineStorage', () => ({
  offlineStorage: {
    getPendingItems: vi.fn().mockResolvedValue([]),
    getPendingPhotos: vi.fn().mockResolvedValue([]),
    getPendingCount: vi.fn().mockResolvedValue(0),
    addPendingItem: vi.fn().mockResolvedValue(undefined),
    removePendingItem: vi.fn().mockResolvedValue(undefined),
    storePhoto: vi.fn().mockResolvedValue(undefined),
    getPhoto: vi.fn().mockResolvedValue(null),
    removePhoto: vi.fn().mockResolvedValue(undefined),
  },
}));

// Мок для syncQueue сервиса
vi.mock('../services/syncQueue', () => ({
  syncQueue: {
    queueNutritionLog: vi.fn().mockResolvedValue(undefined),
    queueWeightLog: vi.fn().mockResolvedValue(undefined),
    processQueue: vi.fn().mockResolvedValue(undefined),
    syncNow: vi.fn().mockResolvedValue(undefined),
    getPendingCount: vi.fn().mockResolvedValue(0),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  },
}));

// Мок для IndexedDB
const indexedDBMock = {
  open: vi.fn(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: vi.fn(() => ({
        createIndex: vi.fn(),
      })),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(),
          put: vi.fn(),
          get: vi.fn(),
          getAll: vi.fn(),
          delete: vi.fn(),
          index: vi.fn(() => ({
            getAll: vi.fn(),
          })),
        })),
      })),
      objectStoreNames: { contains: vi.fn(() => false) },
    },
  })),
  deleteDatabase: vi.fn(),
};
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock, writable: true });

// Мок для IDBKeyRange
const IDBKeyRangeMock = {
  only: vi.fn((value) => value),
  lowerBound: vi.fn(),
  upperBound: vi.fn(),
  bound: vi.fn(),
};
Object.defineProperty(window, 'IDBKeyRange', { value: IDBKeyRangeMock, writable: true });

// Мок для localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Подавляем console.error для ожидаемых ошибок в тестах
const originalError = console.error;
console.error = (...args: unknown[]) => {
  // Игнорируем React warnings в тестах
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: An update to'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};
