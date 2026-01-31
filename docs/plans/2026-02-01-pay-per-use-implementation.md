# Pay-Per-Use Billing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement pay-as-you-go billing system with PayPal checkout, replacing subscription model.

**Architecture:** Backend billing service (Express + PostgreSQL) + Frontend billing context and UI components. AI functions check balance before execution and charge on success.

**Tech Stack:** Express.js, PostgreSQL, PayPal Checkout SDK, React Context, TypeScript

---

## Phase 1: Database Schema

### Task 1.1: Create billing migration file

**Files:**
- Create: `backend/migrations/006_billing.sql`

**Step 1: Write migration SQL**

```sql
-- Migration: 006_billing.sql
-- Pay-per-use billing tables

-- User balance table
CREATE TABLE IF NOT EXISTS user_balance (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  balance_cents INTEGER DEFAULT 0,
  trial_ends_at TIMESTAMP,
  trial_usage_cents INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions history
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount_cents INTEGER NOT NULL,
  description TEXT,
  paypal_order_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Detailed usage log
CREATE TABLE IF NOT EXISTS usage_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  cost_cents INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_balance_user_id ON user_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_log_user_id_created ON usage_log(user_id, created_at);
```

**Step 2: Commit**

```bash
git add backend/migrations/006_billing.sql
git commit -m "feat(billing): add database schema for pay-per-use billing"
```

---

## Phase 2: Backend Billing Service

### Task 2.1: Create billing service module

**Files:**
- Create: `backend/services/billingService.js`

**Step 1: Write billing service**

```javascript
// backend/services/billingService.js

const PRICES_CENTS = {
  food_scan: 5,           // $0.05
  food_scan_cost: 6,      // $0.06
  receipt_scan: 6,        // $0.06
  storage_scan: 6,        // $0.06
  menu_scan: 5,           // $0.05
  recipe_ai: 1,           // $0.01
  scale_scan: 2,          // $0.02
};

const TRIAL_DAYS = 3;
const CREDIT_LIMIT_CENTS = -50; // -$0.50 credit limit
const LOW_BALANCE_CENTS = 50;   // $0.50 warning threshold
const TRIAL_BONUS_CENTS = 50;   // $0.50 bonus after trial

class BillingService {
  constructor(pool) {
    this.pool = pool;
  }

  // Get or create user balance
  async getBalance(userId) {
    const result = await this.pool.query(
      'SELECT * FROM user_balance WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create new user with trial
      const trialEnds = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      const insert = await this.pool.query(
        `INSERT INTO user_balance (user_id, balance_cents, trial_ends_at, trial_usage_cents)
         VALUES ($1, 0, $2, 0) RETURNING *`,
        [userId, trialEnds]
      );
      return this.formatBalance(insert.rows[0]);
    }

    return this.formatBalance(result.rows[0]);
  }

  formatBalance(row) {
    const now = new Date();
    const trialEnds = row.trial_ends_at ? new Date(row.trial_ends_at) : null;
    const isTrialActive = trialEnds && trialEnds > now;
    const trialDaysLeft = isTrialActive
      ? Math.ceil((trialEnds - now) / (24 * 60 * 60 * 1000))
      : 0;

    return {
      balanceCents: row.balance_cents,
      balanceDollars: (row.balance_cents / 100).toFixed(2),
      isTrialActive,
      trialDaysLeft,
      trialUsageCents: row.trial_usage_cents || 0,
      trialUsageDollars: ((row.trial_usage_cents || 0) / 100).toFixed(2),
      isLowBalance: !isTrialActive && row.balance_cents < LOW_BALANCE_CENTS,
      isBlocked: !isTrialActive && row.balance_cents < CREDIT_LIMIT_CENTS,
    };
  }

  // Check if action is allowed and charge
  async chargeForAction(userId, actionType) {
    const cost = PRICES_CENTS[actionType];
    if (!cost) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    const balance = await this.getBalance(userId);

    // Trial mode - log virtual usage
    if (balance.isTrialActive) {
      await this.pool.query(
        `UPDATE user_balance
         SET trial_usage_cents = trial_usage_cents + $1, updated_at = NOW()
         WHERE user_id = $2`,
        [cost, userId]
      );
      await this.logUsage(userId, actionType, cost, { trial: true });
      return { allowed: true, charged: 0, trial: true };
    }

    // Check if blocked
    if (balance.balanceCents < CREDIT_LIMIT_CENTS) {
      return { allowed: false, reason: 'insufficient_balance' };
    }

    // Deduct balance
    await this.pool.query(
      `UPDATE user_balance
       SET balance_cents = balance_cents - $1, updated_at = NOW()
       WHERE user_id = $2`,
      [cost, userId]
    );

    // Log transaction
    await this.pool.query(
      `INSERT INTO transactions (user_id, type, amount_cents, description)
       VALUES ($1, 'usage', $2, $3)`,
      [userId, -cost, actionType]
    );

    await this.logUsage(userId, actionType, cost, {});

    return { allowed: true, charged: cost };
  }

  async logUsage(userId, actionType, costCents, metadata) {
    await this.pool.query(
      `INSERT INTO usage_log (user_id, action_type, cost_cents, metadata)
       VALUES ($1, $2, $3, $4)`,
      [userId, actionType, costCents, JSON.stringify(metadata)]
    );
  }

  // Add balance (from PayPal)
  async addBalance(userId, amountCents, paypalOrderId) {
    // Check if trial just ended - give bonus
    const balance = await this.getBalance(userId);
    let bonusApplied = false;

    if (!balance.isTrialActive && balance.balanceCents === 0) {
      // First top-up after trial - add bonus
      amountCents += TRIAL_BONUS_CENTS;
      bonusApplied = true;
    }

    await this.pool.query(
      `UPDATE user_balance
       SET balance_cents = balance_cents + $1, updated_at = NOW()
       WHERE user_id = $2`,
      [amountCents, userId]
    );

    await this.pool.query(
      `INSERT INTO transactions (user_id, type, amount_cents, description, paypal_order_id)
       VALUES ($1, 'topup', $2, $3, $4)`,
      [userId, amountCents, `PayPal top-up${bonusApplied ? ' + $0.50 bonus' : ''}`, paypalOrderId]
    );

    return { success: true, bonusApplied, totalCents: amountCents };
  }

  // Get usage statistics
  async getUsageStats(userId) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [todayRes, weekRes, monthRes, byTypeRes] = await Promise.all([
      this.pool.query(
        `SELECT COALESCE(SUM(cost_cents), 0) as total FROM usage_log
         WHERE user_id = $1 AND created_at::date = $2::date`,
        [userId, today]
      ),
      this.pool.query(
        `SELECT COALESCE(SUM(cost_cents), 0) as total FROM usage_log
         WHERE user_id = $1 AND created_at >= $2`,
        [userId, weekAgo]
      ),
      this.pool.query(
        `SELECT COALESCE(SUM(cost_cents), 0) as total FROM usage_log
         WHERE user_id = $1 AND created_at >= $2`,
        [userId, monthAgo]
      ),
      this.pool.query(
        `SELECT action_type, SUM(cost_cents) as total FROM usage_log
         WHERE user_id = $1 AND created_at >= $2
         GROUP BY action_type ORDER BY total DESC`,
        [userId, monthAgo]
      ),
    ]);

    return {
      today: { cents: parseInt(todayRes.rows[0].total), dollars: (parseInt(todayRes.rows[0].total) / 100).toFixed(2) },
      week: { cents: parseInt(weekRes.rows[0].total), dollars: (parseInt(weekRes.rows[0].total) / 100).toFixed(2) },
      month: { cents: parseInt(monthRes.rows[0].total), dollars: (parseInt(monthRes.rows[0].total) / 100).toFixed(2) },
      byType: byTypeRes.rows.map(r => ({
        type: r.action_type,
        cents: parseInt(r.total),
        dollars: (parseInt(r.total) / 100).toFixed(2),
      })),
    };
  }

  // Migrate device user to Google account
  async migrateUser(deviceId, googleId) {
    // Check if device user has data
    const deviceBalance = await this.pool.query(
      'SELECT * FROM user_balance WHERE user_id = $1',
      [deviceId]
    );

    if (deviceBalance.rows.length === 0) return { migrated: false };

    // Check if Google user already exists
    const googleBalance = await this.pool.query(
      'SELECT * FROM user_balance WHERE user_id = $1',
      [googleId]
    );

    if (googleBalance.rows.length > 0) {
      // Merge: add device balance to google balance
      await this.pool.query(
        `UPDATE user_balance
         SET balance_cents = balance_cents + $1,
             trial_usage_cents = trial_usage_cents + $2
         WHERE user_id = $3`,
        [deviceBalance.rows[0].balance_cents, deviceBalance.rows[0].trial_usage_cents, googleId]
      );
    } else {
      // Transfer: update device record to google id
      await this.pool.query(
        'UPDATE user_balance SET user_id = $1 WHERE user_id = $2',
        [googleId, deviceId]
      );
    }

    // Update transactions and usage_log
    await this.pool.query('UPDATE transactions SET user_id = $1 WHERE user_id = $2', [googleId, deviceId]);
    await this.pool.query('UPDATE usage_log SET user_id = $1 WHERE user_id = $2', [googleId, deviceId]);

    // Delete old device record if merged
    if (googleBalance.rows.length > 0) {
      await this.pool.query('DELETE FROM user_balance WHERE user_id = $1', [deviceId]);
    }

    return { migrated: true };
  }
}

module.exports = { BillingService, PRICES_CENTS };
```

**Step 2: Commit**

```bash
git add backend/services/billingService.js
git commit -m "feat(billing): add billing service with balance management"
```

---

### Task 2.2: Add billing API endpoints to server

**Files:**
- Modify: `backend/server.js`

**Step 1: Add billing routes**

Add after existing routes (around line 400+):

```javascript
// --- BILLING API ---
const { BillingService, PRICES_CENTS } = require('./services/billingService');
const billingService = new BillingService(pool);

// Get balance
app.get('/api/billing/balance', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const balance = await billingService.getBalance(userId);
    res.json(balance);
  } catch (e) {
    console.error('Error getting balance:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get usage stats
app.get('/api/billing/usage', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const stats = await billingService.getUsageStats(userId);
    res.json(stats);
  } catch (e) {
    console.error('Error getting usage:', e);
    res.status(500).json({ error: e.message });
  }
});

// Get prices
app.get('/api/billing/prices', (req, res) => {
  res.json(PRICES_CENTS);
});

// Charge for action (internal use)
app.post('/api/billing/charge', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { actionType } = req.body;
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const result = await billingService.chargeForAction(userId, actionType);
    res.json(result);
  } catch (e) {
    console.error('Error charging:', e);
    res.status(500).json({ error: e.message });
  }
});

// Create PayPal order
app.post('/api/billing/create-order', async (req, res) => {
  try {
    const { amountDollars } = req.body;
    if (!amountDollars || amountDollars < 1) {
      return res.status(400).json({ error: 'Minimum $1' });
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: amountDollars.toFixed(2),
          },
          description: `FitStream AI Balance Top-up`,
        }],
      }),
    });

    const order = await response.json();
    res.json({ orderId: order.id });
  } catch (e) {
    console.error('Error creating PayPal order:', e);
    res.status(500).json({ error: e.message });
  }
});

// Capture PayPal order
app.post('/api/billing/capture-order', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { orderId } = req.body;
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const capture = await response.json();

    if (capture.status === 'COMPLETED') {
      const amountDollars = parseFloat(capture.purchase_units[0].payments.captures[0].amount.value);
      const amountCents = Math.round(amountDollars * 100);

      const result = await billingService.addBalance(userId, amountCents, orderId);
      res.json({ success: true, ...result });
    } else {
      res.status(400).json({ error: 'Payment not completed', status: capture.status });
    }
  } catch (e) {
    console.error('Error capturing PayPal order:', e);
    res.status(500).json({ error: e.message });
  }
});

// Migrate user (device -> google)
app.post('/api/billing/migrate', async (req, res) => {
  try {
    const { deviceId, googleId } = req.body;
    if (!deviceId || !googleId) {
      return res.status(400).json({ error: 'Both IDs required' });
    }

    const result = await billingService.migrateUser(deviceId, googleId);
    res.json(result);
  } catch (e) {
    console.error('Error migrating user:', e);
    res.status(500).json({ error: e.message });
  }
});
```

**Step 2: Commit**

```bash
git add backend/server.js
git commit -m "feat(billing): add billing API endpoints"
```

---

## Phase 3: Frontend Types and Service

### Task 3.1: Add billing types

**Files:**
- Modify: `types.ts`

**Step 1: Add billing interfaces**

Add at the end of `types.ts`:

```typescript
// Billing types
export interface UserBalance {
  balanceCents: number;
  balanceDollars: string;
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialUsageCents: number;
  trialUsageDollars: string;
  isLowBalance: boolean;
  isBlocked: boolean;
}

export interface UsageStats {
  today: { cents: number; dollars: string };
  week: { cents: number; dollars: string };
  month: { cents: number; dollars: string };
  byType: Array<{ type: string; cents: number; dollars: string }>;
}

export interface ChargeResult {
  allowed: boolean;
  charged?: number;
  trial?: boolean;
  reason?: string;
}

export type BillingActionType =
  | 'food_scan'
  | 'food_scan_cost'
  | 'receipt_scan'
  | 'storage_scan'
  | 'menu_scan'
  | 'recipe_ai'
  | 'scale_scan';

export interface EconomySettings {
  recipeImages: 'ai' | 'database' | 'none';
  recipeSource: 'ai' | 'database' | 'hybrid';
  foodAnalysis: 'full' | 'basic';
}
```

**Step 2: Commit**

```bash
git add types.ts
git commit -m "feat(billing): add TypeScript types for billing"
```

---

### Task 3.2: Create billing service

**Files:**
- Create: `services/billingService.ts`

**Step 1: Write billing service**

```typescript
// services/billingService.ts

import { ApiService } from './api';
import { UserBalance, UsageStats, ChargeResult, BillingActionType } from '../types';

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
    try {
      const response = await ApiService.get(`/billing/balance`, {
        headers: { 'x-user-id': userId },
      });
      this.balance = response;
      this.notifyListeners();
      return response;
    } catch (e) {
      console.error('Error fetching balance:', e);
      throw e;
    }
  }

  async getUsageStats(userId: string): Promise<UsageStats> {
    const response = await ApiService.get(`/billing/usage`, {
      headers: { 'x-user-id': userId },
    });
    return response;
  }

  async chargeForAction(userId: string, actionType: BillingActionType): Promise<ChargeResult> {
    const response = await ApiService.post(`/billing/charge`,
      { actionType },
      { headers: { 'x-user-id': userId } }
    );

    // Refresh balance after charge
    if (response.allowed) {
      await this.getBalance(userId);
    }

    return response;
  }

  async createPayPalOrder(amountDollars: number): Promise<string> {
    const response = await ApiService.post(`/billing/create-order`, { amountDollars });
    return response.orderId;
  }

  async capturePayPalOrder(userId: string, orderId: string): Promise<{ success: boolean; bonusApplied?: boolean }> {
    const response = await ApiService.post(`/billing/capture-order`,
      { orderId },
      { headers: { 'x-user-id': userId } }
    );

    // Refresh balance after payment
    await this.getBalance(userId);

    return response;
  }

  async migrateUser(deviceId: string, googleId: string): Promise<{ migrated: boolean }> {
    return ApiService.post(`/billing/migrate`, { deviceId, googleId });
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
```

**Step 2: Commit**

```bash
git add services/billingService.ts
git commit -m "feat(billing): add frontend billing service"
```

---

## Phase 4: React Context and Components

### Task 4.1: Create BillingContext

**Files:**
- Create: `contexts/BillingContext.tsx`

**Step 1: Write context**

```typescript
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
        setEconomySettings(JSON.parse(saved));
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
```

**Step 2: Commit**

```bash
mkdir -p contexts
git add contexts/BillingContext.tsx
git commit -m "feat(billing): add React billing context"
```

---

### Task 4.2: Create BalanceIndicator component

**Files:**
- Create: `components/Billing/BalanceIndicator.tsx`

**Step 1: Write component**

```typescript
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
```

**Step 2: Commit**

```bash
mkdir -p components/Billing
git add components/Billing/BalanceIndicator.tsx
git commit -m "feat(billing): add BalanceIndicator component"
```

---

### Task 4.3: Create TopUpModal component

**Files:**
- Create: `components/Billing/TopUpModal.tsx`

**Step 1: Write component**

```typescript
// components/Billing/TopUpModal.tsx

import React, { useState } from 'react';
import { X, Wallet, Check, Loader2 } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';
import { BillingService } from '../../services/billingService';
import { StorageService } from '../../services/storageService';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PACKAGES = [
  { amount: 5, label: '$5', scans: '~100', discount: 0 },
  { amount: 10, label: '$10', scans: '~220', discount: 10, popular: true },
  { amount: 25, label: '$25', scans: '~600', discount: 20 },
];

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose }) => {
  const { balance, refreshBalance } = useBilling();
  const [selectedAmount, setSelectedAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const finalAmount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handlePayPal = async () => {
    if (finalAmount < 1) {
      setError('Минимум $1');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderId = await BillingService.createPayPalOrder(finalAmount);

      // Open PayPal popup
      const paypalUrl = `https://www.paypal.com/checkoutnow?token=${orderId}`;
      const popup = window.open(paypalUrl, 'PayPal', 'width=450,height=600');

      // Poll for completion (simplified - in production use postMessage)
      const checkInterval = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(checkInterval);

          // Try to capture
          try {
            const settings = StorageService.getSettings();
            const userId = settings.googleId || StorageService.getUserId();
            const result = await BillingService.capturePayPalOrder(userId, orderId);

            if (result.success) {
              setSuccess(true);
              await refreshBalance();
              setTimeout(() => {
                setSuccess(false);
                onClose();
              }, 2000);
            }
          } catch (e) {
            // Payment might have been cancelled
            setLoading(false);
          }
        }
      }, 1000);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="text-emerald-500" size={24} />
            Пополнить баланс
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current balance */}
          {balance && (
            <div className="text-center py-2">
              <span className="text-gray-500">Текущий баланс: </span>
              <span className="font-bold text-gray-900 dark:text-white">${balance.balanceDollars}</span>
            </div>
          )}

          {/* Packages */}
          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.amount}
                onClick={() => { setSelectedAmount(pkg.amount); setCustomAmount(''); }}
                className={`relative p-3 rounded-xl border-2 transition flex flex-col items-center gap-1
                  ${selectedAmount === pkg.amount && !customAmount
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
                    Popular
                  </span>
                )}
                <span className="text-lg font-bold text-gray-900 dark:text-white">{pkg.label}</span>
                {pkg.discount > 0 && (
                  <span className="text-xs text-emerald-600 font-medium">-{pkg.discount}%</span>
                )}
                <span className="text-xs text-gray-500">{pkg.scans} сканов</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Другая сумма:</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-2">
              <Check size={16} />
              Баланс пополнен!
            </div>
          )}

          {/* PayPal button */}
          <button
            onClick={handlePayPal}
            disabled={loading || success}
            className="w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.013 4.875-2.134 8.047-7.426 8.047h-2.19a1.736 1.736 0 0 0-1.714 1.467l-1.12 7.106a.641.641 0 0 0 .633.74h3.147l.741-4.694a1.736 1.736 0 0 1 1.714-1.467h1.14c4.637 0 8.27-1.883 9.327-7.335a6.843 6.843 0 0 0 .06-.474 4.044 4.044 0 0 0-3.705-2.849z"/>
                </svg>
                Оплатить через PayPal
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            Принимаем карты без аккаунта PayPal
          </p>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add components/Billing/TopUpModal.tsx
git commit -m "feat(billing): add TopUpModal component"
```

---

### Task 4.4: Create TrialBanner component

**Files:**
- Create: `components/Billing/TrialBanner.tsx`

**Step 1: Write component**

```typescript
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

  const monthlyEstimate = (parseFloat(balance.trialUsageDollars) / (3 - balance.trialDaysLeft + 1)) * 30;

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Gift size={20} />
        <span className="font-bold">Trial: осталось {balance.trialDaysLeft} {balance.trialDaysLeft === 1 ? 'день' : 'дня'}</span>
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
```

**Step 2: Commit**

```bash
git add components/Billing/TrialBanner.tsx
git commit -m "feat(billing): add TrialBanner component"
```

---

### Task 4.5: Create UsageStats component

**Files:**
- Create: `components/Billing/UsageStats.tsx`

**Step 1: Write component**

```typescript
// components/Billing/UsageStats.tsx

import React, { useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { useBilling } from '../../contexts/BillingContext';
import { t } from '../../services/i18n';

const ACTION_ICONS: Record<string, string> = {
  food_scan: '🍔',
  food_scan_cost: '🍔',
  receipt_scan: '🧾',
  storage_scan: '📷',
  menu_scan: '📋',
  recipe_ai: '🍳',
  scale_scan: '⚖️',
};

const ACTION_NAMES: Record<string, string> = {
  food_scan: 'Анализ еды',
  food_scan_cost: 'Еда + стоимость',
  receipt_scan: 'Чеки',
  storage_scan: 'Холодильник',
  menu_scan: 'Меню',
  recipe_ai: 'Рецепты',
  scale_scan: 'Весы',
};

export const UsageStats: React.FC = () => {
  const { usageStats, refreshUsageStats } = useBilling();

  useEffect(() => {
    refreshUsageStats();
  }, [refreshUsageStats]);

  if (!usageStats) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const totalMonth = usageStats.month.cents;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 size={20} className="text-purple-500" />
        Расходы
      </h3>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Сегодня</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${usageStats.today.dollars}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Неделя</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${usageStats.week.dollars}</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500">Месяц</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">${usageStats.month.dollars}</p>
        </div>
      </div>

      {/* By category */}
      {usageStats.byType.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-500">По категориям:</p>
          {usageStats.byType.map((item) => {
            const percent = totalMonth > 0 ? (item.cents / totalMonth) * 100 : 0;
            return (
              <div key={item.type} className="flex items-center gap-3">
                <span className="text-xl">{ACTION_ICONS[item.type] || '📊'}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {ACTION_NAMES[item.type] || item.type}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${item.dollars} ({percent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
```

**Step 2: Commit**

```bash
git add components/Billing/UsageStats.tsx
git commit -m "feat(billing): add UsageStats component"
```

---

### Task 4.6: Create index export

**Files:**
- Create: `components/Billing/index.ts`

**Step 1: Write exports**

```typescript
// components/Billing/index.ts

export { BalanceIndicator } from './BalanceIndicator';
export { TopUpModal } from './TopUpModal';
export { TrialBanner } from './TrialBanner';
export { UsageStats } from './UsageStats';
```

**Step 2: Commit**

```bash
git add components/Billing/index.ts
git commit -m "feat(billing): add component exports"
```

---

## Phase 5: Integration

### Task 5.1: Wrap App with BillingProvider

**Files:**
- Modify: `App.tsx`

**Step 1: Add provider**

At the top of App.tsx, add import:

```typescript
import { BillingProvider } from './contexts/BillingContext';
```

Wrap the main app content with BillingProvider (inside existing providers).

**Step 2: Add BalanceIndicator to header**

Import and add to header area:

```typescript
import { BalanceIndicator, TopUpModal, TrialBanner } from './components/Billing';
```

Add state for modal:

```typescript
const [showTopUpModal, setShowTopUpModal] = useState(false);
```

Add to header:

```tsx
<BalanceIndicator onTopUp={() => setShowTopUpModal(true)} />
```

Add modal:

```tsx
<TopUpModal isOpen={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
```

**Step 3: Commit**

```bash
git add App.tsx
git commit -m "feat(billing): integrate billing into App"
```

---

### Task 5.2: Add billing check to AI functions

**Files:**
- Modify: `services/geminiService.ts`

**Step 1: Create wrapper function**

Add at the top:

```typescript
import { BillingService } from './billingService';
import { StorageService } from './storageService';

const checkAndCharge = async (actionType: string): Promise<{ allowed: boolean; reason?: string }> => {
  const settings = StorageService.getSettings();
  const userId = settings.googleId || StorageService.getUserId();

  try {
    const result = await BillingService.chargeForAction(userId, actionType as any);
    return result;
  } catch (e) {
    console.error('Billing check failed:', e);
    // Allow on billing error to not break UX
    return { allowed: true };
  }
};
```

**Step 2: Add to analyzeFood**

At the start of `analyzeFood` function:

```typescript
const billing = await checkAndCharge('food_scan');
if (!billing.allowed) {
  throw new Error('INSUFFICIENT_BALANCE');
}
```

Repeat for other AI functions with appropriate action types.

**Step 3: Commit**

```bash
git add services/geminiService.ts
git commit -m "feat(billing): add balance checks to AI functions"
```

---

## Phase 6: Testing

### Task 6.1: Test database migration

**Step 1: Run migration on dev database**

```bash
cd backend
# Apply migration
psql $DATABASE_URL -f migrations/006_billing.sql
```

**Step 2: Verify tables created**

```bash
psql $DATABASE_URL -c "\dt"
# Should show user_balance, transactions, usage_log
```

---

### Task 6.2: Test billing flow manually

**Step 1: Start backend**

```bash
cd backend && npm start
```

**Step 2: Test balance endpoint**

```bash
curl -H "x-user-id: test123" http://localhost:3000/api/billing/balance
```

Expected: JSON with trial active, 3 days left.

**Step 3: Test charge endpoint**

```bash
curl -X POST -H "x-user-id: test123" -H "Content-Type: application/json" \
  -d '{"actionType":"food_scan"}' \
  http://localhost:3000/api/billing/charge
```

Expected: `{ "allowed": true, "charged": 0, "trial": true }`

---

## Summary

**Files created:**
- `backend/migrations/006_billing.sql`
- `backend/services/billingService.js`
- `services/billingService.ts`
- `contexts/BillingContext.tsx`
- `components/Billing/BalanceIndicator.tsx`
- `components/Billing/TopUpModal.tsx`
- `components/Billing/TrialBanner.tsx`
- `components/Billing/UsageStats.tsx`
- `components/Billing/index.ts`

**Files modified:**
- `backend/server.js` (billing routes)
- `types.ts` (billing types)
- `App.tsx` (provider + components)
- `services/geminiService.ts` (balance checks)

**Total commits:** ~12
