'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Zap } from 'lucide-react';
import { type Locale } from '@/i18n/config';

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale() as Locale;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="gradient-text text-xl font-bold">FitStream</span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-[var(--foreground-muted)]">
          <Link
            href={`/${locale}/privacy`}
            className="transition hover:text-[var(--foreground)]"
          >
            {t('privacy')}
          </Link>
          <Link
            href={`/${locale}/terms`}
            className="transition hover:text-[var(--foreground)]"
          >
            {t('terms')}
          </Link>
          <a
            href="https://t.me/fitstreambot"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:text-[var(--foreground)]"
          >
            {t('contact')}
          </a>
        </div>

        {/* Copyright */}
        <p className="text-sm text-[var(--foreground-muted)]">
          © {year} FitStream. {t('rights')}
        </p>
      </div>
    </footer>
  );
}
