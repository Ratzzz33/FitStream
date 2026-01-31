import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { features, getFeatureBySlug } from '@/content/features';
import { Button } from '@/components/ui/Button';

interface FeaturePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export function generateStaticParams() {
  return features.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: FeaturePageProps) {
  const { locale, slug } = await params;
  const feature = getFeatureBySlug(slug);
  if (!feature) return {};

  const t = await getTranslations({ locale, namespace: 'features' });

  return {
    title: t(`${feature.key}.title`),
    description: t(`${feature.key}.description`),
  };
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { locale, slug } = await params;
  const feature = getFeatureBySlug(slug);

  if (!feature) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations('features');
  const tCommon = await getTranslations('common');

  // Get related features (excluding current)
  const relatedFeatures = features
    .filter((f) => f.slug !== slug)
    .slice(0, 3);

  // Color mapping for backgrounds
  const colorBg: Record<string, string> = {
    violet: 'from-violet-600/20 to-violet-900/5',
    amber: 'from-amber-600/20 to-amber-900/5',
    rose: 'from-rose-600/20 to-rose-900/5',
    blue: 'from-blue-600/20 to-blue-900/5',
    emerald: 'from-emerald-600/20 to-emerald-900/5',
    orange: 'from-orange-600/20 to-orange-900/5',
    teal: 'from-teal-600/20 to-teal-900/5',
    red: 'from-red-600/20 to-red-900/5',
    purple: 'from-purple-600/20 to-purple-900/5',
    cyan: 'from-cyan-600/20 to-cyan-900/5',
    slate: 'from-slate-600/20 to-slate-800/5',
    pink: 'from-pink-600/20 to-pink-900/5',
    lime: 'from-lime-600/20 to-lime-900/5',
    yellow: 'from-yellow-600/20 to-yellow-900/5',
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className={`bg-gradient-to-b ${colorBg[feature.color] || colorBg.blue} px-6 pb-16 pt-32`}
      >
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="mb-8">
            <Link
              href={`/${locale}/features`}
              className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] transition hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
              All Features
            </Link>
          </nav>

          {/* Image or Icon + Title */}
          {feature.image ? (
            <div className="relative mb-6 h-64 w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src={feature.image}
                alt={t(`${feature.key}.title`)}
                fill
                className="object-cover"
                priority
              />
            </div>
          ) : (
            <div className="mb-6 text-6xl">{feature.icon}</div>
          )}
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            {t(`${feature.key}.title`)}
          </h1>
          <p className="max-w-2xl text-xl text-[var(--foreground-muted)]">
            {t(`${feature.key}.description`)}
          </p>

          {/* Badges */}
          <div className="mt-6 flex gap-2">
            {feature.isNew && (
              <span className="rounded-full bg-violet-500 px-3 py-1 text-sm font-bold text-white">
                NEW
              </span>
            )}
            {feature.isPremium && (
              <span className="rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 text-sm font-bold text-black">
                PRO
              </span>
            )}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold">{t('howItWorks')}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {step}
                </div>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {t(`${feature.key}.step${step}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-[var(--background-subtle)] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold">{t('keyBenefits')}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                <span>{t(`${feature.key}.benefit${i}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section (Important for AI SEO) */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold">{t('faq')}</h2>
          <div className="space-y-4">
            {[
              { q: t('faqWhat', { title: t(`${feature.key}.title`) }), a: t(`${feature.key}.description`) },
              { q: t('faqOffline'), a: t('faqOfflineAnswer') },
              { q: t('faqFree'), a: feature.isPremium ? t('faqFreePro') : t('faqFreeYes') },
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl border border-[var(--border)] bg-[var(--card)]"
              >
                <summary className="cursor-pointer list-none p-4 font-medium">
                  {faq.q}
                </summary>
                <div className="border-t border-[var(--border)] p-4 text-[var(--foreground-muted)]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-2xl font-bold">
            {t('tryToday', { title: t(`${feature.key}.title`) })}
          </h2>
          <p className="mb-8 text-[var(--foreground-muted)]">
            {t('tryDescription')}
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/#download">
              <Button size="lg">{tCommon('getStarted')}</Button>
            </Link>
            <Link href="https://app.fitstream.health">
              <Button variant="secondary" size="lg">
                {tCommon('tryFree')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Features */}
      <section className="border-t border-[var(--border)] bg-[var(--background-subtle)] px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-2xl font-bold">{t('relatedFeatures')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedFeatures.map((rf) => (
              <Link
                key={rf.slug}
                href={`/${locale}/features/${rf.slug}`}
                className="group overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition hover:border-blue-500/50"
              >
                {rf.image && (
                  <div className="relative h-32 w-full">
                    <Image
                      src={rf.image}
                      alt={t(`${rf.key}.title`)}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3 p-4">
                  <span className="font-medium">{t(`${rf.key}.title`)}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: `What is ${t(`${feature.key}.title`)}?`,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: t(`${feature.key}.description`),
                },
              },
              {
                '@type': 'Question',
                name: 'Does it work offline?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, FitStream works fully offline and syncs when you reconnect.',
                },
              },
              {
                '@type': 'Question',
                name: 'Is this feature free?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: feature.isPremium
                    ? 'This is a PRO feature included in the €4.99/month subscription.'
                    : 'Yes, this feature is included in the free version.',
                },
              },
            ],
          }),
        }}
      />
    </div>
  );
}
