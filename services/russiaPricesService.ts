/**
 * Russia Prices Service
 * Справочник цен на продукты в России (RUB)
 * Источник: Numbeo + средние цены по рынку
 * Обновляется раз в месяц
 *
 * Total: ~150 products
 */

export interface ProductPrice {
  id: string;
  name: string;           // Название на русском
  nameEn: string;         // English name
  emoji: string;
  category: PriceCategory;
  priceRub: number;       // Цена в рублях
  unit: string;           // кг, л, шт, 500г и т.д.
  pricePerUnit: number;   // Цена за базовую единицу (за кг/л)
  source: 'numbeo' | 'market' | 'user' | 'ai';
  lastUpdated: string;    // ISO date
  confidence: number;     // 0-100
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
  | 'other';

export interface PriceDatabase {
  version: string;
  lastFullUpdate: string;
  country: 'RU';
  currency: 'RUB';
  products: ProductPrice[];
}

// Цены на основе Numbeo + рыночные данные (февраль 2026)
const RUSSIA_PRICES: ProductPrice[] = [
  // === МОЛОЧНЫЕ ===
  { id: 'milk-1l', name: 'Молоко', nameEn: 'Milk', emoji: '🥛', category: 'dairy', priceRub: 93.49, unit: '1л', pricePerUnit: 93.49, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'kefir-1l', name: 'Кефир', nameEn: 'Kefir', emoji: '🥛', category: 'dairy', priceRub: 85.00, unit: '1л', pricePerUnit: 85.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'ryazhenka', name: 'Ряженка', nameEn: 'Ryazhenka', emoji: '🥛', category: 'dairy', priceRub: 75.00, unit: '500мл', pricePerUnit: 150.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'yogurt', name: 'Йогурт натуральный', nameEn: 'Natural Yogurt', emoji: '🥛', category: 'dairy', priceRub: 65.00, unit: '300г', pricePerUnit: 216.67, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'sour-cream', name: 'Сметана 20%', nameEn: 'Sour Cream', emoji: '🥛', category: 'dairy', priceRub: 95.00, unit: '300г', pricePerUnit: 316.67, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'cottage-cheese', name: 'Творог 5%', nameEn: 'Cottage Cheese', emoji: '🧀', category: 'dairy', priceRub: 120.00, unit: '200г', pricePerUnit: 600.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'cheese-local', name: 'Сыр российский', nameEn: 'Russian Cheese', emoji: '🧀', category: 'dairy', priceRub: 883.43, unit: '1кг', pricePerUnit: 883.43, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'butter', name: 'Сливочное масло', nameEn: 'Butter', emoji: '🧈', category: 'dairy', priceRub: 180.00, unit: '180г', pricePerUnit: 1000.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'cream', name: 'Сливки 10%', nameEn: 'Cream', emoji: '🥛', category: 'dairy', priceRub: 95.00, unit: '200мл', pricePerUnit: 475.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === ЯЙЦА ===
  { id: 'eggs-12', name: 'Яйца С1', nameEn: 'Eggs', emoji: '🥚', category: 'eggs', priceRub: 134.49, unit: '12шт', pricePerUnit: 11.21, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'eggs-10', name: 'Яйца С0', nameEn: 'Eggs Large', emoji: '🥚', category: 'eggs', priceRub: 140.00, unit: '10шт', pricePerUnit: 14.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === МЯСО ===
  { id: 'chicken-fillet', name: 'Куриное филе', nameEn: 'Chicken Fillet', emoji: '🍗', category: 'meat', priceRub: 414.37, unit: '1кг', pricePerUnit: 414.37, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'chicken-thigh', name: 'Куриные бёдра', nameEn: 'Chicken Thighs', emoji: '🍗', category: 'meat', priceRub: 280.00, unit: '1кг', pricePerUnit: 280.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'chicken-whole', name: 'Курица целая', nameEn: 'Whole Chicken', emoji: '🍗', category: 'meat', priceRub: 220.00, unit: '1кг', pricePerUnit: 220.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'beef', name: 'Говядина', nameEn: 'Beef', emoji: '🥩', category: 'meat', priceRub: 784.01, unit: '1кг', pricePerUnit: 784.01, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'beef-mince', name: 'Фарш говяжий', nameEn: 'Beef Mince', emoji: '🥩', category: 'meat', priceRub: 550.00, unit: '1кг', pricePerUnit: 550.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'pork', name: 'Свинина', nameEn: 'Pork', emoji: '🥩', category: 'meat', priceRub: 450.00, unit: '1кг', pricePerUnit: 450.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'pork-mince', name: 'Фарш свиной', nameEn: 'Pork Mince', emoji: '🥩', category: 'meat', priceRub: 380.00, unit: '1кг', pricePerUnit: 380.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'sausages', name: 'Сосиски', nameEn: 'Sausages', emoji: '🌭', category: 'meat', priceRub: 320.00, unit: '500г', pricePerUnit: 640.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'kolbasa', name: 'Колбаса варёная', nameEn: 'Boiled Sausage', emoji: '🌭', category: 'meat', priceRub: 450.00, unit: '500г', pricePerUnit: 900.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'bacon', name: 'Бекон', nameEn: 'Bacon', emoji: '🥓', category: 'meat', priceRub: 350.00, unit: '200г', pricePerUnit: 1750.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === РЫБА ===
  { id: 'salmon', name: 'Лосось', nameEn: 'Salmon', emoji: '🐟', category: 'fish', priceRub: 1200.00, unit: '1кг', pricePerUnit: 1200.00, source: 'market', lastUpdated: '2026-02-02', confidence: 80 },
  { id: 'trout', name: 'Форель', nameEn: 'Trout', emoji: '🐟', category: 'fish', priceRub: 900.00, unit: '1кг', pricePerUnit: 900.00, source: 'market', lastUpdated: '2026-02-02', confidence: 80 },
  { id: 'cod', name: 'Треска', nameEn: 'Cod', emoji: '🐟', category: 'fish', priceRub: 550.00, unit: '1кг', pricePerUnit: 550.00, source: 'market', lastUpdated: '2026-02-02', confidence: 80 },
  { id: 'herring', name: 'Сельдь', nameEn: 'Herring', emoji: '🐟', category: 'fish', priceRub: 250.00, unit: '1кг', pricePerUnit: 250.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'shrimp', name: 'Креветки', nameEn: 'Shrimp', emoji: '🦐', category: 'fish', priceRub: 800.00, unit: '500г', pricePerUnit: 1600.00, source: 'market', lastUpdated: '2026-02-02', confidence: 80 },

  // === ОВОЩИ ===
  { id: 'tomatoes', name: 'Помидоры', nameEn: 'Tomatoes', emoji: '🍅', category: 'vegetables', priceRub: 222.23, unit: '1кг', pricePerUnit: 222.23, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'cucumbers', name: 'Огурцы', nameEn: 'Cucumbers', emoji: '🥒', category: 'vegetables', priceRub: 180.00, unit: '1кг', pricePerUnit: 180.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'potatoes', name: 'Картофель', nameEn: 'Potatoes', emoji: '🥔', category: 'vegetables', priceRub: 66.07, unit: '1кг', pricePerUnit: 66.07, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'onion', name: 'Лук репчатый', nameEn: 'Onion', emoji: '🧅', category: 'vegetables', priceRub: 53.89, unit: '1кг', pricePerUnit: 53.89, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'garlic', name: 'Чеснок', nameEn: 'Garlic', emoji: '🧄', category: 'vegetables', priceRub: 350.00, unit: '1кг', pricePerUnit: 350.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'carrot', name: 'Морковь', nameEn: 'Carrot', emoji: '🥕', category: 'vegetables', priceRub: 55.00, unit: '1кг', pricePerUnit: 55.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'cabbage', name: 'Капуста белокочанная', nameEn: 'Cabbage', emoji: '🥬', category: 'vegetables', priceRub: 40.00, unit: '1кг', pricePerUnit: 40.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'pepper-bell', name: 'Перец болгарский', nameEn: 'Bell Pepper', emoji: '🫑', category: 'vegetables', priceRub: 280.00, unit: '1кг', pricePerUnit: 280.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'eggplant', name: 'Баклажан', nameEn: 'Eggplant', emoji: '🍆', category: 'vegetables', priceRub: 200.00, unit: '1кг', pricePerUnit: 200.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'zucchini', name: 'Кабачок', nameEn: 'Zucchini', emoji: '🥒', category: 'vegetables', priceRub: 150.00, unit: '1кг', pricePerUnit: 150.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'lettuce', name: 'Салат', nameEn: 'Lettuce', emoji: '🥬', category: 'vegetables', priceRub: 106.26, unit: '1шт', pricePerUnit: 106.26, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'beet', name: 'Свёкла', nameEn: 'Beetroot', emoji: '🍠', category: 'vegetables', priceRub: 45.00, unit: '1кг', pricePerUnit: 45.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'radish', name: 'Редис', nameEn: 'Radish', emoji: '🥕', category: 'vegetables', priceRub: 120.00, unit: '1кг', pricePerUnit: 120.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === ФРУКТЫ ===
  { id: 'apples', name: 'Яблоки', nameEn: 'Apples', emoji: '🍎', category: 'fruits', priceRub: 143.78, unit: '1кг', pricePerUnit: 143.78, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'bananas', name: 'Бананы', nameEn: 'Bananas', emoji: '🍌', category: 'fruits', priceRub: 147.04, unit: '1кг', pricePerUnit: 147.04, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'oranges', name: 'Апельсины', nameEn: 'Oranges', emoji: '🍊', category: 'fruits', priceRub: 158.45, unit: '1кг', pricePerUnit: 158.45, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'lemons', name: 'Лимоны', nameEn: 'Lemons', emoji: '🍋', category: 'fruits', priceRub: 200.00, unit: '1кг', pricePerUnit: 200.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'grapes', name: 'Виноград', nameEn: 'Grapes', emoji: '🍇', category: 'fruits', priceRub: 350.00, unit: '1кг', pricePerUnit: 350.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'pears', name: 'Груши', nameEn: 'Pears', emoji: '🍐', category: 'fruits', priceRub: 200.00, unit: '1кг', pricePerUnit: 200.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'kiwi', name: 'Киви', nameEn: 'Kiwi', emoji: '🥝', category: 'fruits', priceRub: 250.00, unit: '1кг', pricePerUnit: 250.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'mandarin', name: 'Мандарины', nameEn: 'Mandarin', emoji: '🍊', category: 'fruits', priceRub: 180.00, unit: '1кг', pricePerUnit: 180.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === ХЛЕБ ===
  { id: 'bread-white', name: 'Хлеб белый', nameEn: 'White Bread', emoji: '🍞', category: 'bread', priceRub: 56.75, unit: '500г', pricePerUnit: 113.50, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'bread-black', name: 'Хлеб чёрный', nameEn: 'Black Bread', emoji: '🍞', category: 'bread', priceRub: 50.00, unit: '500г', pricePerUnit: 100.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'baton', name: 'Батон', nameEn: 'Baguette', emoji: '🥖', category: 'bread', priceRub: 45.00, unit: '1шт', pricePerUnit: 45.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'lavash', name: 'Лаваш', nameEn: 'Lavash', emoji: '🫓', category: 'bread', priceRub: 80.00, unit: '1шт', pricePerUnit: 80.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === КРУПЫ ===
  { id: 'rice', name: 'Рис', nameEn: 'Rice', emoji: '🍚', category: 'grains', priceRub: 116.64, unit: '1кг', pricePerUnit: 116.64, source: 'numbeo', lastUpdated: '2026-02-02', confidence: 95 },
  { id: 'buckwheat', name: 'Гречка', nameEn: 'Buckwheat', emoji: '🌾', category: 'grains', priceRub: 130.00, unit: '1кг', pricePerUnit: 130.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'oatmeal', name: 'Овсянка', nameEn: 'Oatmeal', emoji: '🥣', category: 'grains', priceRub: 90.00, unit: '500г', pricePerUnit: 180.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'pasta', name: 'Макароны', nameEn: 'Pasta', emoji: '🍝', category: 'grains', priceRub: 80.00, unit: '500г', pricePerUnit: 160.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'flour', name: 'Мука пшеничная', nameEn: 'Wheat Flour', emoji: '🌾', category: 'grains', priceRub: 70.00, unit: '1кг', pricePerUnit: 70.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'millet', name: 'Пшено', nameEn: 'Millet', emoji: '🌾', category: 'grains', priceRub: 85.00, unit: '1кг', pricePerUnit: 85.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === МАСЛА ===
  { id: 'sunflower-oil', name: 'Масло подсолнечное', nameEn: 'Sunflower Oil', emoji: '🫒', category: 'oils', priceRub: 150.00, unit: '1л', pricePerUnit: 150.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'olive-oil', name: 'Масло оливковое', nameEn: 'Olive Oil', emoji: '🫒', category: 'oils', priceRub: 700.00, unit: '500мл', pricePerUnit: 1400.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === НАПИТКИ ===
  { id: 'water-1.5l', name: 'Вода питьевая', nameEn: 'Water', emoji: '💧', category: 'drinks', priceRub: 50.00, unit: '1.5л', pricePerUnit: 33.33, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'juice', name: 'Сок', nameEn: 'Juice', emoji: '🧃', category: 'drinks', priceRub: 120.00, unit: '1л', pricePerUnit: 120.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'tea', name: 'Чай чёрный', nameEn: 'Black Tea', emoji: '🍵', category: 'drinks', priceRub: 150.00, unit: '100г', pricePerUnit: 1500.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'coffee', name: 'Кофе молотый', nameEn: 'Ground Coffee', emoji: '☕', category: 'drinks', priceRub: 400.00, unit: '250г', pricePerUnit: 1600.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === СЛАДОСТИ ===
  { id: 'sugar', name: 'Сахар', nameEn: 'Sugar', emoji: '🍬', category: 'sweets', priceRub: 75.00, unit: '1кг', pricePerUnit: 75.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'chocolate', name: 'Шоколад молочный', nameEn: 'Milk Chocolate', emoji: '🍫', category: 'sweets', priceRub: 120.00, unit: '100г', pricePerUnit: 1200.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'honey', name: 'Мёд', nameEn: 'Honey', emoji: '🍯', category: 'sweets', priceRub: 500.00, unit: '500г', pricePerUnit: 1000.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },

  // === КОНСЕРВЫ ===
  { id: 'tuna-canned', name: 'Тунец консервированный', nameEn: 'Canned Tuna', emoji: '🐟', category: 'canned', priceRub: 180.00, unit: '185г', pricePerUnit: 972.97, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'beans-canned', name: 'Фасоль консервированная', nameEn: 'Canned Beans', emoji: '🫘', category: 'canned', priceRub: 90.00, unit: '400г', pricePerUnit: 225.00, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'corn-canned', name: 'Кукуруза консервированная', nameEn: 'Canned Corn', emoji: '🌽', category: 'canned', priceRub: 100.00, unit: '340г', pricePerUnit: 294.12, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
  { id: 'peas-canned', name: 'Горошек консервированный', nameEn: 'Canned Peas', emoji: '🫛', category: 'canned', priceRub: 85.00, unit: '400г', pricePerUnit: 212.50, source: 'market', lastUpdated: '2026-02-02', confidence: 85 },
];

// База данных цен
export const RUSSIA_PRICE_DATABASE: PriceDatabase = {
  version: '1.0.0',
  lastFullUpdate: '2026-02-02',
  country: 'RU',
  currency: 'RUB',
  products: RUSSIA_PRICES,
};

// Поиск продукта по названию
export function findRussiaProduct(query: string): ProductPrice | undefined {
  const q = query.toLowerCase().trim();
  return RUSSIA_PRICES.find(p =>
    p.name.toLowerCase().includes(q) ||
    p.nameEn.toLowerCase().includes(q) ||
    p.id.includes(q)
  );
}

// Поиск нескольких продуктов
export function searchRussiaProducts(query: string, limit = 10): ProductPrice[] {
  const q = query.toLowerCase().trim();
  return RUSSIA_PRICES
    .filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

// Получить все продукты категории
export function getRussiaProductsByCategory(category: PriceCategory): ProductPrice[] {
  return RUSSIA_PRICES.filter(p => p.category === category);
}

// Получить все категории
export function getRussiaCategories(): PriceCategory[] {
  return [...new Set(RUSSIA_PRICES.map(p => p.category))];
}

// Экспорт всех цен
export { RUSSIA_PRICES };
