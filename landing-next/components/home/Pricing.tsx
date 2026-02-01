'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Check, Zap, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pricing() {
  const t = useTranslations('pricing');

  const trialFeatures = t.raw('trial.features') as string[];
  const scanPrices = t.raw('payPerUse.prices') as { action: string; price: string }[];

  return (
    <section id="pricing" className="py-24 px-6 bg-[var(--background-subtle)]">
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

        {/* Two column pricing */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-teal-500/10 p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-6 w-6 text-emerald-500" />
              <h3 className="text-2xl font-bold">{t('trial.name')}</h3>
            </div>

            <div className="mb-6">
              <span className="text-5xl font-bold text-emerald-500">{t('trial.days')}</span>
              <span className="ml-2 text-xl text-[var(--foreground-muted)]">{t('trial.period')}</span>
            </div>

            <ul className="mb-8 space-y-3 text-sm">
              {trialFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#download" className="block">
              <Button variant="secondary" className="w-full border-emerald-500/50 hover:bg-emerald-500/10">
                {t('trial.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>

          {/* Pay Per Use - Featured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-orange-500/10 p-8"
          >
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 text-sm font-bold text-black">
              {t('payPerUse.badge')}
            </div>

            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-6 w-6 text-yellow-500" />
              <h3 className="text-2xl font-bold">{t('payPerUse.name')}</h3>
            </div>
            <p className="mb-6 text-[var(--foreground-muted)]">{t('payPerUse.subtitle')}</p>

            {/* Prices table */}
            <div className="mb-6 rounded-xl bg-black/20 p-4">
              <div className="space-y-3">
                {scanPrices.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{item.action}</span>
                    <span className="font-bold text-emerald-400">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key points */}
            <ul className="mb-6 space-y-2 text-sm text-[var(--foreground-muted)]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-yellow-500" />
                {t('payPerUse.noSubscription')}
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-yellow-500" />
                {t('topUp.simple')}
              </li>
            </ul>

            <Link href="#download" className="block">
              <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400">
                {t('payPerUse.cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Credit limit note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-[var(--foreground-muted)]"
        >
          {t('creditLimit')}
        </motion.p>
      </div>
    </section>
  );
}
