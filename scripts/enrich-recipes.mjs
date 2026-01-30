/**
 * Recipe Enrichment Script
 * Run: node scripts/enrich-recipes.mjs [batchSize]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, '..');
const { Client } = pg;

function loadEnv(filePath) {
    if (fs.existsSync(filePath)) {
        fs.readFileSync(filePath, 'utf8').split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match && !process.env[match[1].trim()]) process.env[match[1].trim()] = match[2].trim();
        });
    }
}

loadEnv(path.join(projectDir, '.env'));
loadEnv(path.join(projectDir, 'backend', '.env'));

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
const client = new Client({
    host: 'fitstream-db.c1i8y8aqsodx.eu-central-1.rds.amazonaws.com',
    port: 5432, database: 'postgres', user: 'fitstream_admin',
    password: process.env.DB_PASSWORD || 'FitStream2024Secure!',
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const batchSize = parseInt(process.argv[2]) || 50;
    if (!apiKey) { console.error('Error: API key not set'); process.exit(1); }

    console.log('API Key found:', apiKey.substring(0, 10) + '...');
    await client.connect();
    console.log('Connected to database');

    const countResult = await client.query('SELECT COUNT(*) FROM recipes WHERE calories IS NULL');
    console.log('Recipes needing enrichment:', countResult.rows[0].count);

    const result = await client.query('SELECT id, name_en, instructions FROM recipes WHERE calories IS NULL LIMIT $1', [batchSize]);
    console.log('Found', result.rows.length, 'recipes to enrich');

    const ai = new GoogleGenAI({ apiKey });
    let enriched = 0;

    for (const recipe of result.rows) {
        try {
            const ingResult = await client.query('SELECT name, amount FROM recipe_ingredients WHERE recipe_id = $1', [recipe.id]);
            const ingredientsList = ingResult.rows.map(i => `${i.amount || ''} ${i.name}`.trim()).join(', ');

            console.log('Enriching:', recipe.name_en);
            const prompt = `Estimate nutritional info per serving:\nName: ${recipe.name_en}\nIngredients: ${ingredientsList}\n\nRespond ONLY with JSON:\n{"calories": 450, "protein": 25, "fat": 18, "carbs": 45, "fiber": 5, "cooking_time": 30, "difficulty": "medium", "is_healthy": false, "tips": "Tip"}`;

            const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;

            const data = JSON.parse(jsonMatch[0]);
            if (!['easy', 'medium', 'hard'].includes(data.difficulty)) data.difficulty = 'medium';

            await client.query(`UPDATE recipes SET calories=$2, protein=$3, fat=$4, carbs=$5, fiber=$6, cooking_time=$7, difficulty=$8, is_healthy=$9, tips=$10, enriched_at=CURRENT_TIMESTAMP WHERE id=$1`,
                [recipe.id, data.calories, data.protein, data.fat, data.carbs, data.fiber, data.cooking_time, data.difficulty, data.is_healthy || false, data.tips || null]);

            enriched++;
            console.log('  ✓', data.calories, 'kcal,', data.protein, 'g protein');
            await new Promise(r => setTimeout(r, 300));
        } catch (e) { console.error('  ✗ Error:', e.message); }
    }

    console.log('\\nEnriched', enriched, 'recipes');
    const remaining = await client.query('SELECT COUNT(*) FROM recipes WHERE calories IS NULL');
    console.log('Remaining:', remaining.rows[0].count);
    await client.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
