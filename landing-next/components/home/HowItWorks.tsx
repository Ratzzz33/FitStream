'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';

const steps = [
  { key: 'download', image: '/covers/steps/step-download.png', color: 'from-blue-500 to-cyan-500' },
  { key: 'scan', image: '/covers/steps/step-scan.png', color: 'from-orange-500 to-amber-500' },
  { key: 'track', image: '/covers/steps/step-track.png', color: 'from-emerald-500 to-teal-500' },
];

export function HowItWorks() {
  const t = useTranslations('howItWorks');

  return (
    <section className="py-24 px-6 bg-[var(--background-subtle)]">
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

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, idx) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className="group relative"
            >
              {/* Step number connector */}
              {idx < steps.length - 1 && (
                <div className="absolute right-0 top-16 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-[var(--border)] to-transparent md:block" />
              )}

              {/* Card */}
              <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-blue-500/50 hover:shadow-lg">
                {/* Step number badge */}
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${step.color} text-lg font-bold text-white shadow-lg`}>
                  {idx + 1}
                </div>

                {/* Image */}
                <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-[var(--background-subtle)]">
                  <Image
                    src={step.image}
                    alt={t(`${step.key}.title`)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Content */}
                <h3 className="mb-2 text-xl font-bold">{t(`${step.key}.title`)}</h3>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {t(`${step.key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
