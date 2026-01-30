import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { InventoryItem, StorageType } from '../../types';
import { StorageService } from '../../services/storageService';
import { getProductNutrition } from '../../services/geminiService';
import { georgiaPrices } from '../../services/georgiaPricesService';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';

interface AddProductModalProps {
  storageId: StorageType;
  onClose: () => void;
  onAdded: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  storageId,
  onClose,
  onAdded
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('г');
  const [storage, setStorage] = useState<StorageType>(storageId);
  const [expiresAt, setExpiresAt] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [caloriesPer100, setCaloriesPer100] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [priceSuggested, setPriceSuggested] = useState(false);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);

  const settings = StorageService.getSettings();
  const currency = (settings?.currency || 'GEL') as CurrencyCode;

  // Auto-suggest price from database when name or quantity changes
  useEffect(() => {
    if (name.trim()) {
      const suggestedPrice = georgiaPrices.getPrice(
        name.trim(),
        parseFloat(quantity) || 1,
        unit
      );
      if (suggestedPrice) {
        setPrice(suggestedPrice);
        setPriceSuggested(true);
      } else {
        setPriceSuggested(false);
      }
    }
  }, [name, quantity, unit]);

  const handleGetNutrition = async () => {
    if (!name.trim()) return;

    setIsLoadingNutrition(true);
    try {
      const nutrition = await getProductNutrition(name);
      setEmoji(nutrition.emoji);
      setCaloriesPer100(nutrition.caloriesPer100.toString());
      setUnit(nutrition.defaultUnit);
      setStorage(nutrition.storageType);
      if (!quantity) {
        setQuantity(nutrition.typicalQuantity.toString());
      }
      if (!expiresAt && nutrition.shelfLifeDays) {
        const expDate = new Date(Date.now() + nutrition.shelfLifeDays * 24 * 60 * 60 * 1000);
        setExpiresAt(expDate.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error getting nutrition:', error);
    } finally {
      setIsLoadingNutrition(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !quantity) return;

    const item: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      emoji,
      quantity: parseFloat(quantity),
      unit,
      storageId: storage,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      addedAt: new Date().toISOString(),
      source: 'manual',
      caloriesPer100: parseFloat(caloriesPer100) || 0,
      price: price || undefined
    };

    StorageService.saveInventoryItem(item);
    onAdded();
  };

  const units = ['г', 'мл', 'шт', 'кг', 'л'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">✏️ Добавить продукт</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name with AI suggestion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-2xl">
                  {emoji}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Гречневая крупа"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={handleGetNutrition}
                disabled={!name.trim() || isLoadingNutrition}
                className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Подсказать калории по названию"
              >
                {isLoadingNutrition ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lightbulb className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Количество
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="500"
                min="0"
                step="any"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Единица
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Storage selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Хранение
            </label>
            <div className="flex gap-2">
              {([
                { type: 'fridge', label: 'Холодильник', icon: '🧊' },
                { type: 'cabinet', label: 'Шкаф', icon: '📦' },
                { type: 'freezer', label: 'Морозилка', icon: '❄️' }
              ] as const).map(({ type, label, icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setStorage(type)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border transition-colors
                    ${storage === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <span>{icon}</span>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Expiration date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Годен до <span className="text-gray-400">(опционально)</span>
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Calories and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Калории на 100{unit === 'мл' ? 'мл' : 'г'}
              </label>
              <input
                type="number"
                value={caloriesPer100}
                onChange={(e) => setCaloriesPer100(e.target.value)}
                placeholder="313"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Цена {priceSuggested && <span className="text-green-500">(из базы)</span>}
              </label>
              <input
                type="number"
                value={price || ''}
                onChange={(e) => {
                  setPrice(e.target.value ? parseFloat(e.target.value) : null);
                  setPriceSuggested(false);
                }}
                placeholder="0"
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  priceSuggested
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {price && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatCurrency(price, currency)}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || !quantity}
            className="w-full py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Добавить
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
