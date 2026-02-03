// @fitstream/shared - useBilling hook
// Subscribe to billing balance updates

import { useState, useEffect } from 'react';
import { BillingService } from '../services/billingService';
import type { UserBalance, BillingActionType, ChargeResult } from '../types';

export function useBilling(userId: string) {
  const [balance, setBalance] = useState<UserBalance | null>(BillingService.getCachedBalance());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = BillingService.subscribe(setBalance);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      BillingService.getBalance(userId).finally(() => setLoading(false));
    }
  }, [userId]);

  const charge = async (actionType: BillingActionType): Promise<ChargeResult> => {
    return BillingService.chargeForAction(userId, actionType);
  };

  return { balance, loading, charge, refresh: () => BillingService.getBalance(userId) };
}
