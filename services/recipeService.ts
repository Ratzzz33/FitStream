/**
 * Recipe Service - Frontend API
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
    servings?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    is_healthy?: boolean;
    is_vegetarian?: boolean;
    ingredients?: RecipeIngredient[];
}

export interface RecipeIngredient {
    id: number;
    name: string;
    name_ru?: string;
    amount?: string;
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

export async function getRecipes(filters: RecipeFilters = {}): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('category', filters.category);
    if (filters.maxCalories) params.append('maxCalories', String(filters.maxCalories));
    if (filters.minProtein) params.append('minProtein', String(filters.minProtein));
    if (filters.isHealthy) params.append('healthy', 'true');
    if (filters.isVegetarian) params.append('vegetarian', 'true');
    if (filters.maxCookingTime) params.append('maxTime', String(filters.maxCookingTime));
    if (filters.limit) params.append('limit', String(filters.limit));
    const url = `/api/recipes${params.toString() ? `?${params}` : ''}`;
    return api.get(url);
}

export async function getRecipeById(id: number): Promise<Recipe> {
    return api.get(`/api/recipes/${id}`);
}

export async function getRandomRecipes(count = 5): Promise<Recipe[]> {
    return api.get(`/api/recipes/random/${count}`);
}

export async function getCategories(): Promise<string[]> {
    return api.get('/api/recipes/meta/categories');
}

function fuzzyMatch(s1: string, s2: string): boolean {
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();
    if (a === b || a.includes(b) || b.includes(a)) return true;
    for (const w1 of a.split(/\s+/)) {
        for (const w2 of b.split(/\s+/)) {
            if (w1.length > 2 && w2.length > 2 && (w1.includes(w2) || w2.includes(w1))) return true;
        }
    }
    return false;
}

export async function getRecipesWithIngredientMatch(userIngredients: string[], filters: RecipeFilters = {}): Promise<RecipeWithMatch[]> {
    const recipes = await getRecipes({ ...filters, limit: 100 });
    const normalized = userIngredients.map(i => i.toLowerCase().trim());

    return recipes
        .filter(r => r.ingredients?.length)
        .map(recipe => {
            const matched: string[] = [];
            const missing: string[] = [];
            for (const ing of recipe.ingredients || []) {
                if (normalized.some(u => fuzzyMatch(u, ing.name))) matched.push(ing.name);
                else missing.push(ing.name);
            }
            const matchPercentage = recipe.ingredients?.length ? Math.round((matched.length / recipe.ingredients.length) * 100) : 0;
            return { ...recipe, matchedIngredients: matched, missingIngredients: missing, matchPercentage };
        })
        .filter(r => r.matchPercentage > 0)
        .sort((a, b) => b.matchPercentage - a.matchPercentage);
}

export async function getReadyToCookRecipes(userIngredients: string[], maxMissing = 3, filters: RecipeFilters = {}): Promise<RecipeWithMatch[]> {
    const matches = await getRecipesWithIngredientMatch(userIngredients, filters);
    return matches.filter(r => r.missingIngredients.length <= maxMissing);
}

export default { getRecipes, getRecipeById, getRandomRecipes, getCategories, getRecipesWithIngredientMatch, getReadyToCookRecipes };
