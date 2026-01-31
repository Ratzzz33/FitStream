-- Migration: Admin users and premium expiration
-- Adds admin access, AI training permissions, and premium expiration date

-- Add admin and premium columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_train_ai BOOLEAN DEFAULT FALSE;

-- Index for admin users (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Grant admin access to 33pokrov33@gmail.com with 10-year premium
UPDATE users
SET is_pro = TRUE,
    is_admin = TRUE,
    can_train_ai = TRUE,
    pro_until = CURRENT_TIMESTAMP + INTERVAL '10 years'
WHERE email = '33pokrov33@gmail.com';
