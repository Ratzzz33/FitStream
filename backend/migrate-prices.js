/**
 * Миграция цен из TypeScript в PostgreSQL
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'fitstream-db.c1i8y8aqsodx.eu-central-1.rds.amazonaws.com',
  port: 5432,
  database: 'postgres',
  user: 'fitstream_admin',
  password: process.env.DB_PASSWORD || 'FitStream2024Secure!',
  ssl: { rejectUnauthorized: false }
});

// Парсим продукты из TypeScript
function extractProducts(content) {
  const products = [];
  const regex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*nameEn:\s*'([^']+)'(?:,\s*nameKa:\s*'([^']+)')?(?:,\s*emoji:\s*'([^']+)')?,\s*category:\s*'([^']+)',\s*priceGel:\s*([\d.]+),\s*unit:\s*'([^']+)',\s*pricePerUnit:\s*([\d.]+),\s*source:\s*'([^']+)',\s*lastUpdated:\s*'([^']+)',\s*confidence:\s*(\d+)\s*\}/g;

  let match;
  while ((match = regex.exec(content)) !== null) {
    products.push({
      id: match[1],
      name: match[2],
      nameEn: match[3],
      nameLocal: match[4] || null,
      emoji: match[5] || '📦',
      category: match[6],
      price: parseFloat(match[7]),
      unit: match[8],
      pricePerUnit: parseFloat(match[9]),
      source: match[10],
      confidence: parseInt(match[12])
    });
  }
  return products;
}

async function migrate() {
  // Читаем файлы
  const basePricesContent = fs.readFileSync(
    path.join(__dirname, '../services/georgiaPricesService.ts'),
    'utf8'
  );
  const extendedPricesContent = fs.readFileSync(
    path.join(__dirname, '../services/georgiaProductsExtended.ts'),
    'utf8'
  );

  const baseProducts = extractProducts(basePricesContent);
  const extendedProducts = extractProducts(extendedPricesContent);
  const allProducts = [...baseProducts, ...extendedProducts];

  console.log('Found products:', allProducts.length);

  await client.connect();
  console.log('Connected to database');

  let inserted = 0;
  let errors = 0;

  for (const p of allProducts) {
    try {
      await client.query(`
        INSERT INTO product_prices
          (id, name, name_en, name_local, emoji, category, price, currency_code, unit, price_per_unit, country_code, source, store_name, confidence)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, 'GEL', $8, $9, 'GE', $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          price = EXCLUDED.price,
          price_per_unit = EXCLUDED.price_per_unit,
          confidence = EXCLUDED.confidence,
          updated_at = CURRENT_TIMESTAMP
      `, [
        p.id,
        p.name,
        p.nameEn,
        p.nameLocal,
        p.emoji,
        p.category,
        p.price,
        p.unit,
        p.pricePerUnit,
        p.source,
        p.source === 'carrefour' ? 'Carrefour' :
          p.source === 'nikora' ? 'Nikora' :
          p.source === 'numbeo' ? 'Numbeo' : null,
        p.confidence
      ]);
      inserted++;
    } catch (e) {
      console.error('Error inserting', p.id, ':', e.message);
      errors++;
    }
  }

  console.log('Inserted/updated:', inserted, 'products');
  if (errors > 0) console.log('Errors:', errors);

  // Проверяем результат
  const result = await client.query('SELECT COUNT(*) as count FROM product_prices');
  console.log('Total products in DB:', result.rows[0].count);

  const currencies = await client.query('SELECT * FROM currencies');
  console.log('Currencies:', currencies.rows.map(c => c.code).join(', '));

  await client.end();
  console.log('Migration completed!');
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
