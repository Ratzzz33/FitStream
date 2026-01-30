/**
 * Currency Service - единый сервис для работы с валютами
 */

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'GBP' | 'KZT' | 'UAH';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
  position: 'before' | 'after';
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Российский рубль',
    flag: '🇷🇺',
    locale: 'ru-RU',
    position: 'after',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    locale: 'en-US',
    position: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    locale: 'de-DE',
    position: 'after',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    locale: 'en-GB',
    position: 'before',
  },
  KZT: {
    code: 'KZT',
    symbol: '₸',
    name: 'Казахстанский тенге',
    flag: '🇰🇿',
    locale: 'kk-KZ',
    position: 'after',
  },
  UAH: {
    code: 'UAH',
    symbol: '₴',
    name: 'Українська гривня',
    flag: '🇺🇦',
    locale: 'uk-UA',
    position: 'after',
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'RUB';

/**
 * Форматирует сумму в выбранной валюте
 */
export function formatCurrency(amount: number, currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));

  return config.position === 'before'
    ? `${config.symbol}${formatted}`
    : `${formatted} ${config.symbol}`;
}

/**
 * Получает символ валюты
 */
export function getCurrencySymbol(currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  return CURRENCIES[currencyCode]?.symbol || CURRENCIES[DEFAULT_CURRENCY].symbol;
}

/**
 * Получает конфиг валюты
 */
export function getCurrencyConfig(currencyCode: CurrencyCode = DEFAULT_CURRENCY): CurrencyConfig {
  return CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
}

/**
 * Список всех валют для селектора
 */
export function getCurrencyList(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

/**
 * Определяет валюту по языку системы
 */
export function detectCurrencyByLanguage(language: string): CurrencyCode {
  const langMap: Record<string, CurrencyCode> = {
    ru: 'RUB',
    en: 'USD',
    de: 'EUR',
    fr: 'EUR',
    es: 'EUR',
    uk: 'UAH',
    kk: 'KZT',
  };
  const lang = language.split('-')[0].toLowerCase();
  return langMap[lang] || 'USD';
}
