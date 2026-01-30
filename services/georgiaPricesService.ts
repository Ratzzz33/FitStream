/**
 * Georgia Prices Service
 * Справочник цен на продукты в Грузии (GEL)
 * Источники: Numbeo, Carrefour.ge, Nikora.ge
 * Обновляется раз в неделю
 *
 * Total: ~500 products
 */

import { EXTENDED_PRICES } from './georgiaProductsExtended';

export interface ProductPrice {
  id: string;
  name: string;           // Название на русском
  nameEn: string;         // English name
  nameKa?: string;        // Georgian name
  emoji: string;
  category: PriceCategory;
  priceGel: number;       // Цена в лари
  unit: string;           // кг, л, шт, 500г и т.д.
  pricePerUnit: number;   // Цена за базовую единицу (за кг/л)
  source: 'numbeo' | 'carrefour' | 'nikora' | 'user' | 'ai';
  lastUpdated: string;    // ISO date
  confidence: number;     // 0-100, насколько актуальна цена
}

export type PriceCategory =
  | 'dairy'       // Молочные
  | 'meat'        // Мясо
  | 'fish'        // Рыба
  | 'vegetables'  // Овощи
  | 'fruits'      // Фрукты
  | 'grains'      // Крупы, макароны
  | 'bread'       // Хлеб, выпечка
  | 'eggs'        // Яйца
  | 'oils'        // Масла
  | 'drinks'      // Напитки
  | 'snacks'      // Снеки
  | 'spices'      // Специи
  | 'canned'      // Консервы
  | 'frozen'      // Заморозка
  | 'sweets'      // Сладости
  | 'alcohol'     // Алкоголь
  | 'household'   // Бытовое
  | 'other';

export interface PriceDatabase {
  version: string;
  lastFullUpdate: string;
  country: 'GE';
  currency: 'GEL';
  products: ProductPrice[];
}

// Базовая база цен - Numbeo + Carrefour (~150 продуктов)
const BASE_PRICES: ProductPrice[] = [
  // === МОЛОЧНЫЕ ===
  { id: 'milk-1l', name: 'Молоко', nameEn: 'Milk', emoji: '🥛', category: 'dairy', priceGel: 5.36, unit: '1л', pricePerUnit: 5.36, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'kefir-1l', name: 'Кефир', nameEn: 'Kefir', emoji: '🥛', category: 'dairy', priceGel: 4.80, unit: '1л', pricePerUnit: 4.80, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'yogurt-natural', name: 'Йогурт натуральный', nameEn: 'Natural Yogurt', emoji: '🥛', category: 'dairy', priceGel: 3.50, unit: '400г', pricePerUnit: 8.75, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'sour-cream', name: 'Сметана', nameEn: 'Sour Cream', emoji: '🥛', category: 'dairy', priceGel: 4.50, unit: '400г', pricePerUnit: 11.25, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'cottage-cheese', name: 'Творог', nameEn: 'Cottage Cheese', emoji: '🧀', category: 'dairy', priceGel: 8.00, unit: '400г', pricePerUnit: 20.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'cheese-local', name: 'Сыр грузинский', nameEn: 'Georgian Cheese', nameKa: 'ქართული ყველი', emoji: '🧀', category: 'dairy', priceGel: 21.75, unit: '1кг', pricePerUnit: 21.75, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'cheese-suluguni', name: 'Сулугуни', nameEn: 'Suluguni', nameKa: 'სულუგუნი', emoji: '🧀', category: 'dairy', priceGel: 18.00, unit: '1кг', pricePerUnit: 18.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'cheese-imeruli', name: 'Имеретинский сыр', nameEn: 'Imeruli Cheese', nameKa: 'იმერული ყველი', emoji: '🧀', category: 'dairy', priceGel: 16.00, unit: '1кг', pricePerUnit: 16.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'butter', name: 'Сливочное масло', nameEn: 'Butter', emoji: '🧈', category: 'dairy', priceGel: 7.69, unit: '200г', pricePerUnit: 38.45, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'cream-cheese', name: 'Сливочный сыр', nameEn: 'Cream Cheese', emoji: '🧀', category: 'dairy', priceGel: 7.20, unit: '230г', pricePerUnit: 31.30, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'matsoni', name: 'Мацони', nameEn: 'Matsoni', nameKa: 'მაწონი', emoji: '🥛', category: 'dairy', priceGel: 3.50, unit: '500г', pricePerUnit: 7.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },

  // === ЯЙЦА ===
  { id: 'eggs-10', name: 'Яйца', nameEn: 'Eggs', emoji: '🥚', category: 'eggs', priceGel: 6.95, unit: '12шт', pricePerUnit: 0.58, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'eggs-10-c1', name: 'Яйца С1', nameEn: 'Eggs C1', emoji: '🥚', category: 'eggs', priceGel: 5.50, unit: '10шт', pricePerUnit: 0.55, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === МЯСО ===
  { id: 'chicken-fillet', name: 'Куриное филе', nameEn: 'Chicken Fillet', emoji: '🍗', category: 'meat', priceGel: 18.16, unit: '1кг', pricePerUnit: 18.16, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'chicken-whole', name: 'Курица целая', nameEn: 'Whole Chicken', emoji: '🍗', category: 'meat', priceGel: 12.00, unit: '1кг', pricePerUnit: 12.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'chicken-thigh', name: 'Куриные бёдра', nameEn: 'Chicken Thighs', emoji: '🍗', category: 'meat', priceGel: 14.00, unit: '1кг', pricePerUnit: 14.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'beef', name: 'Говядина', nameEn: 'Beef', emoji: '🥩', category: 'meat', priceGel: 27.33, unit: '1кг', pricePerUnit: 27.33, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'beef-mince', name: 'Говяжий фарш', nameEn: 'Beef Mince', emoji: '🥩', category: 'meat', priceGel: 22.00, unit: '1кг', pricePerUnit: 22.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'pork', name: 'Свинина', nameEn: 'Pork', emoji: '🥩', category: 'meat', priceGel: 20.00, unit: '1кг', pricePerUnit: 20.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'lamb', name: 'Баранина', nameEn: 'Lamb', emoji: '🥩', category: 'meat', priceGel: 35.00, unit: '1кг', pricePerUnit: 35.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 80 },
  { id: 'sausages', name: 'Сосиски', nameEn: 'Sausages', emoji: '🌭', category: 'meat', priceGel: 12.00, unit: '500г', pricePerUnit: 24.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'bacon', name: 'Бекон', nameEn: 'Bacon', emoji: '🥓', category: 'meat', priceGel: 18.00, unit: '200г', pricePerUnit: 90.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === РЫБА ===
  { id: 'salmon', name: 'Лосось', nameEn: 'Salmon', emoji: '🐟', category: 'fish', priceGel: 45.00, unit: '1кг', pricePerUnit: 45.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 80 },
  { id: 'trout', name: 'Форель', nameEn: 'Trout', emoji: '🐟', category: 'fish', priceGel: 28.00, unit: '1кг', pricePerUnit: 28.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 80 },
  { id: 'shrimp', name: 'Креветки', nameEn: 'Shrimp', emoji: '🦐', category: 'fish', priceGel: 55.00, unit: '1кг', pricePerUnit: 55.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 75 },
  { id: 'tuna-canned', name: 'Тунец консервированный', nameEn: 'Canned Tuna', emoji: '🐟', category: 'fish', priceGel: 8.00, unit: '185г', pricePerUnit: 43.24, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === ОВОЩИ ===
  { id: 'tomatoes', name: 'Помидоры', nameEn: 'Tomatoes', emoji: '🍅', category: 'vegetables', priceGel: 5.90, unit: '1кг', pricePerUnit: 5.90, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'cucumbers', name: 'Огурцы', nameEn: 'Cucumbers', emoji: '🥒', category: 'vegetables', priceGel: 5.25, unit: '1кг', pricePerUnit: 5.25, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'potatoes', name: 'Картофель', nameEn: 'Potatoes', emoji: '🥔', category: 'vegetables', priceGel: 2.04, unit: '1кг', pricePerUnit: 2.04, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'onion', name: 'Лук', nameEn: 'Onion', emoji: '🧅', category: 'vegetables', priceGel: 1.83, unit: '1кг', pricePerUnit: 1.83, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'garlic', name: 'Чеснок', nameEn: 'Garlic', emoji: '🧄', category: 'vegetables', priceGel: 12.00, unit: '1кг', pricePerUnit: 12.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'carrot', name: 'Морковь', nameEn: 'Carrot', emoji: '🥕', category: 'vegetables', priceGel: 2.50, unit: '1кг', pricePerUnit: 2.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'cabbage', name: 'Капуста', nameEn: 'Cabbage', emoji: '🥬', category: 'vegetables', priceGel: 2.00, unit: '1кг', pricePerUnit: 2.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'pepper-bell', name: 'Болгарский перец', nameEn: 'Bell Pepper', emoji: '🫑', category: 'vegetables', priceGel: 8.00, unit: '1кг', pricePerUnit: 8.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'eggplant', name: 'Баклажан', nameEn: 'Eggplant', emoji: '🍆', category: 'vegetables', priceGel: 5.00, unit: '1кг', pricePerUnit: 5.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'lettuce', name: 'Салат', nameEn: 'Lettuce', emoji: '🥬', category: 'vegetables', priceGel: 3.64, unit: '1шт', pricePerUnit: 3.64, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'broccoli', name: 'Брокколи', nameEn: 'Broccoli', emoji: '🥦', category: 'vegetables', priceGel: 10.00, unit: '1кг', pricePerUnit: 10.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 80 },
  { id: 'mushrooms', name: 'Шампиньоны', nameEn: 'Mushrooms', emoji: '🍄', category: 'vegetables', priceGel: 12.00, unit: '1кг', pricePerUnit: 12.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'herbs-cilantro', name: 'Кинза', nameEn: 'Cilantro', nameKa: 'ქინძი', emoji: '🌿', category: 'vegetables', priceGel: 1.50, unit: 'пучок', pricePerUnit: 1.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'herbs-parsley', name: 'Петрушка', nameEn: 'Parsley', emoji: '🌿', category: 'vegetables', priceGel: 1.50, unit: 'пучок', pricePerUnit: 1.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'avocado', name: 'Авокадо', nameEn: 'Avocado', emoji: '🥑', category: 'vegetables', priceGel: 5.00, unit: '1шт', pricePerUnit: 5.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === ФРУКТЫ ===
  { id: 'apples', name: 'Яблоки', nameEn: 'Apples', emoji: '🍎', category: 'fruits', priceGel: 3.75, unit: '1кг', pricePerUnit: 3.75, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'bananas', name: 'Бананы', nameEn: 'Bananas', emoji: '🍌', category: 'fruits', priceGel: 4.55, unit: '1кг', pricePerUnit: 4.55, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'oranges', name: 'Апельсины', nameEn: 'Oranges', emoji: '🍊', category: 'fruits', priceGel: 5.18, unit: '1кг', pricePerUnit: 5.18, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'mandarins', name: 'Мандарины', nameEn: 'Mandarins', emoji: '🍊', category: 'fruits', priceGel: 4.00, unit: '1кг', pricePerUnit: 4.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'lemons', name: 'Лимоны', nameEn: 'Lemons', emoji: '🍋', category: 'fruits', priceGel: 5.00, unit: '1кг', pricePerUnit: 5.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'grapes', name: 'Виноград', nameEn: 'Grapes', emoji: '🍇', category: 'fruits', priceGel: 8.00, unit: '1кг', pricePerUnit: 8.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'strawberries', name: 'Клубника', nameEn: 'Strawberries', emoji: '🍓', category: 'fruits', priceGel: 15.00, unit: '500г', pricePerUnit: 30.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 75 },
  { id: 'watermelon', name: 'Арбуз', nameEn: 'Watermelon', emoji: '🍉', category: 'fruits', priceGel: 2.00, unit: '1кг', pricePerUnit: 2.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 80 },
  { id: 'pomegranate', name: 'Гранат', nameEn: 'Pomegranate', emoji: '🍎', category: 'fruits', priceGel: 6.00, unit: '1кг', pricePerUnit: 6.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'persimmon', name: 'Хурма', nameEn: 'Persimmon', nameKa: 'ხურმა', emoji: '🍊', category: 'fruits', priceGel: 5.00, unit: '1кг', pricePerUnit: 5.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'dates', name: 'Финики', nameEn: 'Dates', emoji: '🌴', category: 'fruits', priceGel: 18.00, unit: '500г', pricePerUnit: 36.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === ХЛЕБ ===
  { id: 'bread-white', name: 'Белый хлеб', nameEn: 'White Bread', emoji: '🍞', category: 'bread', priceGel: 2.04, unit: '500г', pricePerUnit: 4.08, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'bread-tonis-puri', name: 'Тонис пури', nameEn: 'Tonis Puri', nameKa: 'თონის პური', emoji: '🍞', category: 'bread', priceGel: 1.50, unit: '1шт', pricePerUnit: 1.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'bread-shoti', name: 'Шоти', nameEn: 'Shoti', nameKa: 'შოთი', emoji: '🍞', category: 'bread', priceGel: 1.50, unit: '1шт', pricePerUnit: 1.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'bread-lavash', name: 'Лаваш', nameEn: 'Lavash', emoji: '🫓', category: 'bread', priceGel: 2.00, unit: '1шт', pricePerUnit: 2.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'croissant', name: 'Круассан', nameEn: 'Croissant', emoji: '🥐', category: 'bread', priceGel: 3.50, unit: '1шт', pricePerUnit: 3.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === КРУПЫ ===
  { id: 'rice-white', name: 'Рис', nameEn: 'Rice', emoji: '🍚', category: 'grains', priceGel: 4.70, unit: '1кг', pricePerUnit: 4.70, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'buckwheat', name: 'Гречка', nameEn: 'Buckwheat', emoji: '🌾', category: 'grains', priceGel: 5.00, unit: '800г', pricePerUnit: 6.25, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'oats', name: 'Овсянка', nameEn: 'Oats', emoji: '🌾', category: 'grains', priceGel: 4.00, unit: '500г', pricePerUnit: 8.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'pasta-spaghetti', name: 'Спагетти', nameEn: 'Spaghetti', emoji: '🍝', category: 'grains', priceGel: 2.99, unit: '500г', pricePerUnit: 5.98, source: 'numbeo', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'flour-wheat', name: 'Мука пшеничная', nameEn: 'Wheat Flour', emoji: '🌾', category: 'grains', priceGel: 3.00, unit: '1кг', pricePerUnit: 3.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'lentils', name: 'Чечевица', nameEn: 'Lentils', emoji: '🌾', category: 'grains', priceGel: 6.00, unit: '500г', pricePerUnit: 12.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'beans-red', name: 'Красная фасоль', nameEn: 'Red Beans', emoji: '🫘', category: 'grains', priceGel: 5.00, unit: '500г', pricePerUnit: 10.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === МАСЛА ===
  { id: 'oil-sunflower', name: 'Подсолнечное масло', nameEn: 'Sunflower Oil', emoji: '🌻', category: 'oils', priceGel: 10.00, unit: '1л', pricePerUnit: 10.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'oil-olive', name: 'Оливковое масло', nameEn: 'Olive Oil', emoji: '🫒', category: 'oils', priceGel: 25.00, unit: '500мл', pricePerUnit: 50.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === НАПИТКИ ===
  { id: 'water-still', name: 'Вода негазированная', nameEn: 'Still Water', emoji: '💧', category: 'drinks', priceGel: 1.50, unit: '1.5л', pricePerUnit: 1.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'water-borjomi', name: 'Боржоми', nameEn: 'Borjomi', nameKa: 'ბორჯომი', emoji: '💧', category: 'drinks', priceGel: 3.50, unit: '500мл', pricePerUnit: 7.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'water-nabeghlavi', name: 'Набеглави', nameEn: 'Nabeghlavi', nameKa: 'ნაბეღლავი', emoji: '💧', category: 'drinks', priceGel: 2.00, unit: '1л', pricePerUnit: 2.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'juice-orange', name: 'Апельсиновый сок', nameEn: 'Orange Juice', emoji: '🧃', category: 'drinks', priceGel: 6.00, unit: '1л', pricePerUnit: 6.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'coca-cola', name: 'Кока-кола', nameEn: 'Coca-Cola', emoji: '🥤', category: 'drinks', priceGel: 3.50, unit: '1.5л', pricePerUnit: 2.33, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'lemonade-natakhtari', name: 'Лимонад Натахтари', nameEn: 'Natakhtari Lemonade', nameKa: 'ნატახტარი', emoji: '🍋', category: 'drinks', priceGel: 2.50, unit: '1л', pricePerUnit: 2.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'tea-black', name: 'Чёрный чай', nameEn: 'Black Tea', emoji: '🍵', category: 'drinks', priceGel: 8.00, unit: '100пак', pricePerUnit: 0.08, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'coffee-instant', name: 'Растворимый кофе', nameEn: 'Instant Coffee', emoji: '☕', category: 'drinks', priceGel: 15.00, unit: '100г', pricePerUnit: 150.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === СПЕЦИИ ===
  { id: 'salt', name: 'Соль', nameEn: 'Salt', emoji: '🧂', category: 'spices', priceGel: 1.50, unit: '1кг', pricePerUnit: 1.50, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'sugar', name: 'Сахар', nameEn: 'Sugar', emoji: '🍬', category: 'spices', priceGel: 4.00, unit: '1кг', pricePerUnit: 4.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'khmeli-suneli', name: 'Хмели-сунели', nameEn: 'Khmeli-Suneli', nameKa: 'ხმელი-სუნელი', emoji: '🌿', category: 'spices', priceGel: 3.00, unit: '50г', pricePerUnit: 60.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'adjika', name: 'Аджика', nameEn: 'Adjika', nameKa: 'აჯიკა', emoji: '🌶️', category: 'spices', priceGel: 5.00, unit: '200г', pricePerUnit: 25.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'tkemali', name: 'Ткемали', nameEn: 'Tkemali', nameKa: 'ტყემალი', emoji: '🫙', category: 'spices', priceGel: 6.00, unit: '300г', pricePerUnit: 20.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'satsebeli', name: 'Сацебели', nameEn: 'Satsebeli', nameKa: 'საწებელი', emoji: '🫙', category: 'spices', priceGel: 5.00, unit: '300г', pricePerUnit: 16.67, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'honey', name: 'Мёд', nameEn: 'Honey', emoji: '🍯', category: 'spices', priceGel: 25.00, unit: '500г', pricePerUnit: 50.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === СЛАДОСТИ ===
  { id: 'chocolate-milk', name: 'Молочный шоколад', nameEn: 'Milk Chocolate', emoji: '🍫', category: 'sweets', priceGel: 5.00, unit: '100г', pricePerUnit: 50.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'ice-cream', name: 'Мороженое', nameEn: 'Ice Cream', emoji: '🍦', category: 'sweets', priceGel: 8.00, unit: '500мл', pricePerUnit: 16.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'churchkhela', name: 'Чурчхела', nameEn: 'Churchkhela', nameKa: 'ჩურჩხელა', emoji: '🍇', category: 'sweets', priceGel: 5.00, unit: '1шт', pricePerUnit: 5.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },

  // === ОРЕХИ ===
  { id: 'walnuts', name: 'Грецкие орехи', nameEn: 'Walnuts', emoji: '🥜', category: 'snacks', priceGel: 25.00, unit: '500г', pricePerUnit: 50.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'hazelnuts', name: 'Фундук', nameEn: 'Hazelnuts', emoji: '🌰', category: 'snacks', priceGel: 30.00, unit: '500г', pricePerUnit: 60.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === АЛКОГОЛЬ ===
  { id: 'wine-saperavi', name: 'Саперави', nameEn: 'Saperavi', nameKa: 'საფერავი', emoji: '🍷', category: 'alcohol', priceGel: 18.00, unit: '750мл', pricePerUnit: 24.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'wine-kindzmarauli', name: 'Киндзмараули', nameEn: 'Kindzmarauli', nameKa: 'კინძმარაული', emoji: '🍷', category: 'alcohol', priceGel: 25.00, unit: '750мл', pricePerUnit: 33.33, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'chacha', name: 'Чача', nameEn: 'Chacha', nameKa: 'ჭაჭა', emoji: '🥃', category: 'alcohol', priceGel: 20.00, unit: '500мл', pricePerUnit: 40.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'beer-local', name: 'Пиво местное', nameEn: 'Local Beer', emoji: '🍺', category: 'alcohol', priceGel: 3.00, unit: '500мл', pricePerUnit: 6.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },

  // === ЗАМОРОЗКА ===
  { id: 'frozen-khinkali', name: 'Хинкали замороженные', nameEn: 'Frozen Khinkali', nameKa: 'ხინკალი', emoji: '🥟', category: 'frozen', priceGel: 12.00, unit: '10шт', pricePerUnit: 1.20, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 90 },
  { id: 'frozen-pizza', name: 'Пицца замороженная', nameEn: 'Frozen Pizza', emoji: '🍕', category: 'frozen', priceGel: 12.00, unit: '350г', pricePerUnit: 34.29, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },

  // === БЫТОВОЕ ===
  { id: 'toilet-paper', name: 'Туалетная бумага', nameEn: 'Toilet Paper', emoji: '🧻', category: 'household', priceGel: 8.00, unit: '8шт', pricePerUnit: 1.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
  { id: 'dish-soap', name: 'Средство для посуды', nameEn: 'Dish Soap', emoji: '🧴', category: 'household', priceGel: 4.00, unit: '500мл', pricePerUnit: 8.00, source: 'carrefour', lastUpdated: '2026-01-30', confidence: 85 },
];

// === SERVICE CLASS ===

const PRICES_STORAGE_KEY = 'georgia_prices_db';
const PRICES_UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 дней

export class GeorgiaPricesService {
  private static instance: GeorgiaPricesService;
  private database: PriceDatabase;

  private constructor() {
    this.database = this.loadDatabase();
  }

  static getInstance(): GeorgiaPricesService {
    if (!GeorgiaPricesService.instance) {
      GeorgiaPricesService.instance = new GeorgiaPricesService();
    }
    return GeorgiaPricesService.instance;
  }

  private loadDatabase(): PriceDatabase {
    try {
      const stored = localStorage.getItem(PRICES_STORAGE_KEY);
      if (stored) {
        const db = JSON.parse(stored) as PriceDatabase;
        const lastUpdate = new Date(db.lastFullUpdate).getTime();
        if (Date.now() - lastUpdate < PRICES_UPDATE_INTERVAL) {
          return db;
        }
      }
    } catch (e) {
      console.error('Error loading price database:', e);
    }
    return this.createInitialDatabase();
  }

  private createInitialDatabase(): PriceDatabase {
    // Объединяем базовые (~100) и расширенные (~400) продукты = ~500
    const allProducts = [...BASE_PRICES, ...EXTENDED_PRICES];

    const db: PriceDatabase = {
      version: '1.0.0',
      lastFullUpdate: new Date().toISOString(),
      country: 'GE',
      currency: 'GEL',
      products: allProducts
    };
    this.saveDatabase(db);
    return db;
  }

  private saveDatabase(db: PriceDatabase): void {
    try {
      localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Error saving price database:', e);
    }
  }

  getAllProducts(): ProductPrice[] {
    return this.database.products;
  }

  getByCategory(category: PriceCategory): ProductPrice[] {
    return this.database.products.filter(p => p.category === category);
  }

  findProduct(query: string): ProductPrice | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Точное совпадение
    let match = this.database.products.find(p =>
      p.name.toLowerCase() === normalizedQuery ||
      p.nameEn.toLowerCase() === normalizedQuery ||
      p.nameKa?.toLowerCase() === normalizedQuery
    );
    if (match) return match;

    // Частичное совпадение
    match = this.database.products.find(p =>
      p.name.toLowerCase().includes(normalizedQuery) ||
      p.nameEn.toLowerCase().includes(normalizedQuery) ||
      normalizedQuery.includes(p.name.toLowerCase()) ||
      normalizedQuery.includes(p.nameEn.toLowerCase())
    );
    return match || null;
  }

  searchProducts(query: string, limit: number = 10): ProductPrice[] {
    const normalizedQuery = query.toLowerCase().trim();
    return this.database.products
      .filter(p =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.nameEn.toLowerCase().includes(normalizedQuery) ||
        p.nameKa?.toLowerCase().includes(normalizedQuery)
      )
      .slice(0, limit);
  }

  updateUserPrice(productId: string, price: number, unit?: string): void {
    const index = this.database.products.findIndex(p => p.id === productId);
    if (index >= 0) {
      this.database.products[index].priceGel = price;
      this.database.products[index].source = 'user';
      this.database.products[index].lastUpdated = new Date().toISOString();
      this.database.products[index].confidence = 100;
      if (unit) this.database.products[index].unit = unit;
    }
    this.saveDatabase(this.database);
  }

  addProduct(product: Omit<ProductPrice, 'lastUpdated' | 'confidence'>): void {
    const newProduct: ProductPrice = {
      ...product,
      lastUpdated: new Date().toISOString(),
      confidence: product.source === 'user' ? 100 : 70
    };
    this.database.products.push(newProduct);
    this.saveDatabase(this.database);
  }

  getPrice(productId: string, quantity?: number, unit?: string): number | null {
    const product = this.database.products.find(p => p.id === productId);
    if (!product) return null;
    if (!quantity) return product.priceGel;

    const baseUnit = this.parseUnit(product.unit);
    const targetUnit = unit ? this.parseUnit(unit) : baseUnit;

    if (baseUnit.type === targetUnit.type) {
      const ratio = quantity / baseUnit.value;
      return product.priceGel * ratio;
    }
    return product.priceGel;
  }

  private parseUnit(unit: string): { value: number; type: string } {
    const match = unit.match(/^(\d+(?:\.\d+)?)\s*(кг|г|л|мл|шт|пак)/i);
    if (match) {
      let value = parseFloat(match[1]);
      let type = match[2].toLowerCase();
      if (type === 'г') { value /= 1000; type = 'кг'; }
      if (type === 'мл') { value /= 1000; type = 'л'; }
      return { value, type };
    }
    return { value: 1, type: unit };
  }

  getStats(): { total: number; byCategory: Record<PriceCategory, number>; lastUpdate: string } {
    const byCategory = {} as Record<PriceCategory, number>;
    for (const product of this.database.products) {
      byCategory[product.category] = (byCategory[product.category] || 0) + 1;
    }
    return {
      total: this.database.products.length,
      byCategory,
      lastUpdate: this.database.lastFullUpdate
    };
  }

  needsUpdate(): boolean {
    const lastUpdate = new Date(this.database.lastFullUpdate).getTime();
    return Date.now() - lastUpdate >= PRICES_UPDATE_INTERVAL;
  }

  forceUpdate(newProducts: ProductPrice[]): void {
    const userPrices = this.database.products.filter(p => p.source === 'user');
    this.database.products = [...newProducts];

    for (const userPrice of userPrices) {
      const index = this.database.products.findIndex(p => p.id === userPrice.id);
      if (index >= 0) {
        this.database.products[index] = userPrice;
      } else {
        this.database.products.push(userPrice);
      }
    }

    this.database.lastFullUpdate = new Date().toISOString();
    this.saveDatabase(this.database);
  }
}

export const georgiaPrices = GeorgiaPricesService.getInstance();
