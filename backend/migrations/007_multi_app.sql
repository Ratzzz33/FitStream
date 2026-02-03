-- Migration: 007_multi_app.sql
-- Multi-app support: track which standalone app generated each action

-- Add app_source column to usage_log to track which app generated usage
ALTER TABLE usage_log ADD COLUMN IF NOT EXISTS app_source VARCHAR(50) DEFAULT 'fitstream';

-- Add app_source to transactions for revenue attribution
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS app_source VARCHAR(50) DEFAULT 'fitstream';

-- Index for per-app usage queries
CREATE INDEX IF NOT EXISTS idx_usage_log_app_source ON usage_log(app_source);
CREATE INDEX IF NOT EXISTS idx_usage_log_app_source_created ON usage_log(app_source, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_app_source ON transactions(app_source);
