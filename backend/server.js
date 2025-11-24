
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

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

// --- 4. STRIPE WEBHOOK ---
// Safe initialization for Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
    try {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    } catch (e) {
        console.warn("⚠️ Stripe failed to initialize:", e.message);
    }
}

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
        // Simple Upsert
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
        console.error("Stripe Session Error:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// --- 7. STARTUP & SHUTDOWN ---
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 FitStream Backend running on http://${HOST}:${PORT}`);
  
  // Non-blocking DB init
  initDb();
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
