'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Apple, Play, Globe } from 'lucide-react';

export function DownloadCTA() {
  const t = useTranslations('download');

  const downloadLinks = [
    {
      href: '#', // App Store link
      icon: Apple,
      label1: t('on'),
      label2: t('appStore'),
      className: 'bg-black text-white hover:bg-gray-800',
    },
    {
      href: '#', // Google Play link
      icon: Play,
      label1: t('get'),
      label2: t('googlePlay'),
      className: 'bg-black text-white hover:bg-gray-800',
    },
    {
      href: 'https://app.fitstream.health',
      icon: Globe,
      label1: t('use'),
      label2: t('webApp'),
      className:
        'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-500 hover:to-emerald-500',
    },
  ];

  return (
    <section id="download" className="py-24 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            {t('title1')}
            <br />
            <span className="gradient-text">{t('title2')}</span>
          </h2>
          <p className="mb-10 text-xl text-[var(--foreground-muted)]">
            {t('description')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          {downloadLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              className={`flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 transition sm:w-auto ${link.className}`}
            >
              <link.icon className="h-8 w-8" />
              <div className="text-left">
                <p className="text-xs opacity-80">{link.label1}</p>
                <p className="text-lg font-semibold">{link.label2}</p>
              </div>
            </a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
