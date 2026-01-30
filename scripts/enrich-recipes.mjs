/**
 * Recipe Enrichment Script (ES Module)
 * Run: node scripts/enrich-recipes.mjs [batchSize]
 * Adds nutritional data to recipes using Gemini AI
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

async function estimateNutrition(recipe, ingredients) {
    const ai = new GoogleGenAI({ apiKey });

    const ingredientsList = ingredients
        .map(i => `${i.amount || ''} ${i.name}`.trim())
        .join(', ');

    const prompt = `Estimate nutritional info per serving for this recipe:

Name: ${recipe.name_en}
Ingredients: ${ingredientsList}
Instructions: ${recipe.instructions || 'N/A'}

Respond ONLY with valid JSON (no markdown):
{
    "calories": 450,
    "protein": 25,
    "fat": 18,
    "carbs": 45,
    "fiber": 5,
    "cooking_time": 30,
    "prep_time": 15,
    "servings": 4,
    "difficulty": "medium",
    "is_healthy": false,
    "is_vegetarian": false,
    "is_vegan": false,
    "tips": "Tip for cooking"
}

Notes:
- difficulty must be "easy", "medium", or "hard"
- calories, protein, fat, carbs, fiber are per serving
- cooking_time and prep_time in minutes`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('No JSON in response');
    }

    const data = JSON.parse(jsonMatch[0]);

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(data.difficulty)) {
        data.difficulty = 'medium';
    }

    return data;
}

async function main() {
    const batchSize = parseInt(process.argv[2]) || 50;

    if (!apiKey) {
        console.error('Error: API_KEY or GEMINI_API_KEY not set');
        process.exit(1);
    }

    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    console.log('Starting AI enrichment with batch size:', batchSize);

    await client.connect();
    console.log('Connected to database');

    // Check how many need enrichment
    const countResult = await client.query('SELECT COUNT(*) FROM recipes WHERE calories IS NULL');
    const needEnrichment = parseInt(countResult.rows[0].count);
    console.log('Recipes needing enrichment:', needEnrichment);

    if (needEnrichment === 0) {
        console.log('All recipes are already enriched!');
        await client.end();
        return;
    }

    // Get recipes without nutritional data
    const result = await client.query(`
        SELECT r.id, r.name_en, r.instructions
        FROM recipes r
        WHERE r.calories IS NULL
        LIMIT $1
    `, [batchSize]);

    const recipes = result.rows;
    console.log('Found', recipes.length, 'recipes to enrich');

    let enriched = 0;

    for (const recipe of recipes) {
        try {
            // Get ingredients
            const ingResult = await client.query(`
                SELECT name, amount FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY sort_order
            `, [recipe.id]);
            const ingredients = ingResult.rows;

            console.log('Enriching:', recipe.name_en);
            const data = await estimateNutrition(recipe, ingredients);

            // Update recipe
            await client.query(`
                UPDATE recipes SET
                    calories = $2,
                    protein = $3,
                    fat = $4,
                    carbs = $5,
                    fiber = $6,
                    cooking_time = $7,
                    prep_time = $8,
                    servings = $9,
                    difficulty = $10,
                    is_healthy = $11,
                    is_vegetarian = $12,
                    is_vegan = $13,
                    tips = $14,
                    enriched_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [
                recipe.id,
                data.calories,
                data.protein,
                data.fat,
                data.carbs,
                data.fiber,
                data.cooking_time,
                data.prep_time,
                data.servings,
                data.difficulty,
                data.is_healthy || false,
                data.is_vegetarian || false,
                data.is_vegan || false,
                data.tips || null
            ]);

            enriched++;
            console.log('  ✓', data.calories, 'kcal,', data.protein, 'g protein');

            await new Promise(r => setTimeout(r, 300));
        } catch (e) {
            console.error('  ✗ Error:', e.message);
        }
    }

    console.log('\nEnriched', enriched, 'recipes');
    const remainingResult = await client.query('SELECT COUNT(*) FROM recipes WHERE calories IS NULL');
    console.log('Remaining:', remainingResult.rows[0].count);

    await client.end();
}

main().catch(e => {
    console.error('Fatal:', e);
    process.exit(1);
});
