const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
// Safe initialization for Stripe to prevent crashes if key is missing in dev
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

const app = express();

// Use the provided NeonDB URL default if not in env
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_eqchV27HUSrT@ep-fancy-sun-a414ssfe-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
  connectionString,
});

// Middleware - Allow all origins for easier dev/preview
app.use(cors({ origin: '*' }));

// Webhook needs raw body
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

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerId = session.customer;

    if (userId) {
        try {
            // Ensure table exists or fail gracefully
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

app.use(express.json());

// --- API Routes ---

// 1. Initialize/Sync User
app.post('/api/user/sync', async (req, res) => {
    const { userId, settings } = req.body;
    
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    try {
        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            // Create new user
            await pool.query(
                'INSERT INTO users (id, settings) VALUES ($1, $2)',
                [userId, settings]
            );
            return res.json({ isPro: false });
        } else {
            // Return existing status
            const user = userResult.rows[0];
            return res.json({ isPro: user.is_pro });
        }
    } catch (err) {
        console.error("Sync Error:", err.message);
        res.status(500).json({ error: 'Database error' });
    }
});

// 2. Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

    const { userId } = req.body;
    // Use Referer header or default fallback for redirect URL
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
                            images: ['https://cdn-icons-png.flaticon.com/512/3112/3112946.png'], // Placeholder
                        },
                        unit_amount: 499, // $4.99
                        recurring: {
                            interval: 'month',
                        },
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
  console.log(`Server running on port ${PORT}`);
});