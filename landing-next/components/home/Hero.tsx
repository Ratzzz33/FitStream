'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const dynamicTitles = [
  'Track workouts with AI',
  'Scan food instantly',
  'Cook smarter',
  'Reach your goals',
];

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % dynamicTitles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left: Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-[var(--foreground-muted)]">
              {t('badge')}
            </span>
          </motion.div>

          {/* Main title */}
          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-6xl">
            <span>{t('title1')}</span>
            <br />
            <span className="gradient-text">{t('title2')}</span>
          </h1>

          {/* Dynamic subtitle */}
          <motion.p
            key={titleIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 text-2xl font-semibold text-blue-600"
          >
            {dynamicTitles[titleIndex]}
          </motion.p>

          {/* Description */}
          <p className="mb-10 max-w-xl text-xl text-[var(--foreground-muted)]">
            {t('description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <Link href="#download">
              <Button size="lg" className="w-full sm:w-auto">
                {t('downloadFree')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href={`https://app.fitstream.health`}>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                {t('tryWebApp')}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Right: Phone mockup placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mx-auto max-w-[280px] lg:mx-0 lg:ml-auto"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-blue-600 to-emerald-600 opacity-30 blur-3xl" />

          {/* Phone frame */}
          <div className="relative rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl">
            <div
              className="flex items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-600/10 to-emerald-600/10"
              style={{ aspectRatio: '9/18' }}
            >
              <div className="text-center">
                <div className="mb-4 text-6xl">📱</div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  Interactive demo
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
