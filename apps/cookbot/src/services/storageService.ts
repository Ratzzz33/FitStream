// CookBot Storage Service
// Extends BaseStorageService with cooking-specific storage methods

import {
  BaseStorageService,
  ApiService,
} from '@fitstream/shared';
import type {
  KitchenStorage,
  InventoryItem,
  Recipe,
  CookedMeal,
  Leftover,
  NutritionLog,
  StorageType,
} from '@fitstream/shared';

const KEYS = {
  KITCHEN_STORAGES: 'fitstream_kitchen_storages',
  INVENTORY: 'fitstream_inventory',
  COOKING_HISTORY: 'fitstream_cooking_history',
  LEFTOVERS: 'fitstream_leftovers',
  SAVED_RECIPES: 'fitstream_saved_recipes',
};

// Default kitchen storages
const DEFAULT_STORAGES: KitchenStorage[] = [
  { id: 'fridge', name: 'Fridge', type: 'fridge', lastUpdated: new Date().toISOString() },
  { id: 'cabinet', name: 'Cabinet', type: 'cabinet', lastUpdated: new Date().toISOString() },
  { id: 'freezer', name: 'Freezer', type: 'freezer', lastUpdated: new Date().toISOString() },
];

export const StorageService = {
  // Re-export base methods
  ...BaseStorageService,

  // === Kitchen Storages (read-only for recipe context) ===

  getStorages: (): KitchenStorage[] => {
    const data = localStorage.getItem(KEYS.KITCHEN_STORAGES);
    const storages = data ? JSON.parse(data) : DEFAULT_STORAGES;
    return storages.map((s: KitchenStorage) => {
      if (s.photo && (!s.photos || s.photos.length === 0)) {
        s.photos = [{
          id: `photo_migrated_${Date.now()}`,
          base64: s.photo,
          createdAt: s.lastUpdated || new Date().toISOString()
        }];
      }
      return s;
    });
  },

  // === Inventory (read-only for recipe suggestions, consume when cooking) ===

  getInventory: (): InventoryItem[] => {
    const data = localStorage.getItem(KEYS.INVENTORY);
    return data ? JSON.parse(data) : [];
  },

  getActiveInventory: (): InventoryItem[] => {
    return StorageService.getInventory().filter(item => !item.depleted);
  },

  consumeInventoryItems: (items: { itemId: string; quantity: number }[]): void => {
    const inventory = StorageService.getInventory();
    items.forEach(({ itemId, quantity }) => {
      const idx = inventory.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        inventory[idx].quantity -= quantity;
        if (inventory[idx].quantity <= 0) {
          inventory.splice(idx, 1);
        }
      }
    });
    localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  },

  updateInventoryQuantity: (id: string, newQuantity: number): void => {
    const inventory = StorageService.getInventory();
    const idx = inventory.findIndex(i => i.id === id);
    if (idx !== -1) {
      if (newQuantity <= 0) {
        inventory[idx].quantity = 0;
        inventory[idx].depleted = true;
        inventory[idx].depletedAt = new Date().toISOString();
      } else {
        inventory[idx].quantity = newQuantity;
        if (inventory[idx].depleted) {
          inventory[idx].depleted = false;
          inventory[idx].depletedAt = undefined;
        }
      }
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
    }
  },

  // === Cooking History ===

  getCookingHistory: (): CookedMeal[] => {
    const data = localStorage.getItem(KEYS.COOKING_HISTORY);
    return data ? JSON.parse(data) : [];
  },

  saveCookedMeal: (meal: CookedMeal): void => {
    const history = StorageService.getCookingHistory();
    history.push(meal);
    localStorage.setItem(KEYS.COOKING_HISTORY, JSON.stringify(history));

    // Also log calories to nutrition
    const nutritionLog: NutritionLog = {
      id: 'cooked_' + meal.id,
      date: meal.cookedAt.split('T')[0],
      timestamp: new Date(meal.cookedAt).getTime(),
      type: 'FOOD',
      name: meal.recipeName,
      calories: meal.caloriesEaten,
      manualEntry: false
    };

    // Save nutrition log directly
    const nutritionKey = 'fitstream_nutrition';
    const nutritionData = localStorage.getItem(nutritionKey);
    const logs: NutritionLog[] = nutritionData ? JSON.parse(nutritionData) : [];
    logs.push(nutritionLog);
    localStorage.setItem(nutritionKey, JSON.stringify(logs));

    // Sync to backend
    const s = StorageService.getSettings();
    const userId = StorageService.getUserId();
    ApiService.pushLog(userId, 'COOKING_HISTORY' as any, { history }, s.backendUrl);
  },

  getRecentRecipeIds: (limit: number = 5): string[] => {
    const history = StorageService.getCookingHistory();
    return history
      .sort((a, b) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime())
      .slice(0, limit)
      .map(m => m.recipeId);
  },

  // === Leftovers ===

  getLeftovers: (): Leftover[] => {
    const data = localStorage.getItem(KEYS.LEFTOVERS);
    const leftovers: Leftover[] = data ? JSON.parse(data) : [];
    // Filter out expired leftovers
    const now = new Date();
    return leftovers.filter(l => new Date(l.expiresAt) >= now);
  },

  saveLeftover: (leftover: Leftover): void => {
    const leftovers = StorageService.getLeftovers();
    leftovers.push(leftover);
    localStorage.setItem(KEYS.LEFTOVERS, JSON.stringify(leftovers));

    // Sync to backend
    const s = StorageService.getSettings();
    const userId = StorageService.getUserId();
    ApiService.pushLog(userId, 'LEFTOVERS' as any, { items: leftovers }, s.backendUrl);
  },

  removeLeftover: (id: string): void => {
    const leftovers = StorageService.getLeftovers().filter(l => l.id !== id);
    localStorage.setItem(KEYS.LEFTOVERS, JSON.stringify(leftovers));

    // Sync to backend
    const s = StorageService.getSettings();
    const userId = StorageService.getUserId();
    ApiService.pushLog(userId, 'LEFTOVERS' as any, { items: leftovers }, s.backendUrl);
  },

  consumeLeftover: (id: string, portions: number): void => {
    const leftovers = StorageService.getLeftovers();
    const idx = leftovers.findIndex(l => l.id === id);
    if (idx !== -1) {
      const leftover = leftovers[idx];
      leftover.portions -= portions;
      if (leftover.portions <= 0) {
        leftovers.splice(idx, 1);
      }
      localStorage.setItem(KEYS.LEFTOVERS, JSON.stringify(leftovers));

      // Sync to backend
      const s = StorageService.getSettings();
      const userId = StorageService.getUserId();
      ApiService.pushLog(userId, 'LEFTOVERS' as any, { items: leftovers }, s.backendUrl);

      // Log consumed calories
      const nutritionKey = 'fitstream_nutrition';
      const nutritionData = localStorage.getItem(nutritionKey);
      const logs: NutritionLog[] = nutritionData ? JSON.parse(nutritionData) : [];
      const nutritionLog: NutritionLog = {
        id: 'leftover_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        type: 'FOOD',
        name: leftover.name + ' (leftover)',
        calories: leftover.caloriesPerPortion * portions,
        manualEntry: false
      };
      logs.push(nutritionLog);
      localStorage.setItem(nutritionKey, JSON.stringify(logs));
    }
  },

  // === Saved Recipes (Favorites) ===

  getSavedRecipes: (): Recipe[] => {
    const data = localStorage.getItem(KEYS.SAVED_RECIPES);
    return data ? JSON.parse(data) : [];
  },

  saveSavedRecipes: (recipes: Recipe[]): void => {
    localStorage.setItem(KEYS.SAVED_RECIPES, JSON.stringify(recipes));
    // Sync to backend
    const s = StorageService.getSettings();
    const userId = StorageService.getUserId();
    ApiService.pushLog(userId, 'SAVED_RECIPES' as any, { recipes }, s.backendUrl);
  },

  addSavedRecipe: (recipe: Recipe): void => {
    const recipes = StorageService.getSavedRecipes();
    recipes.push(recipe);
    StorageService.saveSavedRecipes(recipes);
  },

  removeSavedRecipe: (recipeId: string): void => {
    const recipes = StorageService.getSavedRecipes().filter(r => r.id !== recipeId);
    StorageService.saveSavedRecipes(recipes);
  },
};
