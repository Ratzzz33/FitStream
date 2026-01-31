// components/Billing/TrialBanner.tsx

import React from 'react';
import { Gift, TrendingUp, Clock } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';

interface TrialBannerProps {
  onTopUp: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onTopUp }) => {
  const { balance } = useBilling();

  if (!balance?.isTrialActive) return null;

  const daysUsed = 3 - balance.trialDaysLeft + 1;
  const monthlyEstimate = daysUsed > 0
    ? (parseFloat(balance.trialUsageDollars) / daysUsed) * 30
    : 0;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={20} />
        <span className="font-bold">
          Trial: осталось {balance.trialDaysLeft} {balance.trialDaysLeft === 1 ? 'день' : 'дня'}
        </span>
      </div>

      <div className="space-y-2 text-sm opacity-90">
        <div className="flex justify-between">
          <span>Использовано:</span>
          <span className="font-medium">${balance.trialUsageDollars}</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <TrendingUp size={14} />
            При таком темпе:
          </span>
          <span className="font-medium">~${monthlyEstimate.toFixed(0)}/мес</span>
        </div>
      </div>

      <button
        onClick={onTopUp}
        className="w-full mt-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition flex items-center justify-center gap-2"
      >
        <Clock size={16} />
        Пополнить со скидкой 10%
      </button>
    </div>
  );
};
