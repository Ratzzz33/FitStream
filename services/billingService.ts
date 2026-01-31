// services/billingService.ts

import { UserBalance, UsageStats, ChargeResult, BillingActionType } from '../types';

const DEFAULT_API_URL = 'https://api.fitstream.health/api';

const getEffectiveUrl = () => {
  // Check if custom URL is stored in localStorage
  try {
    const settings = localStorage.getItem('fitstream_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.backendUrl && parsed.backendUrl.trim().length > 0) {
        let url = parsed.backendUrl.trim();
        if (url.endsWith('/')) url = url.slice(0, -1);
        if (!url.endsWith('/api')) url += '/api';
        return url;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  return DEFAULT_API_URL;
};

const fetchWithTimeout = async (resource: string, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

const ACTION_LABELS: Record<BillingActionType, string> = {
  food_scan: 'Анализ еды',
  food_scan_cost: 'Анализ еды + стоимость',
  receipt_scan: 'Сканирование чека',
  storage_scan: 'Сканирование холодильника',
  menu_scan: 'Анализ меню',
  recipe_ai: 'AI рецепты',
  scale_scan: 'Чтение весов',
};

class BillingServiceClass {
  private balance: UserBalance | null = null;
  private listeners: Array<(balance: UserBalance) => void> = [];

  async getBalance(userId: string): Promise<UserBalance> {
    const url = getEffectiveUrl();
    try {
      const response = await fetchWithTimeout(`${url}/billing/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status}`);
      }

      const data = await response.json();
      this.balance = data;
      this.notifyListeners();
      return data;
    } catch (e) {
      console.error('Error fetching balance:', e);
      throw e;
    }
  }

  async getUsageStats(userId: string): Promise<UsageStats> {
    const url = getEffectiveUrl();
    const response = await fetchWithTimeout(`${url}/billing/usage`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch usage stats: ${response.status}`);
    }

    return response.json();
  }

  async chargeForAction(userId: string, actionType: BillingActionType): Promise<ChargeResult> {
    const url = getEffectiveUrl();
    const response = await fetchWithTimeout(`${url}/billing/charge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ actionType }),
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Failed to charge for action: ${response.status}`);
    }

    const result = await response.json();

    // Refresh balance after charge
    if (result.allowed) {
      await this.getBalance(userId);
    }

    return result;
  }

  async createPayPalOrder(amountDollars: number): Promise<string> {
    const url = getEffectiveUrl();
    const response = await fetchWithTimeout(`${url}/billing/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountDollars }),
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Failed to create PayPal order: ${response.status}`);
    }

    const data = await response.json();
    return data.orderId;
  }

  async capturePayPalOrder(userId: string, orderId: string): Promise<{ success: boolean; bonusApplied?: boolean }> {
    const url = getEffectiveUrl();
    const response = await fetchWithTimeout(`${url}/billing/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
      },
      body: JSON.stringify({ orderId }),
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`Failed to capture PayPal order: ${response.status}`);
    }

    const result = await response.json();

    // Refresh balance after payment
    await this.getBalance(userId);

    return result;
  }

  async migrateUser(deviceId: string, googleId: string): Promise<{ migrated: boolean }> {
    const url = getEffectiveUrl();
    const response = await fetchWithTimeout(`${url}/billing/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, googleId }),
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Failed to migrate user: ${response.status}`);
    }

    return response.json();
  }

  // Subscribe to balance changes
  subscribe(listener: (balance: UserBalance) => void): () => void {
    this.listeners.push(listener);
    if (this.balance) listener(this.balance);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    if (this.balance) {
      this.listeners.forEach(l => l(this.balance!));
    }
  }

  getActionLabel(actionType: BillingActionType): string {
    return ACTION_LABELS[actionType] || actionType;
  }

  getCachedBalance(): UserBalance | null {
    return this.balance;
  }
}

export const BillingService = new BillingServiceClass();
