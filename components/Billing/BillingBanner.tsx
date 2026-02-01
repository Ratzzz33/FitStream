// components/Billing/BillingBanner.tsx
// Informative billing banner with balance and usage info

import React from 'react';
import { Gift, Wallet, AlertTriangle, Zap, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface BillingBannerProps {
  onTopUp: () => void;
  variant?: 'dashboard' | 'settings';
}

// Average cost per AI action in cents
const AVG_ACTION_COST_CENTS = 5;

export const BillingBanner: React.FC<BillingBannerProps> = ({ onTopUp, variant = 'dashboard' }) => {
  const { balance, loading, error, refreshBalance } = useBilling();

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 animate-pulse">
        <div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-xl" />
      </div>
    );
  }

  // Calculate estimated actions from balance
  const getEstimatedActions = (balanceCents: number): number => {
    return Math.floor(balanceCents / AVG_ACTION_COST_CENTS);
  };

  // Error or no balance - show retry with better UX
  if (!balance || error) {
    return (
      <div
        onClick={() => refreshBalance()}
        className="cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 rounded-2xl p-5 border border-slate-600/30 shadow-lg transform transition hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-slate-600/50 p-3 rounded-xl">
              <RefreshCw size={24} className="text-slate-300" />
            </div>
            <div>
              <p className="font-bold text-lg text-white">Загрузка баланса...</p>
              <p className="text-sm text-slate-400">Нажмите для повторной попытки</p>
            </div>
          </div>
          <div className="bg-slate-600/50 px-4 py-2 rounded-xl">
            <RefreshCw size={18} className="text-slate-300" />
          </div>
        </div>
      </div>
    );
  }

  // Trial mode - vibrant purple gradient with progress
  if (balance.isTrialActive) {
    const usedPercent = Math.min((balance.trialUsageCents / 100) * 100, 100); // Assume $1 trial limit

    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-5 text-white shadow-xl transform transition hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Gift size={24} />
            </div>
            <div>
              <p className="font-bold text-xl">Бесплатный триал</p>
              <p className="text-sm text-white/70">
                {balance.trialDaysLeft} {getDaysWord(balance.trialDaysLeft)} осталось
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2">
            <Zap size={16} className="text-yellow-300" />
            <span className="font-semibold">Активен</span>
          </div>
        </div>

        {/* Usage progress */}
        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-white/70">Использовано</span>
            <span className="font-medium">${balance.trialUsageDollars}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Blocked - urgent red with clear CTA
  if (balance.isBlocked) {
    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-br from-red-500 via-red-600 to-orange-600 rounded-2xl p-5 text-white shadow-xl transform transition hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="font-bold text-xl">Баланс исчерпан</p>
              <p className="text-sm text-white/70">AI-функции недоступны</p>
            </div>
          </div>
        </div>

        <button className="w-full bg-white text-red-600 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 transition">
          <Wallet size={20} />
          Пополнить баланс
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Low balance - amber warning with urgency
  if (balance.isLowBalance) {
    const estimatedActions = getEstimatedActions(balance.balanceCents);

    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl transform transition hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Wallet size={24} />
            </div>
            <div>
              <p className="font-bold text-2xl">${balance.balanceDollars}</p>
              <p className="text-sm text-white/70">Низкий баланс</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">~{estimatedActions}</p>
            <p className="text-xs text-white/70">действий</p>
          </div>
        </div>

        <button className="w-full bg-white text-orange-600 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 transition">
          Пополнить
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // Normal balance - Settings variant (detailed)
  if (variant === 'settings') {
    const estimatedActions = getEstimatedActions(balance.balanceCents);

    return (
      <div
        onClick={onTopUp}
        className="cursor-pointer bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-2xl p-5 text-white shadow-xl transform transition hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-white/70">Ваш баланс</p>
              <p className="font-bold text-3xl">${balance.balanceDollars}</p>
            </div>
          </div>
          <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-2xl font-bold">~{estimatedActions}</p>
            <p className="text-xs text-white/70">AI-действий</p>
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-sm">AI-функции активны</span>
          </div>
          <span className="text-xs text-white/60">~$0.05 за действие</span>
        </div>

        <button className="w-full bg-white/20 backdrop-blur-sm text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition border border-white/20">
          <Wallet size={18} />
          Пополнить баланс
        </button>
      </div>
    );
  }

  // Dashboard variant - compact but informative
  const estimatedActions = getEstimatedActions(balance.balanceCents);

  return (
    <div
      onClick={onTopUp}
      className="cursor-pointer bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between transform transition hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2.5 rounded-xl text-white shadow-lg">
          <Wallet size={20} />
        </div>
        <div>
          <p className="font-bold text-lg text-gray-900 dark:text-white">${balance.balanceDollars}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">~{estimatedActions} действий</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <span className="text-sm font-medium">Пополнить</span>
        <ArrowRight size={18} />
      </div>
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
