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
