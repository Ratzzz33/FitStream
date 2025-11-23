
const express = require('express');
const { Pool } = require('pg');
// Safe initialization for Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const app = express();

// --- 1. ROBUST MANUAL CORS MIDDLEWARE ---
// Explicitly handle CORS to prevent browser blocking.
app.use((req, res, next) => {
  // Allow any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Allow all standard methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');

  // Dynamically allow whatever headers the client is asking for
  // This prevents issues where specific browser extensions or headers block the request
  const requestHeaders = req.headers['access-control-request-headers'];
  if (requestHeaders) {
    res.setHeader('Access-Control-Allow-Headers', requestHeaders);
  } else {
    // Fallback defaults
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, stripe-signature, Accept, Origin, Cache-Control, Pragma');
  }

  // Cache preflight response for 24 hours to reduce OPTIONS requests
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle Preflight (OPTIONS) immediately
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
  max: 4, // Reduce max connections for free tier stability
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// CRITICAL: Prevent crash on idle client error
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client (DB Connection Lost)', err);
  // Do not exit process; let the pool reconnect
});

// --- 4. ROUTES ---

// Health Check
app.get('/', (req, res) => {
    // Prevent caching of health check to ensure diagnostics are real-time
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.status(200).json({ 
        status: 'online', 
        message: 'FitStream Backend Ready',
        timestamp: new Date().toISOString() 
    });
});

// Stripe Webhook (MUST be before express.json() because it needs raw body)
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

// --- GLOBAL BODY PARSERS ---
app.use(express.json());

// Initialize DB Table
const initDb = async () => {
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
        console.log("✅ Database initialized: 'users' table ready.");
    } finally {
        client.release();
    }
  } catch (err) {
    console.error("❌ Error initializing database:", err.message);
  }
};

// Sync User
app.post('/api/user/sync', async (req, res) => {
    const { userId, settings } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            await pool.query('INSERT INTO users (id, settings) VALUES ($1, $2)', [userId, settings]);
            return res.json({ isPro: false });
        } else {
            const user = userResult.rows[0];
            await pool.query('UPDATE users SET settings = $1, last_synced_at = CURRENT_TIMESTAMP WHERE id = $2', [settings, userId]);
            return res.json({ isPro: user.is_pro });
        }
    } catch (err) {
        console.error("Sync Error:", err.message);
        // Fallback response so frontend doesn't crash
        res.status(200).json({ isPro: false, error: 'DB_UNAVAILABLE' });
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
