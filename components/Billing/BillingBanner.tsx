// components/Billing/BillingBanner.tsx
// Replaces the old Pro banner with billing status

import React from 'react';
import { Gift, Wallet, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface BillingBannerProps {
  onTopUp: () => void;
  variant?: 'dashboard' | 'settings';
}

export const BillingBanner: React.FC<BillingBannerProps> = ({ onTopUp, variant = 'dashboard' }) => {
  const { balance, loading, error, refreshBalance } = useBilling();

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 animate-pulse">
        <div className="h-12 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  // Error or no balance - show fallback with retry
  if (!balance || error) {
    return (
      <div
        onClick={() => refreshBalance()}
        className="cursor-pointer bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-400/30 rounded-xl p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-gray-400 to-gray-500 p-2 rounded-lg text-white">
            <Wallet size={20} />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Баланс недоступен</p>
            <p className="text-xs text-gray-500">Нажмите для обновления</p>
          </div>
        </div>
        <ArrowRight className="text-gray-400" size={20} />
      </div>
    );
  }

  // Trial mode - purple gradient
  if (balance.isTrialActive) {
    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg transform transition hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Gift size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Бесплатный триал</p>
              <p className="text-sm text-white/80">
                Осталось {balance.trialDaysLeft} {getDaysWord(balance.trialDaysLeft)} • Использовано: ${balance.trialUsageDollars}
              </p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <Zap size={14} />
            <span>Активен</span>
          </div>
        </div>
      </div>
    );
  }

  // Blocked - red banner with urgent CTA
  if (balance.isBlocked) {
    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4 text-white shadow-lg transform transition hover:scale-[1.02] animate-pulse"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Баланс исчерпан</p>
              <p className="text-sm text-white/80">Пополните баланс для доступа к AI-функциям</p>
            </div>
          </div>
          <div className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1">
            Пополнить
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    );
  }

  // Low balance - amber warning
  if (balance.isLowBalance) {
    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl p-4 text-white shadow-lg transform transition hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Wallet size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Баланс: ${balance.balanceDollars}</p>
              <p className="text-sm text-white/80">Низкий баланс — скоро закончится</p>
            </div>
          </div>
          <div className="bg-white text-amber-600 px-3 py-1 rounded-full text-sm font-bold">
            Пополнить
          </div>
        </div>
      </div>
    );
  }

  // Normal balance - green/teal
  if (variant === 'settings') {
    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 text-white shadow-lg transform transition hover:scale-[1.02]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Wallet size={24} />
            </div>
            <div>
              <p className="font-bold text-lg">Баланс: ${balance.balanceDollars}</p>
              <p className="text-sm text-white/80">AI-функции активны</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
            Пополнить
          </div>
        </div>
      </div>
    );
  }

  // Dashboard variant - more compact
  return (
    <div
      onClick={onTopUp}
      className="cursor-pointer bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-lg text-white">
          <Wallet size={20} />
        </div>
        <div>
          <p className="font-bold text-gray-900 dark:text-white">Баланс: ${balance.balanceDollars}</p>
          <p className="text-xs text-gray-500">AI-функции активны</p>
        </div>
      </div>
      <ArrowRight className="text-emerald-500" size={20} />
    </div>
  );
};

// Helper for Russian word forms
function getDaysWord(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }
  if (lastDigit === 1) {
    return 'день';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }
  return 'дней';
}
