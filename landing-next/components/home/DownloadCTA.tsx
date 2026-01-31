'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Download, Globe, Smartphone } from 'lucide-react';

// APK download URL from Supabase Storage
const APK_DOWNLOAD_URL = 'https://ouhvagzgwjlzygjcxdmb.supabase.co/storage/v1/object/public/apk-releases/FitStream-latest.apk';
const APK_VERSION = '1.1.4';

export function DownloadCTA() {
  const t = useTranslations('download');

  const downloadLinks = [
    {
      href: APK_DOWNLOAD_URL,
      icon: Download,
      label1: t('directDownload'),
      label2: `Android APK v${APK_VERSION}`,
      className: 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500',
      download: 'FitStream.apk',
    },
    {
      href: 'https://app.fitstream.health',
      icon: Globe,
      label1: t('use'),
      label2: t('webApp'),
      className:
        'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500',
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
              download={link.download}
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

        {/* Store links - Coming Soon */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--foreground-muted)]"
        >
          <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2">
            <Smartphone className="h-4 w-4" />
            <span>App Store & Google Play — {t('comingSoon')}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
