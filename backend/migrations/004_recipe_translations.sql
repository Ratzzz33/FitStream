-- Add translation fields to recipes (if not exists)
-- These columns were added as part of the translation feature

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS instructions_ru TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tips_ru TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS translated_at TIMESTAMP;

-- Index for Russian name search
CREATE INDEX IF NOT EXISTS idx_recipes_name_ru_trgm ON recipes USING gin (name_ru gin_trgm_ops);

-- Translation for ingredients
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS name_ru VARCHAR(255);
