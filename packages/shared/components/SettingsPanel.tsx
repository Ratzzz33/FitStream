// @fitstream/shared - Settings Panel
// Shared user settings UI (profile, language, theme)

import { useState } from 'react';
import { Settings, User, Globe, Palette, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { t, setLanguage, getLanguage } from '../services/i18n';
import { PREDEFINED_AVATARS, AVATAR_ANIMALS, AVATAR_THEMES, generateTotem } from '../services/storageService';
import type { Language } from '../services/i18n';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' },
  { code: 'ka', label: 'ქართული' },
];

export function SettingsPanel({ appName }: { appName?: string }) {
  const { isLoggedIn, settings, updateSettings, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentLang, setCurrentLang] = useState(getLanguage());

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
    updateSettings({ language: lang });
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Settings size={20} />
        {t('settings')}
        {appName && <span className="text-sm font-normal text-gray-500">— {appName}</span>}
      </h2>

      {/* Profile */}
      <div className="rounded-xl bg-white/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <img src={settings.avatar} alt="Avatar" className="w-12 h-12 rounded-full" />
          <div>
            <div className="font-medium">{settings.name}</div>
            {settings.email && <div className="text-sm text-gray-400">{settings.email}</div>}
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="rounded-xl bg-white/5 p-4">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Palette size={18} />
            {t('theme') || 'Theme'}
          </span>
          <span className="text-sm text-gray-400">
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </span>
        </button>
      </div>

      {/* Language */}
      <div className="rounded-xl bg-white/5 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Globe size={18} />
          <span>{t('language') || 'Language'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                currentLang === code
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      {isLoggedIn && (
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <LogOut size={18} />
          {t('logout') || 'Logout'}
        </button>
      )}
    </div>
  );
}
