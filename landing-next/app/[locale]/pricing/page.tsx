import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Check, X, Star, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PricingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

const featureMatrix = [
  { key: 'workouts', free: true, pro: true },
  { key: 'poseTracking', free: true, pro: true },
  { key: 'foodScanner', free: '10/day', pro: 'Unlimited' },
  { key: 'scaleScanner', free: true, pro: true },
  { key: 'smartKitchen', free: true, pro: true },
  { key: 'recipes', free: '50', pro: '600+' },
  { key: 'cookingMode', free: true, pro: true },
  { key: 'timers', free: '1', pro: '10' },
  { key: 'history', free: '7 days', pro: 'Unlimited' },
  { key: 'bodyComposition', free: false, pro: true },
  { key: 'menuAnalyzer', free: false, pro: true },
  { key: 'voiceAssistant', free: false, pro: true },
  { key: 'pdfExport', free: false, pro: true },
  { key: 'aiPhotos', free: false, pro: true },
  { key: 'prioritySupport', free: false, pro: true },
  { key: 'adFree', free: false, pro: true },
];

const featureLabels: Record<string, { en: string; ru: string }> = {
  workouts: { en: 'Unlimited Workouts', ru: 'Безлимитные тренировки' },
  poseTracking: { en: 'AI Pose Tracking', ru: 'ИИ-трекинг позы' },
  foodScanner: { en: 'AI Food Scanner', ru: 'ИИ-сканер еды' },
  scaleScanner: { en: 'AI Scale Scanner', ru: 'ИИ-сканер весов' },
  smartKitchen: { en: 'Smart Kitchen', ru: 'Умная кухня' },
  recipes: { en: 'Recipes Database', ru: 'База рецептов' },
  cookingMode: { en: 'Guided Cooking', ru: 'Режим готовки' },
  timers: { en: 'Cooking Timers', ru: 'Таймеры готовки' },
  history: { en: 'Data History', ru: 'История данных' },
  bodyComposition: { en: 'Body Composition', ru: 'Состав тела' },
  menuAnalyzer: { en: 'Menu Analyzer', ru: 'Анализ меню' },
  voiceAssistant: { en: 'Voice Assistant', ru: 'Голосовой помощник' },
  pdfExport: { en: 'PDF Export', ru: 'Экспорт в PDF' },
  aiPhotos: { en: 'AI Dish Photos', ru: 'AI-фото блюд' },
  prioritySupport: { en: 'Priority Support', ru: 'Приоритетная поддержка' },
  adFree: { en: 'Ad-Free', ru: 'Без рекламы' },
};

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('pricing');

  const renderValue = (value: boolean | string) => {
    if (value === true) return <Check className="mx-auto h-5 w-5 text-emerald-500" />;
    if (value === false) return <X className="mx-auto h-5 w-5 text-slate-300 dark:text-slate-600" />;
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <div className="min-h-screen px-6 py-24 pt-32">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t('title')}</h1>
          <p className="text-xl text-[var(--foreground-muted)]">{t('subtitle')}</p>
        </div>

        {/* Pricing Cards */}
        <div className="mb-16 grid gap-8 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                <Zap className="h-6 w-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{t('free.name')}</h2>
                <p className="text-sm text-[var(--foreground-muted)]">{t('free.subtitle')}</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold">{t('free.price')}</span>
              <span className="text-[var(--foreground-muted)]">/{t('free.period')}</span>
            </div>

            <Link href="#download" className="block">
              <Button variant="secondary" className="w-full">
                {t('free.cta')}
              </Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-orange-500/10 p-8">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 text-sm font-bold text-black">
              {t('pro.badge')}
            </div>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{t('pro.name')}</h2>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">{t('pro.subtitle')}</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-5xl font-bold">{t('pro.price')}</span>
              <span className="text-[var(--foreground-muted)]">/{t('pro.period')}</span>
            </div>

            <Link href="#download" className="block">
              <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400">
                {t('pro.cta')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            {locale === 'ru' ? 'Сравнение функций' : 'Feature Comparison'}
          </h2>
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background-subtle)]">
                  <th className="px-6 py-4 text-left font-semibold">
                    {locale === 'ru' ? 'Функция' : 'Feature'}
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">Free</th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <span className="inline-flex items-center gap-1">
                      PRO <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureMatrix.map((feature, i) => (
                  <tr
                    key={feature.key}
                    className={i % 2 === 0 ? 'bg-[var(--card)]' : 'bg-[var(--background)]'}
                  >
                    <td className="px-6 py-4">
                      {featureLabels[feature.key]?.[locale as 'en' | 'ru'] ||
                        featureLabels[feature.key]?.en}
                    </td>
                    <td className="px-6 py-4 text-center">{renderValue(feature.free)}</td>
                    <td className="px-6 py-4 text-center">{renderValue(feature.pro)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            {locale === 'ru' ? 'Частые вопросы' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: locale === 'ru' ? 'Могу ли я отменить подписку?' : 'Can I cancel anytime?',
                a:
                  locale === 'ru'
                    ? 'Да, вы можете отменить подписку в любой момент. Доступ к PRO-функциям сохранится до конца оплаченного периода.'
                    : 'Yes, you can cancel your subscription at any time. You will retain access to PRO features until the end of your billing period.',
              },
              {
                q:
                  locale === 'ru'
                    ? 'Какие способы оплаты принимаются?'
                    : 'What payment methods are accepted?',
                a:
                  locale === 'ru'
                    ? 'Мы принимаем оплату через PayPal, а также через App Store и Google Play для мобильных приложений.'
                    : 'We accept PayPal, as well as App Store and Google Play for mobile apps.',
              },
              {
                q:
                  locale === 'ru'
                    ? 'Есть ли пробный период?'
                    : 'Is there a free trial?',
                a:
                  locale === 'ru'
                    ? 'Базовая версия бесплатна навсегда. Вы можете попробовать все основные функции без ограничений по времени.'
                    : 'The basic version is free forever. You can try all core features without any time limits.',
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-[var(--border)] bg-[var(--card)]"
              >
                <summary className="cursor-pointer list-none p-4 font-medium">{faq.q}</summary>
                <div className="border-t border-[var(--border)] p-4 text-[var(--foreground-muted)]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/#download">
            <Button size="lg">
              {locale === 'ru' ? 'Начать бесплатно' : 'Get Started Free'}
            </Button>
          </Link>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'FitStream AI',
            description: 'AI-powered fitness and nutrition companion',
            offers: [
              {
                '@type': 'Offer',
                name: 'Free',
                price: '0',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
              },
              {
                '@type': 'Offer',
                name: 'Pro',
                price: '4.99',
                priceCurrency: 'EUR',
                availability: 'https://schema.org/InStock',
                priceValidUntil: '2027-12-31',
              },
            ],
          }),
        }}
      />
    </div>
  );
}
