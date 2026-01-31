import { setRequestLocale, getTranslations } from 'next-intl/server';

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: TermsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  return {
    title: t('terms.title'),
    description: t('terms.description'),
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="px-6 py-24 pt-32">
      <div className="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
        <h1>{t('terms.title')}</h1>
        <p className="text-[var(--foreground-muted)]">
          {t('terms.lastUpdated')}: January 31, 2025
        </p>

        <h2>1. {t('terms.acceptance')}</h2>
        <p>{t('terms.acceptanceText')}</p>

        <h2>2. {t('terms.description')}</h2>
        <p>{t('terms.descriptionText')}</p>

        <h2>3. {t('terms.accounts')}</h2>
        <p>{t('terms.accountsText')}</p>

        <h2>4. {t('terms.subscription')}</h2>
        <p>{t('terms.subscriptionText')}</p>
        <ul>
          <li>{t('terms.subscriptionFree')}</li>
          <li>{t('terms.subscriptionPro')}</li>
        </ul>

        <h2>5. {t('terms.content')}</h2>
        <p>{t('terms.contentText')}</p>

        <h2>6. {t('terms.prohibited')}</h2>
        <p>{t('terms.prohibitedText')}</p>
        <ul>
          <li>{t('terms.prohibited1')}</li>
          <li>{t('terms.prohibited2')}</li>
          <li>{t('terms.prohibited3')}</li>
          <li>{t('terms.prohibited4')}</li>
        </ul>

        <h2>7. {t('terms.disclaimer')}</h2>
        <p>{t('terms.disclaimerText')}</p>

        <h2>8. {t('terms.limitation')}</h2>
        <p>{t('terms.limitationText')}</p>

        <h2>9. {t('terms.changes')}</h2>
        <p>{t('terms.changesText')}</p>

        <h2>10. {t('terms.contact')}</h2>
        <p>
          {t('terms.contactText')}{' '}
          <a href="https://t.me/fitstreambot" className="text-blue-600 hover:underline">
            @fitstreambot
          </a>
        </p>
      </div>
    </div>
  );
}
