// @fitstream/shared - Base Storage Service
// Shared storage for auth, settings, and user identity
// Each app extends this with app-specific storage methods

import { UserSettings, DailyGoal, GoalType, Gender, ActivityLevel } from '../types';
import { ApiService } from './api';

const KEYS = {
  SETTINGS: 'fitstream_settings_v4',
  USER_ID: 'fitstream_user_id',
  SYNC_STATUS: 'fitstream_sync_status',
};

// --- Avatar Helpers ---
export const generateTotem = (emoji: string, colorFrom: string, colorTo: string, accent: string = '#ffffff') => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colorFrom};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colorTo};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow">
           <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="black" flood-opacity="0.5"/>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />
      <circle cx="50" cy="50" r="48" fill="none" stroke="${accent}" stroke-width="1.5" opacity="0.4" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="${accent}" stroke-width="0.5" opacity="0.2" stroke-dasharray="4 2" />
      <text x="50" y="68" font-size="55" text-anchor="middle" style="filter: url(#shadow);">${emoji}</text>
    </svg>`.trim();

    const encoder = new TextEncoder();
    const data = encoder.encode(svg);
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(data[i]);
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`;
};

export const AVATAR_ANIMALS = [
    { id: 'wolf', emoji: '🐺', name: 'Wolf' },
    { id: 'lion', emoji: '🦁', name: 'Lion' },
    { id: 'tiger', emoji: '🐯', name: 'Tiger' },
    { id: 'dragon', emoji: '🐲', name: 'Dragon' },
    { id: 'eagle', emoji: '🦅', name: 'Eagle' },
    { id: 'gorilla', emoji: '🦍', name: 'Gorilla' },
    { id: 'fox', emoji: '🦊', name: 'Fox' },
    { id: 'bull', emoji: '🐂', name: 'Bull' },
    { id: 'leopard', emoji: '🐆', name: 'Leopard' },
    { id: 'snake', emoji: '🐍', name: 'Snake' },
    { id: 'shark', emoji: '🦈', name: 'Shark' },
    { id: 'scorpion', emoji: '🦂', name: 'Scorpion' },
];

export const AVATAR_THEMES = [
    { id: 'obsidian', from: '#1a1a1a', to: '#000000', accent: '#38bdf8', name: 'Obsidian' },
    { id: 'crimson', from: '#2a0a0a', to: '#000000', accent: '#f87171', name: 'Crimson' },
    { id: 'midnight', from: '#1e1b4b', to: '#020617', accent: '#818cf8', name: 'Midnight' },
    { id: 'gold', from: '#271a00', to: '#000000', accent: '#facc15', name: 'Gold' },
    { id: 'venom', from: '#052e16', to: '#000000', accent: '#4ade80', name: 'Venom' },
    { id: 'neon', from: '#2e0225', to: '#000000', accent: '#e879f9', name: 'Neon' },
];

export const PREDEFINED_AVATARS = AVATAR_ANIMALS.slice(0, 8).map((a, i) => ({
    ...a,
    url: generateTotem(a.emoji, AVATAR_THEMES[i % AVATAR_THEMES.length].from, AVATAR_THEMES[i % AVATAR_THEMES.length].to, AVATAR_THEMES[i % AVATAR_THEMES.length].accent)
}));

const GOAL_DEFAULTS: Record<GoalType, { color: string }> = {
    STEPS: { color: '#10b981' },
    CALORIES: { color: '#f97316' },
    WATER: { color: '#0ea5e9' },
    PUSHUPS: { color: '#3b82f6' },
    SQUATS: { color: '#c084fc' },
    SITUPS: { color: '#fb923c' },
    JUMPING_JACKS: { color: '#f43f5e' },
    LUNGES: { color: '#8b5cf6' },
    BURPEES: { color: '#ea580c' },
    DIPS: { color: '#06b6d4' },
    PULLUPS: { color: '#7c3aed' },
    PLANK: { color: '#14b8a6' },
    MOUNTAIN_CLIMBERS: { color: '#f59e0b' },
    CRUNCHES: { color: '#ec4899' },
    LEG_RAISES: { color: '#6366f1' },
    BICYCLE_CRUNCHES: { color: '#84cc16' },
    HIGH_KNEES: { color: '#ef4444' }
};

const DEFAULT_GOALS: DailyGoal[] = [
  { type: 'CALORIES', target: 2000, current: 0, isEnabled: true, unit: 'kcal', color: GOAL_DEFAULTS.CALORIES.color },
  { type: 'WATER', target: 2000, current: 0, isEnabled: true, unit: 'ml', color: GOAL_DEFAULTS.WATER.color },
  { type: 'STEPS', target: 10000, current: 0, isEnabled: true, unit: 'steps', color: GOAL_DEFAULTS.STEPS.color },
  { type: 'PUSHUPS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.PUSHUPS.color },
  { type: 'SQUATS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.SQUATS.color },
  { type: 'SITUPS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.SITUPS.color },
  { type: 'JUMPING_JACKS', target: 100, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.JUMPING_JACKS.color },
  { type: 'LUNGES', target: 40, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.LUNGES.color },
  { type: 'BURPEES', target: 20, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.BURPEES.color },
  { type: 'DIPS', target: 30, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.DIPS.color },
  { type: 'PULLUPS', target: 20, current: 0, isEnabled: false, unit: 'reps', color: GOAL_DEFAULTS.PULLUPS.color },
];

const DEFAULT_SETTINGS: UserSettings = {
  name: 'User',
  avatar: PREDEFINED_AVATARS[0].url,
  age: 25,
  height: 175,
  gender: 'MALE',
  activityLevel: 'MODERATE',
  installDate: new Date().toISOString(),
  referenceObject: '',
  referenceDimensions: '',
  phoneModel: '',
  phoneWeight: 0,
  goals: DEFAULT_GOALS,
  targetWeight: 70,
  streak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  theme: 'dark',
  connectedPlatforms: {
      googleFit: false,
      appleHealth: false,
      lastSync: null
  },
  isPro: false,
  backendUrl: 'https://api.fitstream.health',
  coachVoice: 'Fenrir',
  shoppingPreferences: {
    daysCount: 3,
    peopleCount: 2,
    cookingDifficulty: 'easy' as const,
    maxCookingTime: 'quick' as const,
    budget: undefined
  }
};

export { GOAL_DEFAULTS, DEFAULT_GOALS, DEFAULT_SETTINGS, KEYS };

// Base storage service — auth, settings, user identity
export const BaseStorageService = {
  getUserId: (): string => {
      let id = localStorage.getItem(KEYS.USER_ID);
      if (!id) {
          id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
          localStorage.setItem(KEYS.USER_ID, id);
      }
      return id;
  },

  setUserId: (newUserId: string): void => {
      localStorage.setItem(KEYS.USER_ID, newUserId);
  },

  isLoggedIn: (): boolean => {
      const settings = BaseStorageService.getSettings();
      return !!(settings.email && settings.googleId);
  },

  getSettings: (): UserSettings => {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) return { ...DEFAULT_SETTINGS };
      try {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      } catch (e) {
          return { ...DEFAULT_SETTINGS };
      }
  },

  saveSettings: (settings: UserSettings, syncToBackend = true): void => {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      if (syncToBackend) {
          const userId = BaseStorageService.getUserId();
          ApiService.syncUser(userId, settings, settings.backendUrl);
      }
  },

  logout: (): void => {
      const settings = BaseStorageService.getSettings();
      const newSettings = {
          ...settings,
          email: undefined,
          googleId: undefined
      };
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(newSettings));
      const newId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem(KEYS.USER_ID, newId);
  },

  mergeCloudSettings: (cloudData: { settings?: any; isPro?: boolean }): void => {
      if (cloudData.settings || cloudData.isPro !== undefined) {
          const localSettings = BaseStorageService.getSettings();
          const mergedSettings = {
              ...localSettings,
              ...(cloudData.settings || {}),
              isPro: cloudData.isPro || localSettings.isPro
          };
          localStorage.setItem(KEYS.SETTINGS, JSON.stringify(mergedSettings));
      }
  },
};
