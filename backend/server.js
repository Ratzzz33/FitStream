
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const telegramService = require('./services/telegramService');
const currencyService = require('./services/currencyService');

// --- 0. SAFETY NETS (CRASH HANDLERS) ---
process.on('uncaughtException', (err) => {
  console.error('❌ CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ CRITICAL: Unhandled Rejection:', reason);
});

const app = express();

// --- 1. HEALTH CHECKS (CRITICAL PRIORITY) ---
// Must be defined BEFORE any middleware (cors, json, logging) to ensure instant response.
// Railway and other platforms ping this to know if the app is alive.
const healthHandler = (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
};

app.get('/', healthHandler);
app.get('/health', healthHandler);
app.head('/', healthHandler);
app.head('/health', healthHandler);

// --- 2. MIDDLEWARE ---
app.use(cors()); // Allow all origins
app.use(express.json({ limit: '10mb' }));

// Request Logging (Exclude health checks)
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/health') return next();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- 3. DATABASE SETUP ---
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Fix for self-signed certs in managed DBs (Railway, Heroku, etc.)
  ssl: connectionString && !connectionString.includes('localhost') 
       ? { rejectUnauthorized: false } 
       : false
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client (DB Connection Lost)', err);
});

// --- 4. GOOGLE AUTH SETUP ---
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Verify Google ID Token
async function verifyGoogleToken(idToken) {
    try {
        // Use Google's tokeninfo endpoint for verification
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!response.ok) return null;

        const payload = await response.json();

        // Verify the token is for our app
        if (payload.aud !== GOOGLE_CLIENT_ID) {
            console.warn('Token audience mismatch');
            return null;
        }

        return {
            googleId: payload.sub,
            email: payload.email,
            name: payload.name,
            picture: payload.picture
        };
    } catch (e) {
        console.error('Google token verification failed:', e.message);
        return null;
    }
}

// --- 5. PAYPAL SETUP ---
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_PLAN_ID = process.env.PAYPAL_PLAN_ID;
const PAYPAL_API = 'https://api-m.paypal.com'; // Live API

// Get PayPal Access Token
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    return data.access_token;
}

// PayPal Webhook Handler
app.post('/api/webhook/paypal', async (req, res) => {
    const event = req.body;
    console.log('PayPal Webhook:', event.event_type);

    try {
        // New subscription activated
        if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            const subscription = event.resource;
            const subscriptionId = subscription.id;
            const userId = subscription.custom_id; // We pass userId as custom_id

            if (userId) {
                await pool.query(
                    `UPDATE users SET is_pro = TRUE, paypal_subscription_id = $1 WHERE id = $2`,
                    [subscriptionId, userId]
                );
                console.log(`User ${userId} upgraded to PRO via PayPal`);

                // Send Telegram notification
                telegramService.sendNotification(userId, 'PRO_ACTIVATED', {});
            }
        }
        // Subscription cancelled, expired, or suspended
        else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED' ||
                 event.event_type === 'BILLING.SUBSCRIPTION.EXPIRED' ||
                 event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
            const subscription = event.resource;
            const subscriptionId = subscription.id;

            await pool.query(
                `UPDATE users SET is_pro = FALSE WHERE paypal_subscription_id = $1`,
                [subscriptionId]
            );
            console.log(`⚠️ Subscription ${subscriptionId} cancelled/expired/suspended`);
        }
        // Payment completed (for renewals)
        else if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
            const sale = event.resource;
            const subscriptionId = sale.billing_agreement_id;

            if (subscriptionId) {
                // Ensure user stays PRO on successful renewal payment
                await pool.query(
                    `UPDATE users SET is_pro = TRUE WHERE paypal_subscription_id = $1`,
                    [subscriptionId]
                );
                console.log(`✅ Renewal payment received for subscription ${subscriptionId}`);
            }
        }
    } catch (e) {
        console.error('PayPal Webhook Error:', e.message);
    }

    res.json({ received: true });
});

// Create PayPal Subscription
app.post('/api/create-subscription', async (req, res) => {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
        return res.status(503).json({ error: "PayPal not configured" });
    }

    const { userId } = req.body;
    const clientUrl = req.get('Referer') ? req.get('Referer').replace(/\/$/, "") : 'https://fitstream.health';

    try {
        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan_id: PAYPAL_PLAN_ID,
                custom_id: userId,
                application_context: {
                    brand_name: 'FitStream PRO',
                    locale: 'en-US',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    return_url: `${clientUrl}?pro_status=success`,
                    cancel_url: `${clientUrl}?canceled=true`
                }
            })
        });

        const subscription = await response.json();

        if (subscription.error) {
            console.error('PayPal Error:', subscription);
            return res.status(500).json({ error: subscription.error_description || 'PayPal error' });
        }

        // Find approval link
        const approvalLink = subscription.links?.find(l => l.rel === 'approve')?.href;

        if (!approvalLink) {
            return res.status(500).json({ error: 'No approval link returned' });
        }

        res.json({ url: approvalLink, subscriptionId: subscription.id });
    } catch (e) {
        console.error("PayPal Subscription Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Verify PayPal Subscription (called after user returns)
app.post('/api/verify-subscription', async (req, res) => {
    const { subscriptionId, userId } = req.body;

    try {
        const accessToken = await getPayPalAccessToken();

        const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const subscription = await response.json();

        if (subscription.status === 'ACTIVE') {
            await pool.query(
                `UPDATE users SET is_pro = TRUE, paypal_subscription_id = $1 WHERE id = $2`,
                [subscriptionId, userId]
            );
            res.json({ success: true, isPro: true });
        } else {
            res.json({ success: false, status: subscription.status });
        }
    } catch (e) {
        console.error("Verify Subscription Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Get PayPal Client ID for frontend
app.get('/api/paypal-client-id', (req, res) => {
    res.json({ clientId: PAYPAL_CLIENT_ID });
});


// --- 5. PHONE DATABASE SEED ---
const SEED_PHONES = [
    { name: "Samsung Galaxy S25 Ultra", weight: 233 },
    { name: "Samsung Galaxy S25 Plus", weight: 196 },
    { name: "Samsung Galaxy S25", weight: 168 },
    { name: "Samsung Galaxy S24 Ultra", weight: 232 },
    { name: "iPhone 16 Pro Max", weight: 227 },
    { name: "iPhone 16 Pro", weight: 199 },
    { name: "iPhone 15 Pro Max", weight: 221 },
    { name: "Google Pixel 9 Pro XL", weight: 221 }
];

// Initialize DB Tables
const initDb = async () => {
  if (!connectionString) {
      console.warn("⚠️ No DATABASE_URL provided. Database features will fail.");
      return;
  }
  let client;
  try {
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        is_pro BOOLEAN DEFAULT FALSE,
        paypal_subscription_id VARCHAR(255),
        settings JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Add paypal column if not exists (for existing DBs)
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255);
    `);

    // Migration: Add Telegram columns
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT TRUE;
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);
    `);

    // Migration: Add Google Auth columns
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
    `);
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_logs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id),
        category VARCHAR(50) NOT NULL,
        date VARCHAR(20) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await client.query(`CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);`);

    await client.query(`
        CREATE TABLE IF NOT EXISTS phones (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            weight INTEGER NOT NULL
        );
    `);
    
    // Global Assets Table for Custom Icons
    await client.query(`
        CREATE TABLE IF NOT EXISTS global_assets (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    for (const phone of SEED_PHONES) {
        await client.query(`
            INSERT INTO phones (name, weight) VALUES ($1, $2)
            ON CONFLICT (name) DO NOTHING
        `, [phone.name, phone.weight]);
    }

    // Migration: Add admin and premium columns
    await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);
    await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_until TIMESTAMP;
    `);
    await client.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS can_train_ai BOOLEAN DEFAULT FALSE;
    `);
    await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
    `);

    // Grant admin access to 33pokrov33@gmail.com (10-year premium)
    await client.query(`
        UPDATE users
        SET is_pro = TRUE,
            is_admin = TRUE,
            can_train_ai = TRUE,
            pro_until = CURRENT_TIMESTAMP + INTERVAL '10 years'
        WHERE email = '33pokrov33@gmail.com'
    `);

    // Migration: Reset goals to default (STEPS, CALORIES, WATER enabled) - ONE TIME
    const migrationKey = 'migration_goals_reset_v1';
    const migrationCheck = await client.query(
      'SELECT 1 FROM global_assets WHERE key = $1', [migrationKey]
    );

    if (migrationCheck.rows.length === 0) {
      const defaultGoals = [
        { type: 'STEPS', target: 10000, current: 0, isEnabled: true, unit: 'steps', color: '#10b981' },
        { type: 'CALORIES', target: 2000, current: 0, isEnabled: true, unit: 'kcal', color: '#f97316' },
        { type: 'WATER', target: 2000, current: 0, isEnabled: true, unit: 'ml', color: '#0ea5e9' },
        { type: 'PUSHUPS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: '#3b82f6' },
        { type: 'SQUATS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: '#8b5cf6' },
        { type: 'SITUPS', target: 50, current: 0, isEnabled: false, unit: 'reps', color: '#ec4899' },
        { type: 'JUMPING_JACKS', target: 100, current: 0, isEnabled: false, unit: 'reps', color: '#14b8a6' },
        { type: 'LUNGES', target: 40, current: 0, isEnabled: false, unit: 'reps', color: '#f59e0b' },
        { type: 'BURPEES', target: 20, current: 0, isEnabled: false, unit: 'reps', color: '#ef4444' },
        { type: 'DIPS', target: 30, current: 0, isEnabled: false, unit: 'reps', color: '#6366f1' },
        { type: 'PULLUPS', target: 20, current: 0, isEnabled: false, unit: 'reps', color: '#a855f7' }
      ];

      const result = await client.query(`
          UPDATE users
          SET settings = jsonb_set(
              COALESCE(settings, '{}'::jsonb),
              '{goals}',
              $1::jsonb
          )
      `, [JSON.stringify(defaultGoals)]);

      await client.query(
        'INSERT INTO global_assets (key, value) VALUES ($1, $2)',
        [migrationKey, new Date().toISOString()]
      );

      console.log(`✅ Goals migration applied to ${result.rowCount} users.`);
    }

    console.log("✅ Database initialized successfully.");
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  } finally {
    if (client) client.release();
  }
};

// --- 6. API ENDPOINTS ---

// Google Auth - Verify token and login/register user
app.post('/api/auth/google', async (req, res) => {
    const { idToken, localUserId } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'Missing idToken' });
    }

    try {
        // 1. Verify Google token
        const googleUser = await verifyGoogleToken(idToken);
        if (!googleUser) {
            return res.status(401).json({ error: 'Invalid Google token' });
        }

        const { googleId, email, name, picture } = googleUser;
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 2. Check if user with this Google ID already exists
            const existingGoogle = await client.query(
                'SELECT id, is_pro, is_admin, can_train_ai, pro_until, settings FROM users WHERE google_id = $1',
                [googleId]
            );

            let userId;
            let isPro = false;
            let isAdmin = false;
            let canTrainAi = false;
            let proUntil = null;
            let mergedSettings = null;

            if (existingGoogle.rows.length > 0) {
                // User already registered with Google - return existing account
                const existingUser = existingGoogle.rows[0];
                userId = existingUser.id;
                isPro = existingUser.is_pro;
                isAdmin = existingUser.is_admin || false;
                canTrainAi = existingUser.can_train_ai || false;
                proUntil = existingUser.pro_until;
                mergedSettings = existingUser.settings;

                // If local data exists from anonymous session, merge it
                if (localUserId && localUserId !== userId) {
                    await migrateUserData(client, localUserId, userId);
                }
            } else {
                // New Google user
                if (localUserId) {
                    // Check if local user exists
                    const localUser = await client.query(
                        'SELECT id, is_pro, is_admin, can_train_ai, pro_until, settings FROM users WHERE id = $1',
                        [localUserId]
                    );

                    if (localUser.rows.length > 0) {
                        // Link Google to existing local account
                        userId = localUserId;
                        isPro = localUser.rows[0].is_pro;
                        isAdmin = localUser.rows[0].is_admin || false;
                        canTrainAi = localUser.rows[0].can_train_ai || false;
                        proUntil = localUser.rows[0].pro_until;
                        mergedSettings = localUser.rows[0].settings;

                        await client.query(
                            'UPDATE users SET google_id = $1, email = $2 WHERE id = $3',
                            [googleId, email, userId]
                        );
                    } else {
                        // Create new user with Google ID as primary
                        userId = `google_${googleId}`;
                        await client.query(
                            `INSERT INTO users (id, google_id, email, settings)
                             VALUES ($1, $2, $3, $4)`,
                            [userId, googleId, email, JSON.stringify({ name, avatar: picture, email })]
                        );
                    }
                } else {
                    // No local user - create fresh Google account
                    userId = `google_${googleId}`;
                    await client.query(
                        `INSERT INTO users (id, google_id, email, settings)
                         VALUES ($1, $2, $3, $4)`,
                        [userId, googleId, email, JSON.stringify({ name, avatar: picture, email })]
                    );
                }
            }

            await client.query('COMMIT');

            // 3. Fetch all user data to return
            const userData = await client.query(
                'SELECT settings, is_pro, is_admin, can_train_ai, pro_until FROM users WHERE id = $1',
                [userId]
            );
            const logsData = await client.query(
                'SELECT category, data FROM user_logs WHERE user_id = $1',
                [userId]
            );

            const logs = logsData.rows;

            res.json({
                success: true,
                userId,
                googleId,
                email,
                name,
                picture,
                isPro: userData.rows[0]?.is_pro || false,
                isAdmin: userData.rows[0]?.is_admin || false,
                canTrainAi: userData.rows[0]?.can_train_ai || false,
                proUntil: userData.rows[0]?.pro_until || null,
                settings: userData.rows[0]?.settings || mergedSettings,
                exercises: logs.filter(l => l.category === 'EXERCISE').map(l => l.data),
                weights: logs.filter(l => l.category === 'WEIGHT').map(l => l.data),
                nutrition: logs.filter(l => l.category === 'NUTRITION').map(l => l.data)
            });

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Google Auth Error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Helper: Migrate user data from old ID to new ID
async function migrateUserData(client, fromUserId, toUserId) {
    console.log(`📦 Migrating data from ${fromUserId} to ${toUserId}`);

    // Move all logs to new user
    await client.query(
        'UPDATE user_logs SET user_id = $1 WHERE user_id = $2',
        [toUserId, fromUserId]
    );

    // Merge Pro status (if old user was Pro, keep it)
    await client.query(`
        UPDATE users SET is_pro = TRUE
        WHERE id = $1
        AND EXISTS (SELECT 1 FROM users WHERE id = $2 AND is_pro = TRUE)
    `, [toUserId, fromUserId]);

    // Optionally delete old anonymous user (or keep for audit)
    // await client.query('DELETE FROM users WHERE id = $1', [fromUserId]);

    console.log(`✅ Migration complete: ${fromUserId} -> ${toUserId}`);
}

// Custom Icons Endpoints
app.get('/api/assets/icons', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT key, value FROM global_assets WHERE key LIKE \'ICON_%\'');
            const icons = {};
            result.rows.forEach(row => {
                const type = row.key.replace('ICON_', '');
                icons[type] = row.value;
            });
            res.json(icons);
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Fetch Icons Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/assets/icons', async (req, res) => {
    const { type, image } = req.body; // type = 'STEPS', image = base64
    if (!type || !image) return res.status(400).json({ error: 'Missing type or image' });
    
    try {
        const key = `ICON_${type}`;
        await pool.query(`
            INSERT INTO global_assets (key, value, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (key) DO UPDATE
            SET value = $2, updated_at = CURRENT_TIMESTAMP
        `, [key, image]);
        res.json({ success: true });
    } catch (e) {
        console.error("Upload Icon Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});


app.get('/api/phones', async (req, res) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT name, weight FROM phones ORDER BY name ASC');
            res.json(result.rows);
        } finally {
            client.release();
        }
    } catch (e) {
        // Fallback to seed data if DB fails
        res.json(SEED_PHONES);
    }
});

app.get('/api/data/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const client = await pool.connect();
        try {
            const userRes = await client.query(
                'SELECT settings, is_pro, is_admin, can_train_ai, pro_until FROM users WHERE id = $1',
                [userId]
            );
            const logsRes = await client.query('SELECT * FROM user_logs WHERE user_id = $1', [userId]);

            const user = userRes.rows[0] || { settings: null, is_pro: false, is_admin: false, can_train_ai: false, pro_until: null };
            const logs = logsRes.rows;

            res.json({
                settings: user.settings,
                isPro: user.is_pro,
                isAdmin: user.is_admin || false,
                canTrainAi: user.can_train_ai || false,
                proUntil: user.pro_until || null,
                exercises: logs.filter(l => l.category === 'EXERCISE').map(l => l.data),
                weights: logs.filter(l => l.category === 'WEIGHT').map(l => l.data),
                nutrition: logs.filter(l => l.category === 'NUTRITION').map(l => l.data)
            });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Fetch Data Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/user/sync', async (req, res) => {
    const { userId, settings } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        // Get previous settings to check for streak milestones
        const prevRes = await pool.query('SELECT settings FROM users WHERE id = $1', [userId]);
        const prevSettings = prevRes.rows[0]?.settings;
        const prevStreak = prevSettings?.streak || 0;
        const newStreak = settings?.streak || 0;

        // Simple Upsert
        await pool.query(`
            INSERT INTO users (id, settings, last_synced_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE
            SET settings = $2, last_synced_at = CURRENT_TIMESTAMP
        `, [userId, settings]);

        // Check for streak milestones
        const milestones = [7, 14, 30, 60, 90, 100, 365];
        for (const milestone of milestones) {
            if (newStreak >= milestone && prevStreak < milestone) {
                telegramService.sendNotification(userId, 'STREAK_MILESTONE', {
                    streak: milestone
                });
                break; // Only notify for one milestone at a time
            }
        }

        // Check for goal completions
        if (settings?.goals && prevSettings?.goals) {
            for (const goal of settings.goals) {
                if (!goal.isEnabled) continue;
                const prevGoal = prevSettings.goals.find(g => g.type === goal.type);
                if (prevGoal && goal.current >= goal.target && prevGoal.current < goal.target) {
                    telegramService.sendNotification(userId, 'GOAL_COMPLETED', {
                        goalType: goal.type,
                        current: goal.current,
                        target: goal.target,
                        unit: goal.unit
                    });
                }
            }
        }

        const resPro = await pool.query(
            'SELECT is_pro, is_admin, can_train_ai, pro_until FROM users WHERE id = $1',
            [userId]
        );
        const row = resPro.rows[0] || {};
        return res.json({
            isPro: row.is_pro || false,
            isAdmin: row.is_admin || false,
            canTrainAi: row.can_train_ai || false,
            proUntil: row.pro_until || null
        });
    } catch (err) {
        console.error("Sync Settings Error:", err.message);
        // Return 200 with error flag so frontend doesn't crash, but knows backend is flaky
        res.status(200).json({ isPro: false, isAdmin: false, canTrainAi: false, proUntil: null, error: 'DB_UNAVAILABLE' });
    }
});

app.post('/api/data/log', async (req, res) => {
    const { userId, category, data } = req.body;
    try {
        // Ensure user exists first
        await pool.query(`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);

        await pool.query(`
            INSERT INTO user_logs (id, user_id, category, date, data)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE
            SET data = $5
        `, [data.id, userId, category, data.date, data]);

        // Send Telegram notification for weight logs
        if (category === 'WEIGHT' && data.weight) {
            const userRes = await pool.query(`SELECT settings FROM users WHERE id = $1`, [userId]);
            const settings = userRes.rows[0]?.settings;
            telegramService.sendNotification(userId, 'WEIGHT_LOGGED', {
                weight: data.weight,
                targetWeight: settings?.targetWeight
            });
        }

        res.json({ success: true });
    } catch (e) {
        console.error("Log Data Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/data/bulk', async (req, res) => {
    const { userId, exercises, weights, nutrition } = req.body;
    
    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        
        // Ensure user exists
        await client.query(`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);

        const insertHelper = async (items, category) => {
            for (const item of items) {
                await client.query(`
                    INSERT INTO user_logs (id, user_id, category, date, data)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO NOTHING
                `, [item.id, userId, category, item.date, item]);
            }
        };
        if (exercises?.length) await insertHelper(exercises, 'EXERCISE');
        if (weights?.length) await insertHelper(weights, 'WEIGHT');
        if (nutrition?.length) await insertHelper(nutrition, 'NUTRITION');
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        if (client) await client.query('ROLLBACK');
        console.error("Bulk Push Error:", e.message);
        res.status(500).json({ error: e.message });
    } finally {
        if (client) client.release();
    }
});

// --- TELEGRAM API ENDPOINTS ---

// Telegram Webhook (for production)
app.post('/api/telegram/webhook', (req, res) => {
    try {
        telegramService.processUpdate(req.body);
        res.json({ ok: true });
    } catch (e) {
        console.error('Telegram webhook error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Generate link code for user
app.get('/api/telegram/link-code', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        // Check if already linked
        const result = await pool.query(
            `SELECT telegram_chat_id FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows[0]?.telegram_chat_id) {
            return res.json({
                alreadyLinked: true,
                message: 'Account already linked to Telegram'
            });
        }

        const code = telegramService.generateLinkCode(userId);
        res.json({ code, expiresIn: 600 }); // 10 minutes
    } catch (e) {
        console.error('Link code error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Link Telegram account (called from Mini App)
app.post('/api/telegram/link', async (req, res) => {
    const { userId, chatId, username, initData } = req.body;

    if (!userId || !chatId) {
        return res.status(400).json({ error: 'Missing userId or chatId' });
    }

    try {
        // Verify initData if provided (for security in Mini Apps)
        // In production, you should validate the Telegram Web App initData hash

        const success = await telegramService.linkTelegramAccount(userId, chatId, username);

        if (success) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to link account' });
        }
    } catch (e) {
        console.error('Telegram link error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Unlink Telegram account
app.post('/api/telegram/unlink', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        await pool.query(
            `UPDATE users SET telegram_chat_id = NULL, telegram_username = NULL WHERE id = $1`,
            [userId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Telegram unlink error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get Telegram link status
app.get('/api/telegram/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const result = await pool.query(
            `SELECT telegram_chat_id, telegram_username, telegram_notifications FROM users WHERE id = $1`,
            [userId]
        );

        const user = result.rows[0];
        if (!user) return res.json({ linked: false });

        res.json({
            linked: !!user.telegram_chat_id,
            username: user.telegram_username,
            notificationsEnabled: user.telegram_notifications !== false
        });
    } catch (e) {
        console.error('Telegram status error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Toggle Telegram notifications
app.post('/api/telegram/notifications', async (req, res) => {
    const { userId, enabled } = req.body;
    if (!userId || enabled === undefined) {
        return res.status(400).json({ error: 'Missing userId or enabled' });
    }

    try {
        await pool.query(
            `UPDATE users SET telegram_notifications = $1 WHERE id = $2`,
            [enabled, userId]
        );
        res.json({ success: true });
    } catch (e) {
        console.error('Telegram notifications error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Send notification (internal/admin use)
app.post('/api/telegram/notify', async (req, res) => {
    const { userId, type, data } = req.body;
    if (!userId || !type) {
        return res.status(400).json({ error: 'Missing userId or type' });
    }

    try {
        const success = await telegramService.sendNotification(userId, type, data);
        res.json({ success });
    } catch (e) {
        console.error('Telegram notify error:', e);
        res.status(500).json({ error: e.message });
    }
});

// --- PRODUCT PRICES API ---

// Get all currencies
app.get('/api/prices/currencies', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM currencies ORDER BY code');
        res.json(result.rows);
    } catch (e) {
        console.error('Currencies fetch error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get products by country (with optional category filter)
app.get('/api/prices/:countryCode', async (req, res) => {
    const { countryCode } = req.params;
    const { category, search, limit = 500 } = req.query;

    try {
        let query = `
            SELECT p.*, c.symbol as currency_symbol, c.rate_to_usd
            FROM product_prices p
            JOIN currencies c ON p.currency_code = c.code
            WHERE p.country_code = $1
        `;
        const params = [countryCode.toUpperCase()];

        if (category) {
            query += ` AND p.category = $${params.length + 1}`;
            params.push(category);
        }

        if (search) {
            query += ` AND (p.name ILIKE $${params.length + 1} OR p.name_en ILIKE $${params.length + 1})`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY p.category, p.name LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);
        res.json({
            country: countryCode.toUpperCase(),
            count: result.rows.length,
            products: result.rows
        });
    } catch (e) {
        console.error('Products fetch error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get price stats by country
app.get('/api/prices/:countryCode/stats', async (req, res) => {
    const { countryCode } = req.params;

    try {
        const result = await pool.query(`
            SELECT
                category,
                COUNT(*) as count,
                MIN(price) as min_price,
                MAX(price) as max_price,
                AVG(price)::numeric(10,2) as avg_price
            FROM product_prices
            WHERE country_code = $1
            GROUP BY category
            ORDER BY category
        `, [countryCode.toUpperCase()]);

        const total = await pool.query(`
            SELECT COUNT(*) as total, MAX(updated_at) as last_update
            FROM product_prices WHERE country_code = $1
        `, [countryCode.toUpperCase()]);

        res.json({
            country: countryCode.toUpperCase(),
            totalProducts: parseInt(total.rows[0].total),
            lastUpdate: total.rows[0].last_update,
            byCategory: result.rows
        });
    } catch (e) {
        console.error('Stats fetch error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Search product by name (across all countries)
app.get('/api/prices/search/:query', async (req, res) => {
    const { query } = req.params;
    const { country, limit = 20 } = req.query;

    try {
        let sql = `
            SELECT p.*, c.symbol as currency_symbol
            FROM product_prices p
            JOIN currencies c ON p.currency_code = c.code
            WHERE (p.name ILIKE $1 OR p.name_en ILIKE $1 OR p.name_local ILIKE $1)
        `;
        const params = [`%${query}%`];

        if (country) {
            sql += ` AND p.country_code = $2`;
            params.push(country.toUpperCase());
        }

        sql += ` ORDER BY p.confidence DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (e) {
        console.error('Search error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Force update all currency rates (manual trigger)
app.post('/api/prices/currencies/refresh', async (req, res) => {
    try {
        const success = await currencyService.updateRatesInDb(pool);
        if (success) {
            const result = await pool.query('SELECT * FROM currencies ORDER BY code');
            res.json({ success: true, currencies: result.rows });
        } else {
            res.status(500).json({ error: 'Failed to fetch rates' });
        }
    } catch (e) {
        console.error('Currency refresh error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Update currency rate
app.put('/api/prices/currencies/:code', async (req, res) => {
    const { code } = req.params;
    const { rate_to_usd } = req.body;

    if (!rate_to_usd || rate_to_usd <= 0) {
        return res.status(400).json({ error: 'Invalid rate' });
    }

    try {
        await pool.query(`
            UPDATE currencies SET rate_to_usd = $1, updated_at = CURRENT_TIMESTAMP
            WHERE code = $2
        `, [rate_to_usd, code.toUpperCase()]);
        res.json({ success: true });
    } catch (e) {
        console.error('Currency update error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Bulk update/insert products (for weekly sync)
app.post('/api/prices/sync', async (req, res) => {
    const { products, countryCode, currencyCode } = req.body;

    if (!products || !Array.isArray(products) || !countryCode || !currencyCode) {
        return res.status(400).json({ error: 'Missing products, countryCode or currencyCode' });
    }

    try {
        let inserted = 0;
        let updated = 0;

        for (const p of products) {
            const result = await pool.query(`
                INSERT INTO product_prices
                    (id, name, name_en, name_local, emoji, category, price, currency_code, unit, price_per_unit, country_code, source, store_name, confidence)
                VALUES
                    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (id) DO UPDATE SET
                    price = EXCLUDED.price,
                    price_per_unit = EXCLUDED.price_per_unit,
                    confidence = EXCLUDED.confidence,
                    source = EXCLUDED.source,
                    store_name = EXCLUDED.store_name,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING (xmax = 0) as is_insert
            `, [
                p.id || `${countryCode}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                p.name, p.nameEn || p.name, p.nameLocal, p.emoji || '📦',
                p.category, p.price, currencyCode, p.unit,
                p.pricePerUnit || p.price, countryCode,
                p.source || 'manual', p.storeName, p.confidence || 80
            ]);

            if (result.rows[0].is_insert) inserted++;
            else updated++;
        }

        res.json({ success: true, inserted, updated, total: products.length });
    } catch (e) {
        console.error('Sync error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Sync products from receipt (AI matching + deduplication)
app.post('/api/prices/sync-receipt', async (req, res) => {
    const { items, countryCode, currencyCode, storeName } = req.body;

    if (!items || !Array.isArray(items) || !countryCode || !currencyCode) {
        return res.status(400).json({ error: 'Missing items, countryCode or currencyCode' });
    }

    try {
        const results = [];

        for (const item of items) {
            // Поиск похожего продукта по названию (fuzzy match)
            const searchResult = await pool.query(`
                SELECT id, name, name_en, price, confidence,
                    similarity(LOWER(name), LOWER($1)) as name_sim,
                    similarity(LOWER(name_en), LOWER($1)) as name_en_sim
                FROM product_prices
                WHERE country_code = $2
                    AND (
                        LOWER(name) LIKE $3
                        OR LOWER(name_en) LIKE $3
                        OR similarity(LOWER(name), LOWER($1)) > 0.3
                        OR similarity(LOWER(name_en), LOWER($1)) > 0.3
                    )
                ORDER BY GREATEST(
                    similarity(LOWER(name), LOWER($1)),
                    similarity(LOWER(name_en), LOWER($1))
                ) DESC
                LIMIT 1
            `, [item.name, countryCode.toUpperCase(), `%${item.name.toLowerCase().split(' ')[0]}%`]);

            if (searchResult.rows.length > 0) {
                const match = searchResult.rows[0];
                const similarity = Math.max(match.name_sim || 0, match.name_en_sim || 0);

                // Обновляем цену если совпадение хорошее
                if (similarity > 0.5 || match.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])) {
                    await pool.query(`
                        UPDATE product_prices
                        SET price = $1, price_per_unit = $2, source = 'receipt',
                            store_name = $3, confidence = GREATEST(confidence, 85),
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $4
                    `, [item.price, item.pricePerUnit || item.price, storeName, match.id]);

                    results.push({ name: item.name, action: 'updated', matchedTo: match.name, similarity });
                    continue;
                }
            }

            // Создаём новый продукт
            const newId = `${countryCode.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
            await pool.query(`
                INSERT INTO product_prices
                    (id, name, name_en, emoji, category, price, currency_code, unit, price_per_unit,
                     country_code, source, store_name, confidence)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'receipt', $11, 70)
            `, [
                newId, item.name, item.nameEn || item.name, item.emoji || '📦',
                item.category || 'other', item.price, currencyCode, item.unit || 'шт',
                item.pricePerUnit || item.price, countryCode.toUpperCase(), storeName
            ]);

            results.push({ name: item.name, action: 'created', id: newId });
        }

        res.json({
            success: true,
            processed: items.length,
            created: results.filter(r => r.action === 'created').length,
            updated: results.filter(r => r.action === 'updated').length,
            details: results
        });
    } catch (e) {
        console.error('Sync receipt error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Legacy endpoint - redirects to PayPal
app.post('/api/create-checkout-session', async (req, res) => {
    // Redirect old Stripe calls to PayPal
    const { userId } = req.body;
    const clientUrl = req.get('Referer') ? req.get('Referer').replace(/\/$/, "") : 'https://fitstream.health';

    try {
        const accessToken = await getPayPalAccessToken();
        const response = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan_id: PAYPAL_PLAN_ID,
                custom_id: userId,
                application_context: {
                    brand_name: 'FitStream PRO',
                    locale: 'en-US',
                    shipping_preference: 'NO_SHIPPING',
                    user_action: 'SUBSCRIBE_NOW',
                    return_url: `${clientUrl}?pro_status=success`,
                    cancel_url: `${clientUrl}?canceled=true`
                }
            })
        });

        const subscription = await response.json();
        const approvalLink = subscription.links?.find(l => l.rel === 'approve')?.href;

        if (!approvalLink) {
            return res.status(500).json({ error: 'Payment setup failed' });
        }

        res.json({ url: approvalLink });
    } catch (e) {
        console.error("PayPal Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- 7. RECIPES API ---
const recipeImporter = require('./services/recipeImporter');

// Get recipes with filters
app.get('/api/recipes', async (req, res) => {
    try {
        const {
            search, category, area, healthy, vegetarian, vegan,
            maxCalories, minProtein, maxTime, difficulty,
            limit = 50, offset = 0
        } = req.query;

        let query = `
            SELECT r.*,
                   json_agg(json_build_object(
                       'id', ri.id,
                       'name', ri.name,
                       'name_ru', ri.name_ru,
                       'amount', ri.amount
                   ) ORDER BY ri.sort_order) as ingredients
            FROM recipes r
            LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND (r.name_en ILIKE $${paramIndex} OR r.name_ru ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (category) {
            query += ` AND r.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        if (area) {
            query += ` AND r.area = $${paramIndex}`;
            params.push(area);
            paramIndex++;
        }
        if (healthy === 'true') {
            query += ` AND r.is_healthy = true`;
        }
        if (vegetarian === 'true') {
            query += ` AND r.is_vegetarian = true`;
        }
        if (vegan === 'true') {
            query += ` AND r.is_vegan = true`;
        }
        if (maxCalories) {
            query += ` AND r.calories <= $${paramIndex}`;
            params.push(parseInt(maxCalories));
            paramIndex++;
        }
        if (minProtein) {
            query += ` AND r.protein >= $${paramIndex}`;
            params.push(parseInt(minProtein));
            paramIndex++;
        }
        if (maxTime) {
            query += ` AND r.cooking_time <= $${paramIndex}`;
            params.push(parseInt(maxTime));
            paramIndex++;
        }
        if (difficulty) {
            query += ` AND r.difficulty = $${paramIndex}`;
            params.push(difficulty);
            paramIndex++;
        }

        query += ` GROUP BY r.id ORDER BY r.name_en LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, params);

        // Clean up null ingredients
        const recipes = result.rows.map(r => ({
            ...r,
            ingredients: r.ingredients.filter(i => i.id !== null)
        }));

        res.json(recipes);
    } catch (e) {
        console.error('Recipes error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Get single recipe
app.get('/api/recipes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const recipeResult = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
        if (recipeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        const ingredientsResult = await pool.query(
            'SELECT * FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY sort_order',
            [id]
        );

        res.json({
            ...recipeResult.rows[0],
            ingredients: ingredientsResult.rows
        });
    } catch (e) {
        console.error('Recipe error:', e.message);
        res.status(500).json({ error: e.message });
    }
});

// Get categories
app.get('/api/recipes/meta/categories', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT DISTINCT category FROM recipes WHERE category IS NOT NULL ORDER BY category'
        );
        res.json(result.rows.map(r => r.category));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get random recipes
app.get('/api/recipes/random/:count', async (req, res) => {
    try {
        const count = Math.min(parseInt(req.params.count) || 5, 20);

        const result = await pool.query(`
            SELECT r.*,
                   json_agg(json_build_object(
                       'id', ri.id,
                       'name', ri.name,
                       'name_ru', ri.name_ru,
                       'amount', ri.amount
                   ) ORDER BY ri.sort_order) as ingredients
            FROM recipes r
            LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
            WHERE r.calories IS NOT NULL
            GROUP BY r.id
            ORDER BY RANDOM()
            LIMIT $1
        `, [count]);

        const recipes = result.rows.map(r => ({
            ...r,
            ingredients: r.ingredients.filter(i => i.id !== null)
        }));

        res.json(recipes);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Import recipes from MealDB
app.post('/api/recipes/import/mealdb', async (req, res) => {
    try {
        const result = await recipeImporter.importFromMealDB(pool);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Enrich recipes with AI
app.post('/api/recipes/enrich', async (req, res) => {
    try {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }
        const batchSize = parseInt(req.body.batchSize) || 50;
        const result = await recipeImporter.enrichRecipesWithAI(pool, apiKey, batchSize);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- 8. STARTUP & SHUTDOWN ---
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

const server = app.listen(PORT, HOST, () => {
  console.log(`FitStream Backend running on http://${HOST}:${PORT}`);

  // Non-blocking DB init
  initDb();

  // Initialize Telegram bot
  telegramService.initBot(pool);

  // Initialize currency updater (weekly cron)
  currencyService.initCurrencyUpdater(pool);

  // Set webhook in production
  if (process.env.NODE_ENV === 'production' && process.env.TELEGRAM_WEBHOOK_URL) {
      telegramService.setWebhook(`${process.env.TELEGRAM_WEBHOOK_URL}/api/telegram/webhook`);
  }
});

// Enhance timeout settings for Load Balancers (Railway/AWS)
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('⚠️ Received SIGTERM. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed. Closing DB pool...');
    pool.end(() => {
        console.log('DB pool closed. Exiting.');
        process.exit(0);
    });
  });
});
