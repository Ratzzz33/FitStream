-- Recipe tables for FitStream
-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    category VARCHAR(100),
    area VARCHAR(100),
    instructions TEXT,
    instructions_ru TEXT,
    tips TEXT,
    tips_ru TEXT,
    image_url TEXT,
    video_url TEXT,
    source_url TEXT,
    calories INTEGER,
    protein DECIMAL(6,2),
    fat DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fiber DECIMAL(6,2),
    cooking_time INTEGER,
    prep_time INTEGER,
    servings INTEGER DEFAULT 4,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    is_healthy BOOLEAN DEFAULT false,
    is_vegetarian BOOLEAN DEFAULT false,
    is_vegan BOOLEAN DEFAULT false,
    is_gluten_free BOOLEAN DEFAULT false,
    is_dairy_free BOOLEAN DEFAULT false,
    mealdb_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    translated_at TIMESTAMP,
    enriched_at TIMESTAMP
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255),
    amount VARCHAR(100),
    unit VARCHAR(50),
    sort_order INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_name_en_trgm ON recipes USING gin (name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recipes_name_ru_trgm ON recipes USING gin (name_ru gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes(calories);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
