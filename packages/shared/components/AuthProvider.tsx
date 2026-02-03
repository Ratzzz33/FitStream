// @fitstream/shared - Auth Provider
// Wraps Google OAuth login/logout for all standalone apps

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ApiService } from '../services/api';
import { BaseStorageService } from '../services/storageService';
import { BillingService } from '../services/billingService';
import type { UserSettings } from '../types';

interface AuthContextValue {
  isLoggedIn: boolean;
  userId: string;
  settings: UserSettings;
  login: (idToken: string) => Promise<boolean>;
  logout: () => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  refreshBalance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children, onSettingsChange }: {
  children: React.ReactNode;
  onSettingsChange?: (settings: UserSettings) => void;
}) {
  const [settings, setSettings] = useState<UserSettings>(() => BaseStorageService.getSettings());
  const [userId, setUserId] = useState(() => BaseStorageService.getUserId());
  const isLoggedIn = !!(settings.email && settings.googleId);

  const login = useCallback(async (idToken: string): Promise<boolean> => {
    const localUserId = BaseStorageService.getUserId();
    const result = await ApiService.authenticateWithGoogle(idToken, localUserId);
    if (!result) return false;

    BaseStorageService.setUserId(result.userId);
    setUserId(result.userId);

    const newSettings: UserSettings = {
      ...settings,
      email: result.email,
      googleId: result.googleId,
      name: result.name || settings.name,
      avatar: result.picture || settings.avatar,
      isPro: result.isPro || settings.isPro,
    };
    BaseStorageService.saveSettings(newSettings);
    setSettings(newSettings);
    onSettingsChange?.(newSettings);

    // Migrate billing from device to Google account
    try {
      await BillingService.migrateUser(localUserId, result.googleId);
    } catch (e) {
      console.warn('Billing migration skipped:', e);
    }

    return true;
  }, [settings, onSettingsChange]);

  const logout = useCallback(() => {
    BaseStorageService.logout();
    const newSettings = BaseStorageService.getSettings();
    setSettings(newSettings);
    setUserId(BaseStorageService.getUserId());
    onSettingsChange?.(newSettings);
  }, [onSettingsChange]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    const updated = { ...settings, ...partial };
    BaseStorageService.saveSettings(updated);
    setSettings(updated);
    onSettingsChange?.(updated);
  }, [settings, onSettingsChange]);

  const refreshBalance = useCallback(async () => {
    const uid = settings.googleId || userId;
    await BillingService.getBalance(uid);
  }, [settings.googleId, userId]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, settings, login, logout, updateSettings, refreshBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
