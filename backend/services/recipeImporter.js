/**
 * Recipe Importer Service
 */
const { GoogleGenAI } = require('@google/genai');

async function importFromMealDB(pool) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let imported = 0, skipped = 0;

    for (const letter of alphabet) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
            const data = await response.json();
            if (!data.meals) continue;

            for (const meal of data.meals) {
                const existing = await pool.query('SELECT id FROM recipes WHERE mealdb_id = $1', [meal.idMeal]);
                if (existing.rows.length > 0) { skipped++; continue; }

                const result = await pool.query(`
                    INSERT INTO recipes (name_en, category, area, instructions, image_url, video_url, source_url, mealdb_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
                `, [meal.strMeal, meal.strCategory, meal.strArea, meal.strInstructions, meal.strMealThumb, meal.strYoutube, meal.strSource, meal.idMeal]);

                const recipeId = result.rows[0].id;
                for (let i = 1; i <= 20; i++) {
                    const ingredient = meal[`strIngredient${i}`];
                    const measure = meal[`strMeasure${i}`];
                    if (ingredient?.trim()) {
                        await pool.query(`INSERT INTO recipe_ingredients (recipe_id, name, amount, sort_order) VALUES ($1, $2, $3, $4)`,
                            [recipeId, ingredient.trim(), measure?.trim() || '', i]);
                    }
                }
                imported++;
            }
        } catch (e) { console.error(`Error importing letter ${letter}:`, e.message); }
    }
    return { imported, skipped };
}

async function enrichRecipesWithAI(pool, apiKey, batchSize = 50) {
    const ai = new GoogleGenAI({ apiKey });
    const result = await pool.query('SELECT id, name_en, instructions FROM recipes WHERE calories IS NULL LIMIT $1', [batchSize]);
    let enriched = 0;

    for (const recipe of result.rows) {
        try {
            const ingResult = await pool.query('SELECT name, amount FROM recipe_ingredients WHERE recipe_id = $1', [recipe.id]);
            const ingredientsList = ingResult.rows.map(i => `${i.amount} ${i.name}`.trim()).join(', ');

            const prompt = `Estimate nutritional info per serving:\nName: ${recipe.name_en}\nIngredients: ${ingredientsList}\n\nRespond ONLY with JSON:\n{"calories": 450, "protein": 25, "fat": 18, "carbs": 45, "fiber": 5, "cooking_time": 30, "difficulty": "medium", "is_healthy": false, "is_vegetarian": false, "tips": "Tip"}`;

            const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt });
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;

            const data = JSON.parse(jsonMatch[0]);
            if (!['easy', 'medium', 'hard'].includes(data.difficulty)) data.difficulty = 'medium';

            await pool.query(`UPDATE recipes SET calories=$2, protein=$3, fat=$4, carbs=$5, fiber=$6, cooking_time=$7, difficulty=$8, is_healthy=$9, is_vegetarian=$10, tips=$11, enriched_at=CURRENT_TIMESTAMP WHERE id=$1`,
                [recipe.id, data.calories, data.protein, data.fat, data.carbs, data.fiber, data.cooking_time, data.difficulty, data.is_healthy || false, data.is_vegetarian || false, data.tips || null]);
            enriched++;
        } catch (e) { console.error(`Error enriching ${recipe.name_en}:`, e.message); }
    }

    const remaining = await pool.query('SELECT COUNT(*) FROM recipes WHERE calories IS NULL');
    return { enriched, remaining: parseInt(remaining.rows[0].count) };
}

module.exports = { importFromMealDB, enrichRecipesWithAI };
