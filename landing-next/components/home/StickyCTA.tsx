'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function StickyCTA() {
  const t = useTranslations('stickyCta');
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      const shouldShow = window.scrollY > 500;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  // Reset dismissed state after 30 seconds
  useEffect(() => {
    if (isDismissed) {
      const timer = setTimeout(() => setIsDismissed(false), 30000);
      return () => clearTimeout(timer);
    }
  }, [isDismissed]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-black/90 via-black/80 to-transparent backdrop-blur-md lg:hidden"
        >
          <div className="flex items-center gap-3">
            <a href="#download" className="flex-1">
              <Button size="lg" className="w-full">
                {t('cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-white/60">
            {t('freeTrialNote')}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
