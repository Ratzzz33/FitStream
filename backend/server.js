
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const telegramService = require('./services/telegramService');

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
                'SELECT id, is_pro, settings FROM users WHERE google_id = $1',
                [googleId]
            );

            let userId;
            let isPro = false;
            let mergedSettings = null;

            if (existingGoogle.rows.length > 0) {
                // User already registered with Google - return existing account
                const existingUser = existingGoogle.rows[0];
                userId = existingUser.id;
                isPro = existingUser.is_pro;
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
                        'SELECT id, is_pro, settings FROM users WHERE id = $1',
                        [localUserId]
                    );

                    if (localUser.rows.length > 0) {
                        // Link Google to existing local account
                        userId = localUserId;
                        isPro = localUser.rows[0].is_pro;
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
                'SELECT settings, is_pro FROM users WHERE id = $1',
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
            const userRes = await client.query('SELECT settings, is_pro FROM users WHERE id = $1', [userId]);
            const logsRes = await client.query('SELECT * FROM user_logs WHERE user_id = $1', [userId]);
            
            const user = userRes.rows[0] || { settings: null, is_pro: false };
            const logs = logsRes.rows;

            res.json({
                settings: user.settings,
                isPro: user.is_pro,
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

        const resPro = await pool.query('SELECT is_pro FROM users WHERE id = $1', [userId]);
        return res.json({ isPro: resPro.rows[0]?.is_pro || false });
    } catch (err) {
        console.error("Sync Settings Error:", err.message);
        // Return 200 with error flag so frontend doesn't crash, but knows backend is flaky
        res.status(200).json({ isPro: false, error: 'DB_UNAVAILABLE' });
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

// --- 7. STARTUP & SHUTDOWN ---
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

const server = app.listen(PORT, HOST, () => {
  console.log(`FitStream Backend running on http://${HOST}:${PORT}`);

  // Non-blocking DB init
  initDb();

  // Initialize Telegram bot
  telegramService.initBot(pool);

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
