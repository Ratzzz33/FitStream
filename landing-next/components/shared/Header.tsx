'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Menu, X, Sun, Moon, ChevronDown, Zap } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export function Header() {
  const t = useTranslations('nav');
  const locale = useLocale() as Locale;
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const navLinks = [
    { href: '#features', label: t('features') },
    { href: '#pricing', label: t('pricing') },
    { href: '#download', label: t('download') },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="gradient-text text-xl font-bold">FitStream</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            >
              {link.label}
            </a>
          ))}

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-2 rounded-full bg-[var(--card)] px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--card-hover)]"
            >
              <span>
                {localeFlags[locale]} {locale.toUpperCase()}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] py-2 shadow-xl">
                {locales.map((l) => (
                  <Link
                    key={l}
                    href={`/${l}`}
                    onClick={() => setLangMenuOpen(false)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-[var(--card-hover)] ${
                      locale === l ? 'bg-blue-600/10 text-blue-600' : ''
                    }`}
                  >
                    <span>{localeFlags[l]}</span>
                    <span>{localeNames[l]}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 transition hover:bg-[var(--card)]"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </nav>

        {/* CTA Button */}
        <Link
          href="#download"
          className="hidden rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-blue-400 md:block"
        >
          {t('getStarted')}
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 transition hover:bg-[var(--card)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium"
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={toggleTheme}
                className="rounded-full p-2 transition hover:bg-[var(--card)]"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
              <select
                value={locale}
                onChange={(e) => {
                  window.location.href = `/${e.target.value}`;
                }}
                className="rounded-lg bg-[var(--card)] px-3 py-2"
              >
                {locales.map((l) => (
                  <option key={l} value={l}>
                    {localeFlags[l]} {localeNames[l]}
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-3 text-center font-semibold text-white"
            >
              {t('getStarted')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
