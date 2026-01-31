'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { FeatureCard } from '@/components/features/FeatureCard';

// Top 6 features for the bento grid
const topFeatures = [
  { slug: 'ai-pose-tracking', key: 'poseTracking', icon: '🧘', color: 'violet', isNew: true },
  { slug: 'smart-kitchen', key: 'smartKitchen', icon: '🍳', color: 'amber', isNew: true },
  { slug: 'ai-food-scanner', key: 'nutritionScanner', icon: '📸', color: 'orange' },
  { slug: 'guided-cooking', key: 'cookingMode', icon: '👨‍🍳', color: 'rose', isNew: true },
  { slug: 'smart-scale', key: 'smartScale', icon: '⚖️', color: 'emerald' },
  { slug: 'health-sync', key: 'healthIntegrations', icon: '❤️', color: 'red' },
];

export function BentoGrid() {
  const t = useTranslations('features');
  const locale = useLocale();

  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-6xl">
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

        {/* Bento Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {topFeatures.map((feature, index) => (
            <motion.div
              key={feature.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={index < 2 ? 'lg:col-span-1' : ''}
            >
              <FeatureCard
                slug={feature.slug}
                icon={feature.icon}
                title={t(`${feature.key}.title`)}
                description={t(`${feature.key}.short`)}
                color={feature.color}
                isNew={feature.isNew}
                size={index < 2 ? 'large' : 'normal'}
              />
            </motion.div>
          ))}
        </div>

        {/* See all features link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            href={`/${locale}/features`}
            className="inline-flex items-center gap-2 text-lg font-semibold text-blue-600 transition hover:text-blue-500"
          >
            {t('seeAll')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
