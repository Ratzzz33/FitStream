import React, { useState } from 'react';
import { Camera, Check, ImagePlus, Utensils, X } from 'lucide-react';
import { GeneratedRecipe } from '../../services/geminiService';
import { StorageService } from '../../services/storageService';
import { CookedMeal, Leftover } from '../../types';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';
import { t } from '../../services/i18n';

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
  const [isSaving, setIsSaving] = useState(false);
  const [showAddToNutrition, setShowAddToNutrition] = useState(false);
  const [portionsEaten, setPortionsEaten] = useState(1);

  const settings = StorageService.getSettings();
  const currency = (settings.currency || 'RUB') as CurrencyCode;

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

  const handleFinish = async (addToNutrition: boolean = false) => {
    setIsSaving(true);

    try {
      const caloriesEaten = addToNutrition ? Math.round(recipe.caloriesPerServing * portionsEaten) : 0;

      // 1. Create cooked meal record
      const cookedMeal: CookedMeal = {
        id: `meal_${Date.now()}`,
        recipeId: recipe.name,
        recipeName: recipe.name,
        photo,
        cookedAt: new Date().toISOString(),
        servingsCooked: recipe.servings,
        servingsEaten: addToNutrition ? portionsEaten : 0,
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
          const inventory = StorageService.getInventory();
          const item = inventory.find(i => i.id === ingredient.inventoryItemId);
          if (item) {
            const newQuantity = Math.max(0, item.quantity - ingredient.quantity);
            StorageService.updateInventoryQuantity(item.id, newQuantity);
          }
        }
      });

      // 3. Save as leftover (full dish available)
      if (!addToNutrition || portionsEaten < recipe.servings) {
        const portionsLeftover = addToNutrition ? recipe.servings - portionsEaten : recipe.servings;
        if (portionsLeftover > 0) {
          const leftover: Leftover = {
            id: `leftover_${Date.now()}`,
            name: recipe.name,
            emoji: '🍱',
            portions: portionsLeftover,
            caloriesPerPortion: recipe.caloriesPerServing,
            cookedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            photo,
            fromRecipeId: recipe.name
          };
          StorageService.saveLeftover(leftover);
        }
      }

      // 4. Complete and return calories (0 if not eating now)
      onComplete(caloriesEaten);
    } catch (error) {
      console.error('Error saving cooked meal:', error);
      alert('Ошибка при сохранении. Попробуйте ещё раз.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show nutrition add dialog
  if (showAddToNutrition) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={() => setShowAddToNutrition(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-bold dark:text-white">{t('addToMealPlan')}</h2>
          <div className="w-10" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <h3 className="font-semibold dark:text-white text-lg mb-1">{recipe.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {recipe.caloriesPerServing} ккал на порцию
            </p>
          </div>

          {/* Portions selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Сколько порций съели?
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPortionsEaten(Math.max(1, portionsEaten - 1))}
                disabled={portionsEaten <= 1}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-2xl"
              >
                −
              </button>
              <div className="text-center">
                <div className="text-3xl font-bold dark:text-white">{portionsEaten}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {portionsEaten === 1 ? 'порция' : portionsEaten < 5 ? 'порции' : 'порций'}
                </div>
              </div>
              <button
                onClick={() => setPortionsEaten(Math.min(recipe.servings, portionsEaten + 1))}
                disabled={portionsEaten >= recipe.servings}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-2xl"
              >
                +
              </button>
            </div>
            <div className="text-center mt-3">
              <span className="text-2xl font-semibold text-orange-500">
                {Math.round(recipe.caloriesPerServing * portionsEaten)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">ккал</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleFinish(true)}
            disabled={isSaving}
            className="w-full py-4 bg-orange-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Check className="w-6 h-6" />
                <span>{t('addToMealPlan')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-center">
        <span className="text-5xl mb-3 block">🎉</span>
        <h2 className="text-2xl font-bold dark:text-white">Приятного аппетита!</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{recipe.name}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {/* Optional Photo */}
        {photo ? (
          <div
            onClick={handleTakePhoto}
            className="relative mb-6 rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-48 flex items-center justify-center cursor-pointer"
          >
            <img src={photo} alt="Готовое блюдо" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg">
              Нажми чтобы переснять
            </div>
          </div>
        ) : (
          <button
            onClick={handleTakePhoto}
            className="w-full mb-6 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            <ImagePlus className="w-6 h-6" />
            <span>{t('photographDish')}</span>
          </button>
        )}

        {/* Summary card */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 mb-4">
          <div className="text-sm text-green-700 dark:text-green-300 font-medium mb-2">
            ✨ Готовка завершена!
          </div>
          <div className="space-y-1 text-sm text-green-600 dark:text-green-400">
            {recipe.restaurantPrice && recipe.costEstimate && (
              <div className="text-lg font-bold">
                💰 Экономия: {formatCurrency(recipe.restaurantPrice - recipe.costEstimate, currency)}
              </div>
            )}
            <div>📦 Ингредиенты списаны из кухни</div>
            <div>🍱 Блюдо добавлено в холодильник ({recipe.servings} {recipe.servings === 1 ? 'порция' : recipe.servings < 5 ? 'порции' : 'порций'})</div>
          </div>
        </div>

        {/* Info text */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          Когда будете есть — добавьте в рацион через кнопку ниже
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-3">
        {/* Optional: Add to nutrition now */}
        <button
          onClick={() => setShowAddToNutrition(true)}
          className="w-full py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
        >
          <Utensils className="w-5 h-5" />
          <span>Съел сейчас — добавить в рацион</span>
        </button>

        {/* Main action: Just finish */}
        <button
          onClick={() => handleFinish(false)}
          disabled={isSaving}
          className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold text-lg shadow-lg hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Check className="w-6 h-6" />
              <span>Готово</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CookingComplete;
