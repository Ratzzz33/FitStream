import { setRequestLocale, getTranslations } from 'next-intl/server';
import { FeatureCard } from '@/components/features/FeatureCard';
import { features } from '@/content/features';

interface FeaturesPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: FeaturesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'features' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function FeaturesPage({ params }: FeaturesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('features');

  return (
    <div className="px-6 py-24 pt-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t('title')}</h1>
          <p className="text-xl text-[var(--foreground-muted)]">{t('subtitle')}</p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.slug}
              slug={feature.slug}
              icon={feature.icon}
              title={t(`${feature.key}.title`)}
              description={t(`${feature.key}.short`)}
              color={feature.color}
              isNew={feature.isNew}
              isPremium={feature.isPremium}
            />
          ))}
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'FitStream AI Features',
            numberOfItems: features.length,
            itemListElement: features.map((feature, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: feature.key,
              url: `https://fitstream.health/${locale}/features/${feature.slug}`,
            })),
          }),
        }}
      />
    </div>
  );
}
