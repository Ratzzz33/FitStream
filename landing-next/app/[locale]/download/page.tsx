import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Download, Globe, MessageCircle, Smartphone, Monitor, QrCode, Apple, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// APK download configuration
const APK_CONFIG = {
  version: '1.1.4',
  versionCode: 114,
  size: '~40 MB',
  minSdk: 'Android 8.0+',
  downloadUrl: 'https://ouhvagzgwjlzygjcxdmb.supabase.co/storage/v1/object/public/apk-releases/FitStream-latest.apk',
};

interface DownloadPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: DownloadPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'download' });

  return {
    title: locale === 'ru' ? 'Скачать FitStream' : 'Download FitStream',
    description: t('description'),
  };
}

export default async function DownloadPage({ params }: DownloadPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('download');

  const platforms = [
    {
      id: 'android-apk',
      name: 'Android APK',
      icon: Download,
      title: locale === 'ru' ? 'Скачать APK' : 'Download APK',
      subtitle: `v${APK_CONFIG.version} • ${APK_CONFIG.size}`,
      href: APK_CONFIG.downloadUrl,
      available: true,
      badge: locale === 'ru' ? 'Рекомендуется' : 'Recommended',
      badgeColor: 'bg-emerald-600',
      download: 'FitStream.apk',
    },
    {
      id: 'web',
      name: 'Web',
      icon: Globe,
      title: t('webApp'),
      subtitle: locale === 'ru' ? 'Любой браузер' : 'Any browser',
      href: 'https://app.fitstream.health',
      available: true,
      badge: null,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: MessageCircle,
      title: 'Telegram Mini App',
      subtitle: '@FitStreamBot',
      href: 'https://t.me/FitStreamBot',
      available: true,
      badge: null,
    },
    {
      id: 'ios',
      name: 'iOS',
      icon: Apple,
      title: t('appStore'),
      subtitle: 'iPhone & iPad',
      href: '#',
      available: false,
      badge: t('comingSoon'),
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'android-play',
      name: 'Google Play',
      icon: Play,
      title: t('googlePlay'),
      subtitle: 'Android 8.0+',
      href: '#',
      available: false,
      badge: t('comingSoon'),
      badgeColor: 'bg-blue-600',
    },
  ];

  const requirements = {
    android: [APK_CONFIG.minSdk, 'ARM64 / ARM32', APK_CONFIG.size],
    web: [
      locale === 'ru' ? 'Chrome, Safari, Firefox' : 'Chrome, Safari, Firefox',
      locale === 'ru' ? 'Камера для сканирования' : 'Camera for scanning',
      locale === 'ru' ? 'Интернет не обязателен' : 'Internet optional',
    ],
    ios: ['iOS 15.0+', 'iPhone 8+', '~50 MB'],
  };

  const installSteps = locale === 'ru'
    ? [
        '1. Скачайте APK файл',
        '2. Откройте файл на телефоне',
        '3. Разрешите установку из неизвестных источников',
        '4. Установите приложение',
      ]
    : [
        '1. Download the APK file',
        '2. Open the file on your phone',
        '3. Allow installation from unknown sources',
        '4. Install the app',
      ];

  return (
    <div className="min-h-screen px-6 py-24 pt-32">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            {t('title1')} <span className="gradient-text">{t('title2')}</span>
          </h1>
          <p className="text-xl text-[var(--foreground-muted)]">{t('description')}</p>
        </div>

        {/* Main Download Card - APK */}
        <div className="mb-8 rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-600/10 to-green-600/10 p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-green-600">
              <Download className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">
                {locale === 'ru' ? 'Скачать для Android' : 'Download for Android'}
              </h2>
              <p className="text-[var(--foreground-muted)]">
                {locale === 'ru'
                  ? `Версия ${APK_CONFIG.version} • ${APK_CONFIG.size} • ${APK_CONFIG.minSdk}`
                  : `Version ${APK_CONFIG.version} • ${APK_CONFIG.size} • ${APK_CONFIG.minSdk}`
                }
              </p>
            </div>
            <a href={APK_CONFIG.downloadUrl} download="FitStream.apk">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
                <Download className="mr-2 h-5 w-5" />
                {locale === 'ru' ? 'Скачать APK' : 'Download APK'}
              </Button>
            </a>
          </div>
        </div>

        {/* Installation Instructions */}
        <div className="mb-16 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <h3 className="mb-4 font-semibold">
            {locale === 'ru' ? 'Как установить:' : 'How to install:'}
          </h3>
          <div className="grid gap-2 text-sm text-[var(--foreground-muted)] sm:grid-cols-2">
            {installSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-600">
                  {i + 1}
                </div>
                <span>{step.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Other Platform Cards */}
        <h3 className="mb-6 text-xl font-bold">
          {locale === 'ru' ? 'Другие платформы' : 'Other Platforms'}
        </h3>
        <div className="mb-16 grid gap-4 md:grid-cols-2">
          {platforms.slice(1).map((platform) => (
            <a
              key={platform.id}
              href={platform.available ? platform.href : undefined}
              className={`group relative flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 transition ${
                platform.available
                  ? 'hover:border-blue-500/50 hover:shadow-lg cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {platform.badge && (
                <span className={`absolute right-4 top-4 rounded-full ${platform.badgeColor || 'bg-blue-600'} px-2 py-1 text-xs font-bold text-white`}>
                  {platform.badge}
                </span>
              )}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-600/20">
                <platform.icon className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold">{platform.title}</h4>
                <p className="text-sm text-[var(--foreground-muted)]">{platform.subtitle}</p>
              </div>
            </a>
          ))}
        </div>

        {/* QR Code Section */}
        <div className="mb-16 rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--card)]">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-xl font-bold">
            {locale === 'ru' ? 'Быстрая загрузка' : 'Quick Download'}
          </h3>
          <p className="mb-6 text-[var(--foreground-muted)]">
            {locale === 'ru'
              ? 'Отсканируйте QR-код камерой телефона'
              : 'Scan QR code with your phone camera'}
          </p>
          <div className="mx-auto h-40 w-40 rounded-xl bg-white p-2">
            {/* QR Code placeholder - will be generated */}
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-400">
              QR Code
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="mb-16">
          <h2 className="mb-8 text-center text-2xl font-bold">
            {locale === 'ru' ? 'Системные требования' : 'System Requirements'}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(requirements).map(([platform, reqs]) => (
              <div
                key={platform}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6"
              >
                <div className="mb-4 flex items-center gap-2">
                  {platform === 'ios' && <Apple className="h-5 w-5" />}
                  {platform === 'android' && <Smartphone className="h-5 w-5" />}
                  {platform === 'web' && <Monitor className="h-5 w-5" />}
                  <span className="font-semibold capitalize">{platform}</span>
                </div>
                <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
                  {reqs.map((req, i) => (
                    <li key={i}>• {req}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Features Reminder */}
        <div className="mb-16 rounded-2xl bg-gradient-to-r from-blue-600/10 to-emerald-600/10 p-8 text-center">
          <h3 className="mb-4 text-xl font-bold">
            {locale === 'ru' ? 'Что вы получите' : "What you'll get"}
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              locale === 'ru' ? '🧘 ИИ-трекинг позы' : '🧘 AI Pose Tracking',
              locale === 'ru' ? '📸 Сканер еды' : '📸 Food Scanner',
              locale === 'ru' ? '🍳 Умная кухня' : '🍳 Smart Kitchen',
              locale === 'ru' ? '⚖️ Сканер весов' : '⚖️ Scale Scanner',
              locale === 'ru' ? '📊 Аналитика' : '📊 Analytics',
              locale === 'ru' ? '📴 Офлайн' : '📴 Offline',
            ].map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-[var(--card)] px-4 py-2 text-sm font-medium"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="mb-4 text-[var(--foreground-muted)]">
            {locale === 'ru' ? 'Начните бесплатно сегодня' : 'Start free today'}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={APK_CONFIG.downloadUrl} download="FitStream.apk">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500">
                <Download className="mr-2 h-5 w-5" />
                {locale === 'ru' ? 'Скачать APK' : 'Download APK'}
              </Button>
            </a>
            <a href="https://app.fitstream.health">
              <Button size="lg" variant="secondary">
                {locale === 'ru' ? 'Открыть веб-версию' : 'Open Web App'}
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'FitStream AI',
            operatingSystem: 'Android, Web',
            applicationCategory: 'HealthApplication',
            downloadUrl: APK_CONFIG.downloadUrl,
            softwareVersion: APK_CONFIG.version,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'EUR',
            },
          }),
        }}
      />
    </div>
  );
}
