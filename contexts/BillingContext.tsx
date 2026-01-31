// contexts/BillingContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserBalance, UsageStats, ChargeResult, BillingActionType, EconomySettings } from '../types';
import { BillingService } from '../services/billingService';
import { StorageService } from '../services/storageService';

interface BillingContextType {
  balance: UserBalance | null;
  usageStats: UsageStats | null;
  economySettings: EconomySettings;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  refreshUsageStats: () => Promise<void>;
  chargeForAction: (actionType: BillingActionType) => Promise<ChargeResult>;
  updateEconomySettings: (settings: Partial<EconomySettings>) => void;
}

const defaultEconomySettings: EconomySettings = {
  recipeImages: 'database',
  recipeSource: 'database',
  foodAnalysis: 'full',
};

const BillingContext = createContext<BillingContextType | null>(null);

export const BillingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [economySettings, setEconomySettings] = useState<EconomySettings>(defaultEconomySettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getUserId = useCallback(() => {
    const settings = StorageService.getSettings();
    return settings.googleId || StorageService.getUserId();
  }, []);

  const refreshBalance = useCallback(async () => {
    try {
      const userId = getUserId();
      const bal = await BillingService.getBalance(userId);
      setBalance(bal);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [getUserId]);

  const refreshUsageStats = useCallback(async () => {
    try {
      const userId = getUserId();
      const stats = await BillingService.getUsageStats(userId);
      setUsageStats(stats);
    } catch (e: any) {
      console.error('Error fetching usage stats:', e);
    }
  }, [getUserId]);

  const chargeForAction = useCallback(async (actionType: BillingActionType): Promise<ChargeResult> => {
    const userId = getUserId();
    const result = await BillingService.chargeForAction(userId, actionType);

    // Update local balance
    if (result.allowed) {
      await refreshBalance();
    }

    return result;
  }, [getUserId, refreshBalance]);

  const updateEconomySettings = useCallback((settings: Partial<EconomySettings>) => {
    setEconomySettings(prev => {
      const updated = { ...prev, ...settings };
      localStorage.setItem('economySettings', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Load on mount
  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);

      // Load economy settings
      const saved = localStorage.getItem('economySettings');
      if (saved) {
        try {
          setEconomySettings(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse economy settings:', e);
        }
      }

      await refreshBalance();
      setLoading(false);
    };

    loadInitial();
  }, [refreshBalance]);

  return (
    <BillingContext.Provider value={{
      balance,
      usageStats,
      economySettings,
      loading,
      error,
      refreshBalance,
      refreshUsageStats,
      chargeForAction,
      updateEconomySettings,
    }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within BillingProvider');
  }
  return context;
};
