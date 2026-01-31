import { setRequestLocale, getTranslations } from 'next-intl/server';

interface PrivacyPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  return {
    title: t('privacy.title'),
    description: t('privacy.description'),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="px-6 py-24 pt-32">
      <div className="prose prose-lg dark:prose-invert mx-auto max-w-4xl">
        <h1>{t('privacy.title')}</h1>
        <p className="text-[var(--foreground-muted)]">
          {t('privacy.lastUpdated')}: January 31, 2025
        </p>

        <h2>1. {t('privacy.intro')}</h2>
        <p>{t('privacy.introText')}</p>

        <h2>2. {t('privacy.dataCollected')}</h2>
        <p>{t('privacy.dataCollectedText')}</p>
        <ul>
          <li><strong>{t('privacy.dataHealth')}:</strong> {t('privacy.dataHealthText')}</li>
          <li><strong>{t('privacy.dataPhotos')}:</strong> {t('privacy.dataPhotosText')}</li>
          <li><strong>{t('privacy.dataAccount')}:</strong> {t('privacy.dataAccountText')}</li>
          <li><strong>{t('privacy.dataUsage')}:</strong> {t('privacy.dataUsageText')}</li>
        </ul>

        <h2>3. {t('privacy.howWeUse')}</h2>
        <p>{t('privacy.howWeUseText')}</p>
        <ul>
          <li>{t('privacy.use1')}</li>
          <li>{t('privacy.use2')}</li>
          <li>{t('privacy.use3')}</li>
          <li>{t('privacy.use4')}</li>
        </ul>

        <h2>4. {t('privacy.storage')}</h2>
        <p>{t('privacy.storageText')}</p>

        <h2>5. {t('privacy.thirdParty')}</h2>
        <p>{t('privacy.thirdPartyText')}</p>
        <ul>
          <li><strong>Google Gemini AI:</strong> {t('privacy.thirdPartyGemini')}</li>
          <li><strong>Google Fit / Apple Health / Samsung Health:</strong> {t('privacy.thirdPartyHealth')}</li>
        </ul>

        <h2>6. {t('privacy.security')}</h2>
        <p>{t('privacy.securityText')}</p>

        <h2>7. {t('privacy.rights')}</h2>
        <p>{t('privacy.rightsText')}</p>
        <ul>
          <li>{t('privacy.rights1')}</li>
          <li>{t('privacy.rights2')}</li>
          <li>{t('privacy.rights3')}</li>
          <li>{t('privacy.rights4')}</li>
        </ul>

        <h2>8. {t('privacy.children')}</h2>
        <p>{t('privacy.childrenText')}</p>

        <h2>9. {t('privacy.changes')}</h2>
        <p>{t('privacy.changesText')}</p>

        <h2>10. {t('privacy.contact')}</h2>
        <p>
          {t('privacy.contactText')}{' '}
          <a href="https://t.me/fitstreambot" className="text-blue-600 hover:underline">
            @fitstreambot
          </a>
        </p>
      </div>
    </div>
  );
}
