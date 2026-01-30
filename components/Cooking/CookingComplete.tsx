import React, { useState, useEffect } from 'react';
import { Camera, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { CookedMeal, Leftover, InventoryItem } from '../../types';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';

interface CookingCompleteProps {
  recipe: GeneratedRecipe;
  onComplete: (caloriesEaten: number) => void;
  onCancel: () => void;
}

export const CookingComplete: React.FC<CookingCompleteProps> = ({
  recipe,
  onComplete,
  onCancel
}) => {
  const [photo, setPhoto] = useState<string>('');
  const [portionsCooked, setPortionsCooked] = useState(recipe.servings);
  const [portionsEaten, setPortionsEaten] = useState(Math.min(2, recipe.servings));
  const [isSaving, setIsSaving] = useState(false);

  const portionsLeftover = portionsCooked - portionsEaten;
  const caloriesEaten = Math.round(recipe.caloriesPerServing * portionsEaten);
  const caloriesLeftover = Math.round(recipe.caloriesPerServing * portionsLeftover);

  const settings = StorageService.getSettings();
  const currency = (settings.currency || 'RUB') as CurrencyCode;

  // Auto-open camera on mount
  useEffect(() => {
    handleTakePhoto();
  }, []);

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // 1. Create cooked meal record
      const cookedMeal: CookedMeal = {
        id: `meal_${Date.now()}`,
        recipeId: recipe.name, // Using name as ID since we don't have persistent recipe IDs
        recipeName: recipe.name,
        photo,
        cookedAt: new Date().toISOString(),
        servingsCooked: portionsCooked,
        servingsEaten: portionsEaten,
        caloriesEaten,
        ingredientsUsed: recipe.ingredients
          .filter(i => i.isAvailable && i.inventoryItemId)
          .map(i => ({
            itemId: i.inventoryItemId!,
            quantity: i.quantity,
            unit: i.unit
          }))
      };

      StorageService.saveCookedMeal(cookedMeal);

      // 2. Consume ingredients from inventory
      recipe.ingredients.forEach(ingredient => {
        if (ingredient.isAvailable && ingredient.inventoryItemId) {
          // Find the inventory item and reduce quantity
          const inventory = StorageService.getInventory();
          const item = inventory.find(i => i.id === ingredient.inventoryItemId);
          if (item) {
            const newQuantity = Math.max(0, item.quantity - ingredient.quantity);
            StorageService.updateInventoryQuantity(item.id, newQuantity);
          }
        }
      });

      // 3. Save leftovers if any
      if (portionsLeftover > 0) {
        const leftover: Leftover = {
          id: `leftover_${Date.now()}`,
          name: recipe.name,
          emoji: '🍱',
          portions: portionsLeftover,
          caloriesPerPortion: recipe.caloriesPerServing,
          cookedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // +3 days
          photo,
          fromRecipeId: recipe.name
        };

        StorageService.saveLeftover(leftover);
      }

      // 4. Complete and return calories
      onComplete(caloriesEaten);
    } catch (error) {
      console.error('Error saving cooked meal:', error);
      alert('Ошибка при сохранении. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const adjustPortions = (type: 'cooked' | 'eaten', delta: number) => {
    if (type === 'cooked') {
      const newCooked = Math.max(1, Math.min(20, portionsCooked + delta));
      setPortionsCooked(newCooked);
      // Ensure eaten doesn't exceed cooked
      if (portionsEaten > newCooked) {
        setPortionsEaten(newCooked);
      }
    } else {
      const newEaten = Math.max(0, Math.min(portionsCooked, portionsEaten + delta));
      setPortionsEaten(newEaten);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-center">
        <span className="text-3xl mb-2 block">🎉</span>
        <h2 className="text-xl font-bold dark:text-white">Готово!</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Photo */}
        <div
          onClick={handleTakePhoto}
          className="relative mb-6 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center cursor-pointer"
        >
          {photo ? (
            <img src={photo} alt="Готовое блюдо" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <span className="text-gray-500 dark:text-gray-400">Сфотографируй результат</span>
            </div>
          )}
          {photo && (
            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg">
              Нажми чтобы переснять
            </div>
          )}
        </div>

        {/* Dish name */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
          <h3 className="font-semibold dark:text-white text-lg mb-1">{recipe.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {recipe.caloriesPerServing} ккал на порцию
          </p>
        </div>

        {/* Portions eaten */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Съедаю сейчас:
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => adjustPortions('eaten', -1)}
              disabled={portionsEaten <= 0}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="text-3xl font-bold dark:text-white">{portionsEaten}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {portionsEaten === 1 ? 'порция' : portionsEaten < 5 ? 'порции' : 'порций'}
              </div>
            </div>
            <button
              onClick={() => adjustPortions('eaten', 1)}
              disabled={portionsEaten >= portionsCooked}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center mt-3">
            <span className="text-2xl font-semibold text-orange-500">{caloriesEaten}</span>
            <span className="text-gray-500 dark:text-gray-400 ml-1">ккал</span>
          </div>
        </div>

        {/* Leftovers info */}
        {portionsLeftover > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <span className="text-xl">🍱</span>
              <span>
                В холодильник: <strong>{portionsLeftover}</strong>{' '}
                {portionsLeftover === 1 ? 'порция' : portionsLeftover < 5 ? 'порции' : 'порций'}
              </span>
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              {caloriesLeftover} ккал · Годен 3 дня
            </div>
          </div>
        )}

        {/* Summary card - PRD: Show savings */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
            ✨ Отличная работа!
          </div>
          <div className="space-y-1 text-sm text-green-600 dark:text-green-400">
            {recipe.restaurantPrice && recipe.costEstimate && (
              <div className="text-lg font-bold">
                💰 Вы сэкономили {formatCurrency(recipe.restaurantPrice - recipe.costEstimate, currency)}
              </div>
            )}
            <div>🔥 Съедено: {caloriesEaten} ккал</div>
            <div>📦 Ингредиенты списаны из кухни</div>
            {portionsLeftover > 0 && (
              <div>🍱 Остатки добавлены в холодильник</div>
            )}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Check className="w-6 h-6" />
              <span>Сохранить</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CookingComplete;
