/**
 * Recipe Service
 * Frontend API service for recipe management
 */

import { api } from './api';

export interface Recipe {
    id: number;
    name_en: string;
    name_ru?: string;
    category?: string;
    area?: string;
    instructions?: string;
    instructions_ru?: string;
    tips?: string;
    tips_ru?: string;
    image_url?: string;
    video_url?: string;
    calories?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
    fiber?: number;
    cooking_time?: number;
    prep_time?: number;
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    is_healthy?: boolean;
    is_vegetarian?: boolean;
    is_vegan?: boolean;
    is_gluten_free?: boolean;
    is_dairy_free?: boolean;
    ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
    id: number;
    name: string;
    name_ru?: string;
    amount?: string;
    unit?: string;
}

export interface RecipeFilters {
    search?: string;
    category?: string;
    maxCalories?: number;
    minProtein?: number;
    isHealthy?: boolean;
    isVegetarian?: boolean;
    maxCookingTime?: number;
    difficulty?: string;
    limit?: number;
    offset?: number;
}

export interface RecipeWithMatch extends Recipe {
    matchedIngredients: string[];
    missingIngredients: string[];
    matchPercentage: number;
}

/**
 * Get recipes with optional filters
 */
export async function getRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.maxCalories) params.append('maxCalories', String(filters.maxCalories));
    if (filters.minProtein) params.append('minProtein', String(filters.minProtein));
    if (filters.isHealthy) params.append('healthy', 'true');
    if (filters.isVegetarian) params.append('vegetarian', 'true');
    if (filters.maxCookingTime) params.append('maxTime', String(filters.maxCookingTime));
    if (filters.difficulty) params.append('difficulty', filters.difficulty);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const queryString = params.toString();
    const url = `/api/recipes${queryString ? `?${queryString}` : ''}`;

    return api.get(url);
}

/**
 * Get single recipe by ID
 */
export async function getRecipeById(id: number): Promise<Recipe> {
    return api.get(`/api/recipes/${id}`);
}

/**
 * Get random recipes
 */
export async function getRandomRecipes(count: number = 5): Promise<Recipe[]> {
    return api.get(`/api/recipes/random/${count}`);
}

/**
 * Get recipe categories
 */
export async function getCategories(): Promise<string[]> {
    return api.get('/api/recipes/meta/categories');
}

/**
 * Simple fuzzy match for ingredient names
 */
function fuzzyMatch(str1: string, str2: string): boolean {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    // Exact match
    if (s1 === s2) return true;

    // Contains match
    if (s1.includes(s2) || s2.includes(s1)) return true;

    // Word match (e.g., "chicken breast" matches "chicken")
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);

    for (const w1 of words1) {
        for (const w2 of words2) {
            if (w1.length > 2 && w2.length > 2) {
                if (w1.includes(w2) || w2.includes(w1)) return true;
            }
        }
    }

    return false;
}

/**
 * Get recipes that match user's inventory ingredients
 */
export async function getRecipesWithIngredientMatch(
    userIngredients: string[],
    filters: RecipeFilters = {}
): Promise<RecipeWithMatch[]> {
    // Get recipes with ingredients
    const recipes = await getRecipes({ ...filters, limit: 100 });

    const normalizedUserIngredients = userIngredients.map(i => i.toLowerCase().trim());

    const recipesWithMatch: RecipeWithMatch[] = recipes
        .filter(recipe => recipe.ingredients && recipe.ingredients.length > 0)
        .map(recipe => {
            const recipeIngredients = recipe.ingredients || [];
            const matched: string[] = [];
            const missing: string[] = [];

            for (const ing of recipeIngredients) {
                const ingName = ing.name.toLowerCase().trim();
                const hasMatch = normalizedUserIngredients.some(userIng =>
                    fuzzyMatch(userIng, ingName)
                );

                if (hasMatch) {
                    matched.push(ing.name);
                } else {
                    missing.push(ing.name);
                }
            }

            const matchPercentage = recipeIngredients.length > 0
                ? Math.round((matched.length / recipeIngredients.length) * 100)
                : 0;

            return {
                ...recipe,
                matchedIngredients: matched,
                missingIngredients: missing,
                matchPercentage
            };
        })
        .filter(r => r.matchPercentage > 0)
        .sort((a, b) => b.matchPercentage - a.matchPercentage);

    return recipesWithMatch;
}

/**
 * Get recipes that user can cook with their ingredients
 * (allows up to maxMissing ingredients to be missing)
 */
export async function getReadyToCookRecipes(
    userIngredients: string[],
    maxMissing: number = 3,
    filters: RecipeFilters = {}
): Promise<RecipeWithMatch[]> {
    const recipesWithMatch = await getRecipesWithIngredientMatch(userIngredients, filters);

    return recipesWithMatch.filter(r => r.missingIngredients.length <= maxMissing);
}

export default {
    getRecipes,
    getRecipeById,
    getRandomRecipes,
    getCategories,
    getRecipesWithIngredientMatch,
    getReadyToCookRecipes
};
