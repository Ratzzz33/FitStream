
const express = require('express');
const { Pool } = require('pg');
// Safe initialization for Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const app = express();

// --- 1. ROBUST MANUAL CORS MIDDLEWARE ---
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  const requestHeaders = req.headers['access-control-request-headers'];
  if (requestHeaders) {
    res.setHeader('Access-Control-Allow-Headers', requestHeaders);
  } else {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, stripe-signature, Accept, Origin, Cache-Control, Pragma');
  }
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// --- 2. LOGGING ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// --- 3. DATABASE SETUP ---
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eqchV27HUSrT@ep-fancy-sun-a414ssfe-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client (DB Connection Lost)', err);
});

// --- 4. ROUTES ---

// Health Check
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(200).json({ 
        status: 'online', 
        message: 'FitStream Backend Ready v2 (Full Sync)',
        timestamp: new Date().toISOString() 
    });
});

// Stripe Webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(500).send("Stripe not configured");
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerId = session.customer;

    if (userId) {
        try {
            await pool.query(
                `UPDATE users SET is_pro = TRUE, stripe_customer_id = $1 WHERE id = $2`,
                [customerId, userId]
            );
            console.log(`User ${userId} upgraded to PRO via Stripe`);
        } catch (e) {
            console.error('Database update failed', e);
        }
    }
  }

  res.json({received: true});
});

app.use(express.json({ limit: '10mb' }));

// Initialize DB Tables
const initDb = async () => {
  try {
    const client = await pool.connect();
    try {
        // Users table for Settings & Profile
        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            is_pro BOOLEAN DEFAULT FALSE,
            stripe_customer_id VARCHAR(255),
            settings JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Consolidated Logs table for Exercises, Weight, Nutrition
        // Category: 'EXERCISE', 'WEIGHT', 'NUTRITION'
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
        
        // Index for faster retrieval by user
        await client.query(`CREATE INDEX IF NOT EXISTS idx_user_logs_user_id ON user_logs(user_id);`);

        console.log("✅ Database initialized: 'users' and 'user_logs' tables ready.");
    } finally {
        client.release();
    }
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
};

// --- API ENDPOINTS ---

// 1. GET FULL DATA (Restore/Sync)
app.get('/api/data/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const client = await pool.connect();
        try {
            // Get User Settings
            const userRes = await client.query('SELECT settings, is_pro FROM users WHERE id = $1', [userId]);
            
            // Get All Logs
            const logsRes = await client.query('SELECT * FROM user_logs WHERE user_id = $1', [userId]);
            
            const user = userRes.rows[0] || { settings: null, is_pro: false };
            const logs = logsRes.rows;

            // Group logs
            const exercises = logs.filter(l => l.category === 'EXERCISE').map(l => l.data);
            const weights = logs.filter(l => l.category === 'WEIGHT').map(l => l.data);
            const nutrition = logs.filter(l => l.category === 'NUTRITION').map(l => l.data);

            res.json({
                settings: user.settings,
                isPro: user.is_pro,
                exercises,
                weights,
                nutrition
            });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 2. SAVE SETTINGS (Sync Settings only)
app.post('/api/user/sync', async (req, res) => {
    const { userId, settings } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        // Upsert User
        await pool.query(`
            INSERT INTO users (id, settings, last_synced_at) 
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE 
            SET settings = $2, last_synced_at = CURRENT_TIMESTAMP
        `, [userId, settings]);
        
        // Return Pro Status for confirmation
        const resPro = await pool.query('SELECT is_pro FROM users WHERE id = $1', [userId]);
        return res.json({ isPro: resPro.rows[0]?.is_pro || false });
    } catch (err) {
        console.error("Sync Settings Error:", err.message);
        res.status(200).json({ isPro: false, error: 'DB_UNAVAILABLE' });
    }
});

// 3. PUSH LOG (Save single Exercise/Weight/Nutrition item)
app.post('/api/data/log', async (req, res) => {
    const { userId, category, data } = req.body; 
    // data must have an 'id' field
    if (!userId || !category || !data || !data.id) return res.status(400).json({ error: "Invalid payload" });

    try {
        // Ensure user exists first
        await pool.query(`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);

        await pool.query(`
            INSERT INTO user_logs (id, user_id, category, date, data)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE
            SET data = $5
        `, [data.id, userId, category, data.date, data]);

        res.json({ success: true });
    } catch (e) {
        console.error("Save Log Error", e);
        res.status(500).json({ error: e.message });
    }
});

// 4. BULK SYNC (Push arrays of data - for initial migration or offline sync)
app.post('/api/data/bulk', async (req, res) => {
    const { userId, exercises, weights, nutrition } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Helper to insert
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
        await client.query('ROLLBACK');
        console.error("Bulk Sync Error", e);
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

    const { userId } = req.body;
    const clientUrl = req.get('Referer') ? req.get('Referer').replace(/\/$/, "") : (process.env.CLIENT_URL || 'http://localhost:3000');

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'FitStream PRO',
                            description: 'Unlimited AI workouts, history & smart analytics',
                        },
                        unit_amount: 499, 
                        recurring: { interval: 'month' },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            client_reference_id: userId,
            success_url: `${clientUrl}?session_id={CHECKOUT_SESSION_ID}&pro_status=success`,
            cancel_url: `${clientUrl}?canceled=true`,
        });
        res.json({ url: session.url });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initDb();
});
