'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Shield, Award, Lock, Smartphone } from 'lucide-react';

const badges = [
  { key: 'gdpr', icon: Shield, color: 'text-blue-400' },
  { key: 'secure', icon: Lock, color: 'text-emerald-400' },
  { key: 'appStore', icon: Smartphone, color: 'text-purple-400' },
  { key: 'award', icon: Award, color: 'text-yellow-400' },
];

export function TrustBadges() {
  const t = useTranslations('trustBadges');

  return (
    <section className="py-12 px-6 border-t border-[var(--border)]">
      <div className="mx-auto max-w-5xl">
        {/* Badges grid - semi-transparent to indicate "coming soon" */}
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-40">
          {badges.map((badge, idx) => (
            <motion.div
              key={badge.key}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center gap-3 text-[var(--foreground-muted)]"
            >
              <badge.icon className={`h-6 w-6 ${badge.color}`} />
              <span className="text-sm font-medium">{t(badge.key)}</span>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--foreground-muted)] opacity-60">
          {t('comingSoon')}
        </p>
      </div>
    </section>
  );
}
