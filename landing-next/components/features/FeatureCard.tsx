'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  slug: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  isNew?: boolean;
  isPremium?: boolean;
  size?: 'normal' | 'large';
}

const colorClasses: Record<string, string> = {
  violet: 'from-violet-600/20 to-violet-900/10 border-violet-500/30 hover:border-violet-400',
  amber: 'from-amber-600/20 to-amber-900/10 border-amber-500/30 hover:border-amber-400',
  rose: 'from-rose-600/20 to-rose-900/10 border-rose-500/30 hover:border-rose-400',
  blue: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 hover:border-blue-400',
  emerald: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/30 hover:border-emerald-400',
  orange: 'from-orange-600/20 to-orange-900/10 border-orange-500/30 hover:border-orange-400',
  teal: 'from-teal-600/20 to-teal-900/10 border-teal-500/30 hover:border-teal-400',
  red: 'from-red-600/20 to-red-900/10 border-red-500/30 hover:border-red-400',
  purple: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 hover:border-purple-400',
  cyan: 'from-cyan-600/20 to-cyan-900/10 border-cyan-500/30 hover:border-cyan-400',
  slate: 'from-slate-600/20 to-slate-800/10 border-slate-500/30 hover:border-slate-400',
  pink: 'from-pink-600/20 to-pink-900/10 border-pink-500/30 hover:border-pink-400',
  lime: 'from-lime-600/20 to-lime-900/10 border-lime-500/30 hover:border-lime-400',
  yellow: 'from-yellow-600/20 to-yellow-900/10 border-yellow-500/30 hover:border-yellow-400',
};

const iconBgClasses: Record<string, string> = {
  violet: 'bg-violet-600/20',
  amber: 'bg-amber-600/20',
  rose: 'bg-rose-600/20',
  blue: 'bg-blue-600/20',
  emerald: 'bg-emerald-600/20',
  orange: 'bg-orange-600/20',
  teal: 'bg-teal-600/20',
  red: 'bg-red-600/20',
  purple: 'bg-purple-600/20',
  cyan: 'bg-cyan-600/20',
  slate: 'bg-slate-600/20',
  pink: 'bg-pink-600/20',
  lime: 'bg-lime-600/20',
  yellow: 'bg-yellow-600/20',
};

export function FeatureCard({
  slug,
  icon,
  title,
  description,
  color,
  isNew,
  isPremium,
  size = 'normal',
}: FeatureCardProps) {
  const locale = useLocale();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/${locale}/features/${slug}`}
        className={`group relative block h-full rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 ${
          colorClasses[color] || colorClasses.blue
        }`}
      >
        {/* Badges */}
        {isNew && (
          <span className="absolute right-4 top-4 rounded-full bg-violet-500 px-2 py-1 text-xs font-bold text-white">
            NEW
          </span>
        )}
        {isPremium && (
          <span className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-2 py-1 text-xs font-bold text-black">
            PRO
          </span>
        )}

        {/* Icon */}
        <div
          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${
            iconBgClasses[color] || iconBgClasses.blue
          }`}
        >
          {icon}
        </div>

        {/* Title */}
        <h3 className="mb-2 text-xl font-bold">{title}</h3>

        {/* Description */}
        <p
          className={`text-[var(--foreground-muted)] ${
            size === 'large' ? 'text-base' : 'text-sm'
          }`}
        >
          {description}
        </p>

        {/* Arrow */}
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
          <span>Learn more</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </Link>
    </motion.div>
  );
}
