// @fitstream/shared - Package entry point

// Types
export * from './types';

// Services
export { ApiService, api } from './services/api';
export type { GoogleAuthResponse } from './services/api';
export { BillingService } from './services/billingService';
export {
  BaseStorageService,
  generateTotem,
  AVATAR_ANIMALS,
  AVATAR_THEMES,
  PREDEFINED_AVATARS,
  GOAL_DEFAULTS,
  DEFAULT_GOALS,
  DEFAULT_SETTINGS,
  KEYS,
} from './services/storageService';
export { t, tf, setLanguage, getLanguage, getSavedLanguage, getLanguageList } from './services/i18n';
export type { Language } from './services/i18n';

// Components
export { AuthProvider, useAuth } from './components/AuthProvider';
export { ThemeProvider, useTheme } from './components/ThemeProvider';
export { SettingsPanel } from './components/SettingsPanel';

// Hooks
export { useBilling } from './hooks/useBilling';
