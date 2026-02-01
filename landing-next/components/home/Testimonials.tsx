'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const testimonials = [
  { key: 'testimonial1', avatar: '/covers/avatars/avatar-1.png' },
  { key: 'testimonial2', avatar: '/covers/avatars/avatar-2.png' },
  { key: 'testimonial3', avatar: '/covers/avatars/avatar-3.png' },
  { key: 'testimonial4', avatar: '/covers/avatars/avatar-4.png' },
  { key: 'testimonial5', avatar: '/covers/avatars/avatar-5.png' },
  { key: 'testimonial6', avatar: '/covers/avatars/avatar-6.png' },
];

export function Testimonials() {
  const t = useTranslations('testimonials');

  return (
    <section className="py-24 px-6 bg-[var(--background-subtle)]">
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

        {/* Testimonials grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-6 text-[var(--foreground-muted)]">
                "{t(`${item.key}.quote`)}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image
                    src={item.avatar}
                    alt={t(`${item.key}.name`)}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">{t(`${item.key}.name`)}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {t(`${item.key}.role`)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
