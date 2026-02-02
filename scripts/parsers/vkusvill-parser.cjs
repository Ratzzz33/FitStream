/**
 * VkusVill Parser
 * Парсит каталог ВкусВилл для получения цен и КБЖУ
 * Запускается раз в неделю через GitHub Actions
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Категории для парсинга (основные продукты)
const CATEGORIES = [
  { slug: 'molochnye-produkty-yaytso', name: 'Молочные продукты' },
  { slug: 'myaso-ptitsa', name: 'Мясо, птица' },
  { slug: 'ryba-ikra-i-moreprodukty', name: 'Рыба, морепродукты' },
  { slug: 'ovoshchi-frukty-yagody-zelen-griby', name: 'Овощи, фрукты' },
  { slug: 'khleb-vypechka', name: 'Хлеб, выпечка' },
  { slug: 'krupy-makarony-muka', name: 'Крупы, макароны' },
  { slug: 'maslo-syr', name: 'Масло, сыр' },
  { slug: 'napitki', name: 'Напитки' },
];

const BASE_URL = 'https://vkusvill.ru';
const OUTPUT_FILE = path.join(__dirname, '../../services/russiaPricesService.ts');

// Задержка между запросами (мс)
const DELAY = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FitStreamBot/1.0; +https://fitstream.health)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Извлечь продукты из HTML страницы категории
function parseProductsFromHtml(html) {
  const products = [];

  // Ищем JSON с товарами (VkusVill обычно встраивает данные в script)
  const jsonMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s);

  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      // Структура может отличаться, нужно адаптировать
      if (data.goods && data.goods.items) {
        return data.goods.items.map(item => ({
          id: item.id,
          name: item.title,
          price: item.price,
          unit: item.measure,
          weight: item.weight,
          kkal: item.kkal,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
        }));
      }
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  }

  // Fallback: парсим HTML напрямую
  const productRegex = /<article[^>]*class="[^"]*ProductCard[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
  const nameRegex = /class="[^"]*ProductCard__title[^"]*"[^>]*>([^<]+)/i;
  const priceRegex = /class="[^"]*Price[^"]*"[^>]*>(\d+)/i;
  const weightRegex = /class="[^"]*ProductCard__weight[^"]*"[^>]*>([^<]+)/i;

  let match;
  while ((match = productRegex.exec(html)) !== null) {
    const card = match[1];
    const name = nameRegex.exec(card)?.[1]?.trim();
    const price = priceRegex.exec(card)?.[1];
    const weight = weightRegex.exec(card)?.[1]?.trim();

    if (name && price) {
      products.push({
        name,
        price: parseInt(price),
        unit: weight || 'шт',
      });
    }
  }

  return products;
}

async function parseCategory(category) {
  console.log(`Парсинг категории: ${category.name}`);
  const url = `${BASE_URL}/goods/${category.slug}/`;

  try {
    const html = await fetchPage(url);
    const products = parseProductsFromHtml(html);
    console.log(`  Найдено товаров: ${products.length}`);
    return products.map(p => ({ ...p, category: category.name }));
  } catch (e) {
    console.error(`  Ошибка: ${e.message}`);
    return [];
  }
}

function generateTypeScript(products) {
  const today = new Date().toISOString().split('T')[0];

  const productLines = products.map(p => {
    const id = p.name.toLowerCase()
      .replace(/[^а-яa-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);

    return `  { id: '${id}', name: '${p.name.replace(/'/g, "\\'")}', price: ${p.price}, unit: '${p.unit}', category: '${p.category}', source: 'vkusvill', lastUpdated: '${today}' },`;
  }).join('\n');

  return `/**
 * Russia Prices Service (VkusVill)
 * Автоматически сгенерировано парсером
 * Последнее обновление: ${today}
 */

export interface RussiaProduct {
  id: string;
  name: string;
  price: number;      // Цена в рублях
  unit: string;       // кг, л, шт, г
  category: string;
  kkal?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  source: 'vkusvill' | 'user';
  lastUpdated: string;
}

export const RUSSIA_PRODUCTS: RussiaProduct[] = [
${productLines}
];

export function findProduct(query: string): RussiaProduct | undefined {
  const q = query.toLowerCase();
  return RUSSIA_PRODUCTS.find(p =>
    p.name.toLowerCase().includes(q) ||
    p.id.includes(q)
  );
}

export function getProductsByCategory(category: string): RussiaProduct[] {
  return RUSSIA_PRODUCTS.filter(p => p.category === category);
}
`;
}

async function main() {
  console.log('=== VkusVill Parser ===');
  console.log(`Дата: ${new Date().toISOString()}`);
  console.log('');

  const allProducts = [];

  for (const category of CATEGORIES) {
    const products = await parseCategory(category);
    allProducts.push(...products);
    await sleep(DELAY);
  }

  console.log('');
  console.log(`Всего товаров: ${allProducts.length}`);

  if (allProducts.length > 0) {
    const tsContent = generateTypeScript(allProducts);
    fs.writeFileSync(OUTPUT_FILE, tsContent);
    console.log(`Сохранено в: ${OUTPUT_FILE}`);
  } else {
    console.log('Товары не найдены, файл не обновлён');
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
