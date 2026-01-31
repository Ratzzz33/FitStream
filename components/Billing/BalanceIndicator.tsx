// components/Billing/BalanceIndicator.tsx

import React from 'react';
import { Wallet, AlertTriangle, Gift } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface BalanceIndicatorProps {
  onTopUp: () => void;
}

export const BalanceIndicator: React.FC<BalanceIndicatorProps> = ({ onTopUp }) => {
  const { balance, loading } = useBilling();

  if (loading || !balance) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse">
        <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  // Trial mode
  if (balance.isTrialActive) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium shadow-lg"
      >
        <Gift size={16} />
        <span>Trial: {balance.trialDaysLeft}д</span>
      </button>
    );
  }

  // Low balance warning
  if (balance.isLowBalance) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium"
      >
        <AlertTriangle size={16} />
        <span>${balance.balanceDollars}</span>
      </button>
    );
  }

  // Blocked
  if (balance.isBlocked) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium animate-pulse"
      >
        <AlertTriangle size={16} />
        <span>Пополнить</span>
      </button>
    );
  }

  // Normal
  return (
    <button
      onClick={onTopUp}
      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
    >
      <Wallet size={16} />
      <span>${balance.balanceDollars}</span>
    </button>
  );
};
