'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'motion/react';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pricing() {
  const t = useTranslations('pricing');
  const locale = useLocale();

  const freeFeatures = t.raw('free.features') as string[];
  const proFeatures = t.raw('pro.features') as string[];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-4xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">{t('title')}</h2>
          <p className="text-xl text-[var(--foreground-muted)]">{t('subtitle')}</p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Free tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8"
          >
            <h3 className="mb-2 text-2xl font-bold">{t('free.name')}</h3>
            <p className="mb-6 text-[var(--foreground-muted)]">{t('free.subtitle')}</p>

            <div className="mb-8">
              <span className="text-5xl font-bold">{t('free.price')}</span>
              <span className="text-[var(--foreground-muted)]">
                /{t('free.period')}
              </span>
            </div>

            <ul className="mb-8 space-y-3 text-sm">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#download" className="block">
              <Button variant="secondary" className="w-full">
                {t('free.cta')}
              </Button>
            </Link>
          </motion.div>

          {/* Pro tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-orange-500/10 p-8"
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 text-sm font-bold text-black">
              {t('pro.badge')}
            </div>

            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold">{t('pro.name')}</h3>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="mb-6 text-[var(--foreground-muted)]">{t('pro.subtitle')}</p>

            <div className="mb-8">
              <span className="text-5xl font-bold">{t('pro.price')}</span>
              <span className="text-[var(--foreground-muted)]">
                /{t('pro.period')}
              </span>
            </div>

            <ul className="mb-8 space-y-3 text-sm">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-yellow-500" />
                  <span className={i === 0 ? '' : 'font-medium'}>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#download" className="block">
              <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400">
                {t('pro.cta')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
