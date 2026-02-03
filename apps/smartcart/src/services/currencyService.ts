/**
 * Currency Service - unified currency formatting for SmartCart
 */

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'GBP' | 'KZT' | 'UAH' | 'GEL';

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
    symbol: '\u20BD',
    name: 'Russian Ruble',
    flag: '\uD83C\uDDF7\uD83C\uDDFA',
    locale: 'ru-RU',
    position: 'after',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '\uD83C\uDDFA\uD83C\uDDF8',
    locale: 'en-US',
    position: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '\u20AC',
    name: 'Euro',
    flag: '\uD83C\uDDEA\uD83C\uDDFA',
    locale: 'de-DE',
    position: 'after',
  },
  GBP: {
    code: 'GBP',
    symbol: '\u00A3',
    name: 'British Pound',
    flag: '\uD83C\uDDEC\uD83C\uDDE7',
    locale: 'en-GB',
    position: 'before',
  },
  KZT: {
    code: 'KZT',
    symbol: '\u20B8',
    name: 'Kazakhstani Tenge',
    flag: '\uD83C\uDDF0\uD83C\uDDFF',
    locale: 'kk-KZ',
    position: 'after',
  },
  UAH: {
    code: 'UAH',
    symbol: '\u20B4',
    name: 'Ukrainian Hryvnia',
    flag: '\uD83C\uDDFA\uD83C\uDDE6',
    locale: 'uk-UA',
    position: 'after',
  },
  GEL: {
    code: 'GEL',
    symbol: '\u20BE',
    name: 'Georgian Lari',
    flag: '\uD83C\uDDEC\uD83C\uDDEA',
    locale: 'ka-GE',
    position: 'after',
  },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'RUB';

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

export function getCurrencySymbol(currencyCode: CurrencyCode = DEFAULT_CURRENCY): string {
  return CURRENCIES[currencyCode]?.symbol || CURRENCIES[DEFAULT_CURRENCY].symbol;
}

export function getCurrencyConfig(currencyCode: CurrencyCode = DEFAULT_CURRENCY): CurrencyConfig {
  return CURRENCIES[currencyCode] || CURRENCIES[DEFAULT_CURRENCY];
}

export function getCurrencyList(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

export function detectCurrencyByLanguage(language: string): CurrencyCode {
  const langMap: Record<string, CurrencyCode> = {
    ru: 'RUB',
    en: 'USD',
    de: 'EUR',
    fr: 'EUR',
    es: 'EUR',
    uk: 'UAH',
    kk: 'KZT',
    ka: 'GEL',
  };
  const lang = language.split('-')[0].toLowerCase();
  return langMap[lang] || 'USD';
}
