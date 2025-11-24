
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

// Safe initialization for Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const app = express();

// --- 1. SIMPLIFIED CORS ---
// We use the simplest possible configuration to allow ALL origins.
// This fixes the 'Access-Control-Allow-Origin' error by letting the library handle it.
app.use(cors());

// Also explicitly handle OPTIONS pre-flight for all routes just in case
app.options('*', cors());

// --- 2. LOGGING ---
app.use((req, res, next) => {
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
  // Enable SSL for production DBs (like Neon/Railway) usually
  ssl: connectionString && connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
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
        message: 'FitStream Backend Ready (CORS permissive)',
        timestamp: new Date().toISOString() 
    });
});

app.use(express.json({ limit: '10mb' }));

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


// --- PHONE DATABASE SEED ---
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
  try {
    const client = await pool.connect();
    try {
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

        for (const phone of SEED_PHONES) {
            await client.query(`
                INSERT INTO phones (name, weight) VALUES ($1, $2)
                ON CONFLICT (name) DO NOTHING
            `, [phone.name, phone.weight]);
        }
        console.log("✅ Database initialized.");
    } finally {
        client.release();
    }
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
};

// --- API ENDPOINTS ---

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
        console.error(e);
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
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/user/sync', async (req, res) => {
    const { userId, settings } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        await pool.query(`
            INSERT INTO users (id, settings, last_synced_at) 
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE 
            SET settings = $2, last_synced_at = CURRENT_TIMESTAMP
        `, [userId, settings]);
        
        const resPro = await pool.query('SELECT is_pro FROM users WHERE id = $1', [userId]);
        return res.json({ isPro: resPro.rows[0]?.is_pro || false });
    } catch (err) {
        console.error("Sync Settings Error:", err.message);
        res.status(200).json({ isPro: false, error: 'DB_UNAVAILABLE' });
    }
});

app.post('/api/data/log', async (req, res) => {
    const { userId, category, data } = req.body; 
    try {
        await pool.query(`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId]);
        await pool.query(`
            INSERT INTO user_logs (id, user_id, category, date, data)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE
            SET data = $5
        `, [data.id, userId, category, data.date, data]);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/data/bulk', async (req, res) => {
    const { userId, exercises, weights, nutrition } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
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
        res.status(500).json({ error: e.message });
    } finally {
        client.release();
    }
});

app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });
    const { userId } = req.body;
    const clientUrl = req.get('Referer') ? req.get('Referer').replace(/\/$/, "") : 'https://fitstream-ai.web.app';
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'FitStream PRO' },
                    unit_amount: 499, 
                    recurring: { interval: 'month' },
                },
                quantity: 1,
            }],
            mode: 'subscription',
            client_reference_id: userId,
            success_url: `${clientUrl}?session_id={CHECKOUT_SESSION_ID}&pro_status=success`,
            cancel_url: `${clientUrl}?canceled=true`,
        });
        res.json({ url: session.url });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initDb();
});
