-- Admin users and premium subscription management
-- Add admin and premium expiry columns

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_train_ai BOOLEAN DEFAULT FALSE;

-- Create index for admin users
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Grant admin access and 10-year premium to 33pokrov33@gmail.com
-- This will insert or update the user
INSERT INTO users (id, email, is_pro, is_admin, can_train_ai, pro_until, settings)
VALUES (
    'admin_33pokrov33',
    '33pokrov33@gmail.com',
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP + INTERVAL '10 years',
    '{"name": "Admin", "role": "admin"}'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
    is_pro = TRUE,
    is_admin = TRUE,
    can_train_ai = TRUE,
    pro_until = CURRENT_TIMESTAMP + INTERVAL '10 years';

-- Also update by email if user exists with different id (e.g., google auth)
UPDATE users
SET is_pro = TRUE,
    is_admin = TRUE,
    can_train_ai = TRUE,
    pro_until = CURRENT_TIMESTAMP + INTERVAL '10 years'
WHERE email = '33pokrov33@gmail.com';

-- Comment explaining admin permissions:
-- is_admin = TRUE: Full admin access to system
-- can_train_ai = TRUE: Can submit training data for workout AI (new angles, form corrections)
-- pro_until: Premium subscription expiry (set to 10 years from now)
-- is_pro = TRUE: Has active premium subscription
