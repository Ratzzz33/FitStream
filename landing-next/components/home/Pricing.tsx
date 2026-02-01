'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Check, Zap, Gift, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PACKAGE_PRICES = [5, 9, 20]; // Actual prices to pay
const PACKAGE_VALUES = [5, 10, 25]; // Token values received

export function Pricing() {
  const t = useTranslations('pricing');
  const [selectedPackage, setSelectedPackage] = useState(1); // Default to $10 package
  const [loading, setLoading] = useState(false);

  const trialFeatures = t.raw('trial.features') as string[];
  const scanPrices = t.raw('payPerUse.prices') as { action: string; price: string }[];
  const packages = t.raw('topUp.packages') as { amount: string; discount: string; price: string }[];

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

            <div className="mb-6 rounded-xl bg-black/30 p-4">
              <p className="mb-3 text-sm font-medium text-[var(--foreground-muted)]">{t('payPerUse.priceLabel')}</p>
              <div className="space-y-2">
                {scanPrices.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{item.action}</span>
                    <span className="font-bold text-emerald-400">{item.price}</span>
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
                <button
                  key={i}
                  onClick={() => setSelectedPackage(i)}
                  className={`flex w-full items-center justify-between rounded-xl p-4 transition-all ${
                    selectedPackage === i
                      ? 'border-2 border-blue-500 bg-blue-500/20 ring-2 ring-blue-500/30'
                      : 'border border-[var(--border)] bg-black/10 hover:border-blue-500/50 hover:bg-black/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{pkg.amount}</span>
                    {pkg.discount && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        {pkg.discount}
                      </span>
                    )}
                  </div>
                  <span className="font-bold">{pkg.price}</span>
                </button>
              ))}
            </div>

            <p className="mb-4 text-center text-sm text-[var(--foreground-muted)]">
              {t('topUp.paypal')}
            </p>

            <button
              onClick={async () => {
                setLoading(true);
                // PayPal integration - redirect to app with pre-selected package
                const price = PACKAGE_PRICES[selectedPackage];
                const value = PACKAGE_VALUES[selectedPackage];
                window.open(`https://fitstream.app?topup=${price}&value=${value}`, '_blank');
                setLoading(false);
              }}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0070ba] py-3 font-bold text-white transition hover:bg-[#005ea6] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.013 4.875-2.134 8.047-7.426 8.047h-2.19a1.736 1.736 0 0 0-1.714 1.467l-1.12 7.106a.641.641 0 0 0 .633.74h3.147l.741-4.694a1.736 1.736 0 0 1 1.714-1.467h1.14c4.637 0 8.27-1.883 9.327-7.335a6.843 6.843 0 0 0 .06-.474 4.044 4.044 0 0 0-3.705-2.849z"/>
                  </svg>
                  PayPal
                </>
              )}
            </button>
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
