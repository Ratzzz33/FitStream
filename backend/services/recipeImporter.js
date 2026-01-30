/**
 * Recipe Importer Service
 * Imports recipes from TheMealDB and enriches with AI
 */

const { GoogleGenAI } = require('@google/genai');

/**
 * Import all recipes from TheMealDB API
 */
async function importFromMealDB(pool) {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let imported = 0;
    let skipped = 0;

    for (const letter of alphabet) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
            const data = await response.json();

            if (!data.meals) continue;

            for (const meal of data.meals) {
                // Check if already exists
                const existing = await pool.query(
                    'SELECT id FROM recipes WHERE mealdb_id = $1',
                    [meal.idMeal]
                );

                if (existing.rows.length > 0) {
                    skipped++;
                    continue;
                }

                // Insert recipe
                const result = await pool.query(`
                    INSERT INTO recipes (
                        name_en, category, area, instructions, image_url,
                        video_url, source_url, mealdb_id
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING id
                `, [
                    meal.strMeal,
                    meal.strCategory,
                    meal.strArea,
                    meal.strInstructions,
                    meal.strMealThumb,
                    meal.strYoutube,
                    meal.strSource,
                    meal.idMeal
                ]);

                const recipeId = result.rows[0].id;

                // Insert ingredients
                for (let i = 1; i <= 20; i++) {
                    const ingredient = meal[`strIngredient${i}`];
                    const measure = meal[`strMeasure${i}`];

                    if (ingredient && ingredient.trim()) {
                        await pool.query(`
                            INSERT INTO recipe_ingredients (recipe_id, name, amount, sort_order)
                            VALUES ($1, $2, $3, $4)
                        `, [recipeId, ingredient.trim(), measure?.trim() || '', i]);
                    }
                }

                imported++;
            }
        } catch (e) {
            console.error(`Error importing letter ${letter}:`, e.message);
        }
    }

    return { imported, skipped };
}

/**
 * Enrich recipes with AI-generated nutritional data
 */
async function enrichRecipesWithAI(pool, apiKey, batchSize = 50) {
    const ai = new GoogleGenAI({ apiKey });

    // Get recipes without nutritional data
    const result = await pool.query(`
        SELECT r.id, r.name_en, r.instructions
        FROM recipes r
        WHERE r.calories IS NULL
        LIMIT $1
    `, [batchSize]);

    const recipes = result.rows;
    let enriched = 0;

    for (const recipe of recipes) {
        try {
            // Get ingredients
            const ingResult = await pool.query(
                'SELECT name, amount FROM recipe_ingredients WHERE recipe_id = $1 ORDER BY sort_order',
                [recipe.id]
            );

            const ingredientsList = ingResult.rows
                .map(i => `${i.amount} ${i.name}`.trim())
                .join(', ');

            const prompt = `Estimate nutritional info per serving for this recipe:

Name: ${recipe.name_en}
Ingredients: ${ingredientsList}

Respond ONLY with valid JSON:
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
    "tips": "Tip for cooking this dish"
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });

            const text = response.text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) continue;

            const data = JSON.parse(jsonMatch[0]);

            // Validate difficulty
            const validDifficulties = ['easy', 'medium', 'hard'];
            if (!validDifficulties.includes(data.difficulty)) {
                data.difficulty = 'medium';
            }

            // Update recipe
            await pool.query(`
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
        } catch (e) {
            console.error(`Error enriching ${recipe.name_en}:`, e.message);
        }
    }

    // Count remaining
    const remaining = await pool.query('SELECT COUNT(*) FROM recipes WHERE calories IS NULL');

    return { enriched, remaining: parseInt(remaining.rows[0].count) };
}

/**
 * Import healthy recipes manually
 */
async function importHealthyRecipes(pool) {
    const healthyRecipes = [
        {
            name_en: 'Oatmeal with berries',
            name_ru: 'Овсянка с ягодами',
            category: 'Breakfast',
            instructions: 'Cook oats with water or milk. Top with fresh berries and honey.',
            calories: 280,
            protein: 8,
            fat: 5,
            carbs: 52,
            fiber: 6,
            cooking_time: 10,
            is_healthy: true,
            ingredients: [
                { name: 'Oats', name_ru: 'Овсяные хлопья', amount: '1 cup' },
                { name: 'Mixed berries', name_ru: 'Смесь ягод', amount: '1/2 cup' },
                { name: 'Honey', name_ru: 'Мёд', amount: '1 tbsp' }
            ]
        },
        {
            name_en: 'Chicken breast with vegetables',
            name_ru: 'Куриная грудка с овощами',
            category: 'Main',
            instructions: 'Grill chicken breast. Steam vegetables. Season with herbs.',
            calories: 350,
            protein: 45,
            fat: 8,
            carbs: 20,
            fiber: 5,
            cooking_time: 25,
            is_healthy: true,
            ingredients: [
                { name: 'Chicken breast', name_ru: 'Куриная грудка', amount: '200g' },
                { name: 'Broccoli', name_ru: 'Брокколи', amount: '100g' },
                { name: 'Carrots', name_ru: 'Морковь', amount: '100g' }
            ]
        },
        {
            name_en: 'Greek salad',
            name_ru: 'Греческий салат',
            category: 'Salad',
            instructions: 'Chop vegetables, add feta and olives. Dress with olive oil.',
            calories: 220,
            protein: 8,
            fat: 18,
            carbs: 12,
            fiber: 3,
            cooking_time: 10,
            is_healthy: true,
            is_vegetarian: true,
            ingredients: [
                { name: 'Cucumber', name_ru: 'Огурец', amount: '1 large' },
                { name: 'Tomatoes', name_ru: 'Помидоры', amount: '2 medium' },
                { name: 'Feta cheese', name_ru: 'Сыр фета', amount: '100g' },
                { name: 'Olives', name_ru: 'Оливки', amount: '50g' }
            ]
        },
        {
            name_en: 'Herb omelette',
            name_ru: 'Омлет с зеленью',
            category: 'Breakfast',
            instructions: 'Beat eggs with herbs. Cook in pan until set.',
            calories: 250,
            protein: 18,
            fat: 18,
            carbs: 2,
            fiber: 0,
            cooking_time: 10,
            is_healthy: true,
            is_vegetarian: true,
            ingredients: [
                { name: 'Eggs', name_ru: 'Яйца', amount: '3' },
                { name: 'Fresh herbs', name_ru: 'Свежая зелень', amount: '2 tbsp' },
                { name: 'Butter', name_ru: 'Сливочное масло', amount: '1 tsp' }
            ]
        },
        {
            name_en: 'Steamed salmon with lemon',
            name_ru: 'Лосось на пару с лимоном',
            category: 'Main',
            instructions: 'Steam salmon fillet. Serve with lemon and dill.',
            calories: 320,
            protein: 35,
            fat: 18,
            carbs: 2,
            fiber: 0,
            cooking_time: 15,
            is_healthy: true,
            ingredients: [
                { name: 'Salmon fillet', name_ru: 'Филе лосося', amount: '200g' },
                { name: 'Lemon', name_ru: 'Лимон', amount: '1/2' },
                { name: 'Dill', name_ru: 'Укроп', amount: '2 tbsp' }
            ]
        }
    ];

    let imported = 0;

    for (const recipe of healthyRecipes) {
        const existing = await pool.query(
            'SELECT id FROM recipes WHERE name_en = $1',
            [recipe.name_en]
        );

        if (existing.rows.length > 0) continue;

        const result = await pool.query(`
            INSERT INTO recipes (
                name_en, name_ru, category, instructions,
                calories, protein, fat, carbs, fiber,
                cooking_time, is_healthy, is_vegetarian, difficulty, servings
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'easy', 1)
            RETURNING id
        `, [
            recipe.name_en,
            recipe.name_ru,
            recipe.category,
            recipe.instructions,
            recipe.calories,
            recipe.protein,
            recipe.fat,
            recipe.carbs,
            recipe.fiber,
            recipe.cooking_time,
            recipe.is_healthy,
            recipe.is_vegetarian || false
        ]);

        const recipeId = result.rows[0].id;

        for (let i = 0; i < recipe.ingredients.length; i++) {
            const ing = recipe.ingredients[i];
            await pool.query(`
                INSERT INTO recipe_ingredients (recipe_id, name, name_ru, amount, sort_order)
                VALUES ($1, $2, $3, $4, $5)
            `, [recipeId, ing.name, ing.name_ru, ing.amount, i + 1]);
        }

        imported++;
    }

    return { imported };
}

module.exports = {
    importFromMealDB,
    enrichRecipesWithAI,
    importHealthyRecipes
};
