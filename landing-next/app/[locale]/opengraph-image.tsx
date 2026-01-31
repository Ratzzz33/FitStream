import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'FitStream AI - AI-Powered Fitness Companion';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'ru' },
    { locale: 'es' },
    { locale: 'fr' },
    { locale: 'de' },
    { locale: 'zh' },
  ];
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const titles: Record<string, { title1: string; title2: string; subtitle: string }> = {
    en: { title1: 'Your AI-Powered', title2: 'Fitness Companion', subtitle: 'Track • Scan • Cook • Achieve' },
    ru: { title1: 'Ваш AI Фитнес', title2: 'Компаньон', subtitle: 'Следи • Сканируй • Готовь • Достигай' },
    es: { title1: 'Tu Compañero de', title2: 'Fitness con IA', subtitle: 'Rastrea • Escanea • Cocina • Logra' },
    fr: { title1: 'Votre Compagnon', title2: 'Fitness IA', subtitle: 'Suivez • Scannez • Cuisinez • Réussissez' },
    de: { title1: 'Dein KI-Fitness', title2: 'Begleiter', subtitle: 'Tracken • Scannen • Kochen • Erreichen' },
    zh: { title1: 'AI驱动的', title2: '健身伴侣', subtitle: '追踪 • 扫描 • 烹饪 • 达成' },
  };

  const t = titles[locale] || titles.en;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
            }}
          >
            💪
          </div>
          <span
            style={{
              fontSize: '48px',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            FitStream AI
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
            }}
          >
            {t.title1}
          </span>
          <span
            style={{
              fontSize: '72px',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.1,
            }}
          >
            {t.title2}
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            marginTop: '32px',
            fontSize: '28px',
            color: '#94a3b8',
            letterSpacing: '4px',
          }}
        >
          {t.subtitle}
        </p>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginTop: '48px',
          }}
        >
          {['AI Pose Tracking', 'Smart Kitchen', 'Food Scanner', 'Voice Coach'].map((feature) => (
            <div
              key={feature}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '100px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: '20px', color: '#10b981' }}>✓</span>
              <span style={{ fontSize: '18px', color: '#e2e8f0' }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
