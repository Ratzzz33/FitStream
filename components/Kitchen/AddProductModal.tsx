import React, { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import { InventoryItem, StorageType } from '../../types';
import { StorageService } from '../../services/storageService';
import { getProductNutrition } from '../../services/geminiService';
import { georgiaPrices } from '../../services/georgiaPricesService';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';
import { t } from '../../services/i18n';

// Auto-emoji mapping based on product name patterns
const EMOJI_MAP: Record<string, string> = {
  // Молочные продукты
  'молоко': '🥛', 'кефир': '🥛', 'йогурт': '🥛', 'сметан': '🥛', 'творог': '🧀',
  'сыр': '🧀', 'масло': '🧈', 'сливк': '🥛',
  // Яйца
  'яйц': '🥚', 'яиц': '🥚',
  // Мясо
  'курица': '🍗', 'куриц': '🍗', 'курин': '🍗', 'филе': '🍗', 'грудк': '🍗',
  'говядин': '🥩', 'свинин': '🥩', 'мясо': '🥩', 'фарш': '🥩', 'стейк': '🥩',
  'бекон': '🥓', 'колбас': '🥓', 'сосиск': '🌭', 'ветчин': '🥓',
  // Рыба
  'рыб': '🐟', 'лосось': '🐟', 'сёмг': '🐟', 'семг': '🐟', 'тунец': '🐟',
  'креветк': '🦐', 'морепродукт': '🦐',
  // Овощи
  'помидор': '🍅', 'томат': '🍅', 'огурец': '🥒', 'огурц': '🥒',
  'морков': '🥕', 'картоф': '🥔', 'картош': '🥔', 'лук': '🧅', 'чеснок': '🧄',
  'капуст': '🥬', 'салат': '🥗', 'перец': '🌶️', 'баклажан': '🍆',
  'кабачок': '🥒', 'кабачк': '🥒', 'брокколи': '🥦', 'цветн': '🥦',
  'горох': '🫛', 'фасол': '🫘', 'кукуруз': '🌽', 'грибы': '🍄', 'гриб': '🍄',
  'авокадо': '🥑', 'шпинат': '🥬', 'зелен': '🌿',
  // Фрукты
  'яблок': '🍎', 'банан': '🍌', 'апельсин': '🍊', 'лимон': '🍋',
  'виноград': '🍇', 'клубник': '🍓', 'малин': '🍓', 'черник': '🫐',
  'арбуз': '🍉', 'дын': '🍈', 'персик': '🍑', 'груш': '🍐',
  'манго': '🥭', 'ананас': '🍍', 'киви': '🥝', 'слив': '🍑',
  'гранат': '🍎', 'хурма': '🍊',
  // Хлеб и выпечка
  'хлеб': '🍞', 'батон': '🥖', 'булк': '🥐', 'багет': '🥖',
  'круассан': '🥐', 'торт': '🎂', 'пирог': '🥧', 'печень': '🍪',
  'кекс': '🧁', 'пончик': '🍩',
  // Крупы и макароны
  'рис': '🍚', 'греч': '🌾', 'овсян': '🥣', 'каш': '🥣',
  'макарон': '🍝', 'паста': '🍝', 'спагетти': '🍝', 'лапш': '🍜',
  'крупа': '🌾', 'пшен': '🌾', 'манк': '🌾', 'перловк': '🌾',
  // Напитки
  'вода': '💧', 'сок': '🧃', 'чай': '🍵', 'кофе': '☕',
  'компот': '🍹', 'морс': '🍹', 'лимонад': '🥤', 'кола': '🥤',
  // Сладости
  'шоколад': '🍫', 'конфет': '🍬', 'мёд': '🍯', 'мед': '🍯',
  'варень': '🍓', 'джем': '🍓', 'сахар': '🍬',
  // Орехи
  'орех': '🥜', 'миндаль': '🥜', 'фундук': '🥜', 'кешью': '🥜',
  'арахис': '🥜', 'семечк': '🌻',
  // Соусы
  'кетчуп': '🍅', 'майонез': '🥫', 'соус': '🥫', 'горчиц': '🥫',
  // Готовая еда
  'пицц': '🍕', 'бургер': '🍔', 'сэндвич': '🥪', 'суши': '🍣',
  'суп': '🍲', 'борщ': '🍲', 'пельмен': '🥟', 'вареник': '🥟',
};

const getEmojiForProduct = (name: string): string => {
  const lowerName = name.toLowerCase();
  for (const [pattern, emoji] of Object.entries(EMOJI_MAP)) {
    if (lowerName.includes(pattern)) {
      return emoji;
    }
  }
  return '🍽️';
};

interface AddProductModalProps {
  storageId: StorageType;
  onClose: () => void;
  onAdded: () => void;
}

interface RecentProduct {
  name: string;
  emoji: string;
  unit: string;
  caloriesPer100: number;
  typicalQuantity: number;
  storageId: StorageType;
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

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<RecentProduct[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Auto-emoji and autocomplete when name changes
  useEffect(() => {
    if (name.trim().length >= 2) {
      // Auto-suggest emoji
      const autoEmoji = getEmojiForProduct(name);
      if (autoEmoji !== '🍽️') {
        setEmoji(autoEmoji);
      }
      // Search recent products for autocomplete
      if (typeof StorageService.searchRecentProducts === 'function') {
        const results = StorageService.searchRecentProducts(name.trim());
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name]);

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Select a suggestion from autocomplete
  const selectSuggestion = (suggestion: RecentProduct) => {
    setName(suggestion.name);
    setEmoji(suggestion.emoji);
    setUnit(suggestion.unit);
    setCaloriesPer100(suggestion.caloriesPer100.toString());
    setQuantity(suggestion.typicalQuantity.toString());
    setStorage(suggestion.storageId);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

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
    // Track product usage for future quick-add
    if (typeof StorageService.trackProductUsage === 'function') {
      StorageService.trackProductUsage(item);
    }
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
          {/* Name with AI suggestion and autocomplete */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-2xl">
                  {emoji}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Гречневая крупа"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={handleGetNutrition}
                disabled={!name.trim() || isLoadingNutrition}
                className="px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('suggestCaloriesByName')}
              >
                {isLoadingNutrition ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lightbulb className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() => selectSuggestion(suggestion)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                    }`}
                  >
                    <span className="text-xl">{suggestion.emoji}</span>
                    <span className="flex-1 dark:text-white">{suggestion.name}</span>
                    <span className="text-xs text-gray-400">
                      {suggestion.caloriesPer100} ккал/{suggestion.unit === 'мл' ? '100мл' : '100г'}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
