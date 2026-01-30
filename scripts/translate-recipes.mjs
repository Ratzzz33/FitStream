/**
 * Recipe Translation Script (ES Module)
 * Run: node scripts/translate-recipes.mjs [batchSize]
 * Translates recipe names, instructions, tips and ingredients to Russian
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, '..');
const { Client } = pg;

// Load environment
function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match && !process.env[match[1].trim()]) {
                process.env[match[1].trim()] = match[2].trim();
            }
        });
    }
}

loadEnv(path.join(projectDir, '.env'));
loadEnv(path.join(projectDir, 'backend', '.env'));

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;

const client = new Client({
    host: 'fitstream-db.c1i8y8aqsodx.eu-central-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'fitstream_admin',
    password: process.env.DB_PASSWORD || 'FitStream2024Secure!',
    ssl: { rejectUnauthorized: false }
});

async function translateRecipe(recipe, ingredients) {
    const ai = new GoogleGenAI({ apiKey });

    const ingredientsList = ingredients.map(i => i.name).join(', ');

    const prompt = `Translate this recipe from English to Russian. Keep cooking terminology accurate.

Recipe name: ${recipe.name_en}
Instructions: ${recipe.instructions || 'N/A'}
Tips: ${recipe.tips || 'N/A'}
Ingredients: ${ingredientsList}

Respond ONLY with valid JSON (no markdown):
{
    "name_ru": "Название блюда на русском",
    "instructions_ru": "Пошаговая инструкция на русском (если была)",
    "tips_ru": "Совет на русском (если был)",
    "ingredients_ru": ["ингредиент 1", "ингредиент 2", ...]
}

Important:
- Translate dish name naturally (e.g. "Chicken Tikka Masala" → "Курица тикка масала")
- Keep instructions clear and step-by-step
- Translate ingredient names accurately for cooking`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON in response');
    }

    return JSON.parse(jsonMatch[0]);
}

async function main() {
    const batchSize = parseInt(process.argv[2]) || 20;

    if (!apiKey) {
        console.error('Error: API_KEY or GEMINI_API_KEY not set');
        process.exit(1);
    }

    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    console.log('Starting translation with batch size:', batchSize);

    await client.connect();
    console.log('Connected to database');

    // Check how many need translation
    const countResult = await client.query('SELECT COUNT(*) FROM recipes WHERE name_ru IS NULL');
    const needTranslation = parseInt(countResult.rows[0].count);
    console.log('Recipes needing translation:', needTranslation);

    if (needTranslation === 0) {
        console.log('All recipes are already translated!');
        await client.end();
        return;
    }

    // Get recipes without translation
    const result = await client.query(`
        SELECT r.id, r.name_en, r.instructions, r.tips
        FROM recipes r
        WHERE r.name_ru IS NULL
        LIMIT $1
    `, [batchSize]);

    const recipes = result.rows;
    console.log('Found', recipes.length, 'recipes to translate');

    let translated = 0;

    for (const recipe of recipes) {
        try {
            // Get ingredients
            const ingResult = await client.query(`
                SELECT id, name FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY sort_order
            `, [recipe.id]);
            const ingredients = ingResult.rows;

            console.log('Translating:', recipe.name_en);
            const data = await translateRecipe(recipe, ingredients);

            // Update recipe
            await client.query(`
                UPDATE recipes SET
                    name_ru = $2,
                    instructions_ru = $3,
                    tips_ru = $4,
                    translated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [
                recipe.id,
                data.name_ru,
                data.instructions_ru || null,
                data.tips_ru || null
            ]);

            // Update ingredients
            if (data.ingredients_ru && Array.isArray(data.ingredients_ru)) {
                for (let i = 0; i < Math.min(ingredients.length, data.ingredients_ru.length); i++) {
                    await client.query(`
                        UPDATE recipe_ingredients SET name_ru = $2 WHERE id = $1
                    `, [ingredients[i].id, data.ingredients_ru[i]]);
                }
            }

            translated++;
            console.log('  ✓', data.name_ru);

            await new Promise(r => setTimeout(r, 300));
        } catch (e) {
            console.error('  ✗ Error:', e.message);
        }
    }

    console.log('\nTranslated', translated, 'recipes');
    const remainingResult = await client.query('SELECT COUNT(*) FROM recipes WHERE name_ru IS NULL');
    console.log('Remaining:', remainingResult.rows[0].count);

    await client.end();
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
