'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Users, Star, Dumbbell } from 'lucide-react';

export function SocialProof() {
  const t = useTranslations('social');

  const stats = [
    { icon: Users, label: t('users') },
    { icon: Star, label: t('rating') },
    { icon: Dumbbell, label: t('exercises') },
  ];

  const platforms = [
    { name: 'Google Fit', icon: '❤️' },
    { name: 'Apple Health', icon: '🍎' },
    { name: 'Samsung Health', icon: '💙' },
  ];

  return (
    <section className="border-y border-[var(--border)] bg-[var(--background-subtle)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-8"
        >
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <stat.icon className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <div className="hidden h-8 w-px bg-[var(--border)] md:block" />

        {/* Platform logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-6"
        >
          <span className="text-sm text-[var(--foreground-muted)]">
            Syncs with:
          </span>
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="flex items-center gap-2 text-sm"
              title={platform.name}
            >
              <span className="text-xl">{platform.icon}</span>
              <span className="hidden sm:inline">{platform.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
