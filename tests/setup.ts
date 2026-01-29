import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Расширяем expect матчерами из jest-dom
expect.extend(matchers);

// localStorage store - объявляем здесь для доступа в hooks
let localStorageStore: Record<string, string> = {};

// Функция для очистки localStorageStore
const clearLocalStorageStore = () => {
  for (const key of Object.keys(localStorageStore)) {
    delete localStorageStore[key];
  }
};

// Сброс перед каждым тестом
beforeEach(() => {
  clearLocalStorageStore();
});

// Очистка после каждого теста
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  // Сбрасываем localStorage store между тестами
  clearLocalStorageStore();
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

// Мок для scaleService (который импортирует @capacitor-community/bluetooth-le)
vi.mock('../services/scaleService', () => ({
  scaleService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    isAvailable: vi.fn().mockResolvedValue(false),
    startScan: vi.fn().mockResolvedValue(undefined),
    stopScan: vi.fn().mockResolvedValue(undefined),
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getLastWeight: vi.fn().mockReturnValue(null),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
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

// Мок для localStorage с реальным хранением
// Используем функции которые напрямую работают с localStorageStore
const localStorageMock = {
  getItem(key: string) { return localStorageStore[key] ?? null; },
  setItem(key: string, value: string) { localStorageStore[key] = value; },
  removeItem(key: string) { delete localStorageStore[key]; },
  clear() {
    for (const key of Object.keys(localStorageStore)) {
      delete localStorageStore[key];
    }
  },
  get length() { return Object.keys(localStorageStore).length; },
  key(index: number) { return Object.keys(localStorageStore)[index] ?? null; },
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
