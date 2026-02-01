// components/Billing/BalanceMini.tsx
// Compact balance indicator for header

import React from 'react';
import { Wallet } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface BalanceMiniProps {
  onTopUp: () => void;
}

export const BalanceMini: React.FC<BalanceMiniProps> = ({ onTopUp }) => {
  const { balance, loading } = useBilling();

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse">
        <div className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    );
  }

  // No balance - show placeholder
  if (!balance) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 text-sm font-medium"
      >
        <Wallet size={14} />
        <span>$--</span>
      </button>
    );
  }

  // Trial active
  if (balance.isTrialActive) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-sm font-medium shadow-sm"
      >
        <Wallet size={14} />
        <span>Trial</span>
      </button>
    );
  }

  // Blocked - red
  if (balance.isBlocked) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500 rounded-lg text-white text-sm font-medium animate-pulse shadow-sm"
      >
        <Wallet size={14} />
        <span>$0</span>
      </button>
    );
  }

  // Low balance - amber
  if (balance.isLowBalance) {
    return (
      <button
        onClick={onTopUp}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 rounded-lg text-white text-sm font-medium shadow-sm"
      >
        <Wallet size={14} />
        <span>${balance.balanceDollars}</span>
      </button>
    );
  }

  // Normal - green
  return (
    <button
      onClick={onTopUp}
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 dark:bg-emerald-500/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-sm font-medium"
    >
      <Wallet size={14} />
      <span>${balance.balanceDollars}</span>
    </button>
  );
};
