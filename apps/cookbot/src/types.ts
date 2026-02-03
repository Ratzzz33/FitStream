// CookBot-specific types (re-exports shared recipe types)
export type {
  Recipe,
  RecipeIngredient,
  CookingStep,
  CookedMeal,
  Leftover,
  InventoryItem,
  KitchenStorage,
  NutritionLog,
} from '@fitstream/shared';

// Re-export CookBot-specific types from services
export type {
  GeneratedRecipe,
  RecipeGenerationContext,
  RecipeDifficulty,
  RecipeEquipment,
  TodayMealContext,
} from './services/geminiService';

export type { DietaryPreferences, RecipeCategory } from './components/Cooking/RecipeFilters';
