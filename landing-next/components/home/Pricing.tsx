'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Check, Zap, Gift, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pricing() {
  const t = useTranslations('pricing');

  const trialFeatures = t.raw('trial.features') as string[];
  const scanPrices = t.raw('payPerUse.prices') as { action: string; price: string }[];
  const packages = t.raw('topUp.packages') as { amount: string; bonus: string; price: string }[];

  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
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
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Free Trial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-teal-500/10 p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-6 w-6 text-emerald-500" />
              <h3 className="text-2xl font-bold">{t('trial.name')}</h3>
            </div>
            <p className="mb-6 text-[var(--foreground-muted)]">{t('trial.subtitle')}</p>

            <div className="mb-8">
              <span className="text-5xl font-bold text-emerald-500">{t('trial.days')}</span>
              <span className="ml-2 text-xl text-[var(--foreground-muted)]">{t('trial.period')}</span>
            </div>

            <ul className="mb-8 space-y-3 text-sm">
              {trialFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link href="#download" className="block">
              <Button variant="secondary" className="w-full border-emerald-500/50 hover:bg-emerald-500/10">
                {t('trial.cta')}
              </Button>
            </Link>
          </motion.div>

          {/* Pay Per Use */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl border border-yellow-500/30 bg-gradient-to-b from-yellow-500/10 to-orange-500/10 p-8"
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

            <div className="mb-6 rounded-xl bg-black/20 p-4">
              <p className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">{t('payPerUse.priceLabel')}</p>
              <div className="space-y-2">
                {scanPrices.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{item.action}</span>
                    <span className="font-bold text-yellow-500">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mb-6 text-center text-sm text-[var(--foreground-muted)]">
              {t('payPerUse.noSubscription')}
            </p>

            <Link href="#download" className="block">
              <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400">
                {t('payPerUse.cta')}
              </Button>
            </Link>
          </motion.div>

          {/* Top Up Packages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8"
          >
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="h-6 w-6 text-blue-500" />
              <h3 className="text-2xl font-bold">{t('topUp.name')}</h3>
            </div>
            <p className="mb-6 text-[var(--foreground-muted)]">{t('topUp.subtitle')}</p>

            <div className="mb-6 space-y-3">
              {packages.map((pkg, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl p-4 ${
                    i === 2
                      ? 'border-2 border-blue-500/50 bg-blue-500/10'
                      : 'border border-[var(--border)] bg-black/10'
                  }`}
                >
                  <div>
                    <span className="text-lg font-bold">{pkg.amount}</span>
                    {pkg.bonus && (
                      <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        {pkg.bonus}
                      </span>
                    )}
                  </div>
                  <span className="font-bold">{pkg.price}</span>
                </div>
              ))}
            </div>

            <p className="mb-6 text-center text-sm text-[var(--foreground-muted)]">
              {t('topUp.paypal')}
            </p>

            <Link href="#download" className="block">
              <Button variant="secondary" className="w-full">
                {t('topUp.cta')}
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
