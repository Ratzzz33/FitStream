'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Images synced with dynamic titles
const heroScreens = [
  { image: '/covers/nutritionScanner.png', color: 'from-orange-500 to-amber-500' },
  { image: '/covers/food.png', color: 'from-rose-500 to-pink-500' },
  { image: '/covers/poseTracking.png', color: 'from-violet-500 to-purple-500' },
  { image: '/covers/smartKitchen.png', color: 'from-amber-500 to-yellow-500' },
];

export function Hero() {
  const t = useTranslations('hero');
  const [activeIndex, setActiveIndex] = useState(0);

  const dynamicTitles = [
    t('dynamic1'),
    t('dynamic2'),
    t('dynamic3'),
    t('dynamic4'),
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % dynamicTitles.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [dynamicTitles.length]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-20">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Left: Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2"
          >
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-[var(--foreground-muted)]">
              {t('badge')}
            </span>
          </motion.div>

          {/* Main title */}
          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-6xl">
            <span>{t('title1')}</span>
            <br />
            <span className="gradient-text">{t('title2')}</span>
          </h1>

          {/* Dynamic subtitle */}
          <div className="mb-4 h-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-semibold text-blue-600"
              >
                {dynamicTitles[activeIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Description */}
          <p className="mb-10 max-w-xl text-xl text-[var(--foreground-muted)]">
            {t('description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
            <a href="#download">
              <Button size="lg" className="w-full sm:w-auto">
                {t('downloadFree')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <a href="https://app.fitstream.health">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                {t('tryWebApp')}
              </Button>
            </a>
          </div>

          {/* Progress dots - desktop only */}
          <div className="mt-8 hidden gap-2 lg:flex lg:justify-start">
            {heroScreens.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-[var(--border)] hover:bg-blue-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>

        {/* Right: Phone mockup with carousel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mx-auto w-[240px] lg:mx-0 lg:ml-auto"
        >
          {/* Animated glow effect */}
          <div
            className={`absolute -inset-6 rounded-[3rem] bg-gradient-to-br ${heroScreens[activeIndex].color} opacity-25 blur-3xl transition-all duration-700`}
          />

          {/* Phone frame */}
          <div className="relative rounded-[2rem] border-[3px] border-gray-800 bg-gray-900 p-1.5 shadow-2xl dark:border-gray-600">
            {/* Dynamic Island / Notch */}
            <div className="absolute left-1/2 top-3 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

            {/* Screen container with fixed height */}
            <div className="relative h-[480px] w-full overflow-hidden rounded-[1.5rem] bg-gray-950">
              {/* Images */}
              {heroScreens.map((screen, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 transition-all duration-500 ${
                    idx === activeIndex
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                  }`}
                >
                  <Image
                    src={screen.image}
                    alt={dynamicTitles[idx] || ''}
                    fill
                    sizes="240px"
                    className="object-cover"
                    priority={idx === 0}
                  />
                </div>
              ))}

              {/* Gradient overlay at bottom */}
              <div className="absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Feature label */}
              <div className="absolute inset-x-3 bottom-4 z-20">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="inline-block rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md"
                  >
                    {dynamicTitles[activeIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Home indicator */}
            <div className="mx-auto mt-1.5 h-1 w-24 rounded-full bg-gray-600" />
          </div>

          {/* Progress dots - mobile only, under phone */}
          <div className="mt-6 flex justify-center gap-2 lg:hidden">
            {heroScreens.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-[var(--border)] hover:bg-blue-400'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
