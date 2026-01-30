/**
 * Currency Service - обновление курсов валют
 * Источник: Open Exchange Rates (через exchangerate.host)
 */

// Валюты которые мы поддерживаем
const SUPPORTED_CURRENCIES = ['EUR', 'GEL', 'RUB', 'UAH', 'TRY', 'AMD', 'AZN'];

/**
 * Получить актуальные курсы валют к USD
 * Пробуем несколько API
 */
async function fetchRates() {
    // API 1: exchangerate.host (бесплатный)
    try {
        const response = await fetch('https://api.exchangerate.host/latest?base=USD');
        if (response.ok) {
            const data = await response.json();
            if (data.rates) {
                const filtered = {};
                for (const code of SUPPORTED_CURRENCIES) {
                    if (data.rates[code]) {
                        filtered[code] = data.rates[code];
                    }
                }
                if (Object.keys(filtered).length > 0) {
                    console.log('[Currency] Using exchangerate.host');
                    return filtered;
                }
            }
        }
    } catch (e) {
        console.warn('[Currency] exchangerate.host failed:', e.message);
    }

    // API 2: frankfurter.app (для основных валют)
    let apiRates = {};
    try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (response.ok) {
            const data = await response.json();
            if (data.rates) {
                console.log('[Currency] Using frankfurter.app');
                apiRates = data.rates;
            }
        }
    } catch (e) {
        console.warn('[Currency] frankfurter.app failed:', e.message);
    }

    // Экзотические валюты - используем приблизительные курсы
    // (обновляются реже, но лучше чем ничего)
    const exoticRates = {
        GEL: 2.72,   // Georgian Lari
        RUB: 96.5,   // Russian Ruble (санкции, нет в API)
        UAH: 41.5,   // Ukrainian Hryvnia
        AMD: 390.0,  // Armenian Dram
        AZN: 1.7     // Azerbaijani Manat
    };

    // Объединяем: API rates + экзотические
    const combined = {};
    for (const code of SUPPORTED_CURRENCIES) {
        if (apiRates[code]) {
            combined[code] = apiRates[code];
        } else if (exoticRates[code]) {
            combined[code] = exoticRates[code];
        }
    }

    console.log('[Currency] Combined rates:', combined);
    return combined;
}

/**
 * Обновить курсы в БД
 */
async function updateRatesInDb(pool) {
    console.log('[Currency] Fetching latest rates...');

    const rates = await fetchRates();
    if (!rates) {
        console.error('[Currency] Failed to fetch rates');
        return false;
    }

    console.log('[Currency] Rates received:', rates);

    try {
        for (const [code, rate] of Object.entries(rates)) {
            await pool.query(`
                UPDATE currencies
                SET rate_to_usd = $1, updated_at = CURRENT_TIMESTAMP
                WHERE code = $2
            `, [rate, code]);
        }

        // USD всегда 1
        await pool.query(`
            UPDATE currencies
            SET rate_to_usd = 1.0, updated_at = CURRENT_TIMESTAMP
            WHERE code = 'USD'
        `);

        console.log('[Currency] Rates updated successfully');
        return true;
    } catch (error) {
        console.error('[Currency] Error updating rates in DB:', error);
        return false;
    }
}

/**
 * Инициализация cron job для обновления курсов
 * Запускается каждое воскресенье в 3:00
 */
function initCurrencyUpdater(pool) {
    const cron = require('node-cron');

    // Каждое воскресенье в 03:00
    cron.schedule('0 3 * * 0', async () => {
        console.log('[Currency] Weekly update started');
        await updateRatesInDb(pool);
    });

    // Также обновляем при старте сервера (если прошло больше недели)
    checkAndUpdateOnStartup(pool);

    console.log('[Currency] Cron job scheduled: every Sunday at 03:00');
}

/**
 * Проверить и обновить курсы при старте если устарели
 */
async function checkAndUpdateOnStartup(pool) {
    try {
        const result = await pool.query(`
            SELECT MIN(updated_at) as oldest_update
            FROM currencies
        `);

        const oldestUpdate = result.rows[0]?.oldest_update;
        if (!oldestUpdate) {
            await updateRatesInDb(pool);
            return;
        }

        const daysSinceUpdate = (Date.now() - new Date(oldestUpdate).getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceUpdate > 7) {
            console.log(`[Currency] Rates are ${Math.floor(daysSinceUpdate)} days old, updating...`);
            await updateRatesInDb(pool);
        } else {
            console.log(`[Currency] Rates are fresh (${Math.floor(daysSinceUpdate)} days old)`);
        }
    } catch (error) {
        console.error('[Currency] Startup check error:', error);
    }
}

module.exports = {
    fetchRates,
    updateRatesInDb,
    initCurrencyUpdater
};
