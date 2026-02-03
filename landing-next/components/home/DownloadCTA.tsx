'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Download, Globe, Send } from 'lucide-react';

export function DownloadCTA() {
  const t = useTranslations('download');

  const downloadLinks = [
    {
      href: 'https://app.fitstream.health',
      icon: Globe,
      label1: t('use'),
      label2: t('webApp'),
      className:
        'bg-gradient-to-r from-blue-600 to-emerald-600 text-white hover:from-blue-500 hover:to-emerald-500',
    },
    {
      href: '/downloads/fitstream-1.3.5.apk',
      icon: Download,
      label1: t('get'),
      label2: 'Android APK v1.3.5',
      className: 'bg-emerald-600 text-white hover:bg-emerald-500',
    },
    {
      href: 'https://t.me/fitstreambot',
      icon: Send,
      label1: t('use'),
      label2: 'Telegram',
      className: 'bg-[#0088cc] text-white hover:bg-[#0099dd]',
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
