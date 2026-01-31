import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'FitStream AI Pricing - Free & Pro Plans';
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

export default async function Image() {
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
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              fontSize: '36px',
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
        <span
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '48px',
          }}
        >
          Simple Pricing
        </span>

        {/* Pricing cards */}
        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Free */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px 48px',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '8px' }}>Free</span>
            <span style={{ fontSize: '64px', fontWeight: 800, color: '#ffffff' }}>€0</span>
            <span style={{ fontSize: '18px', color: '#64748b' }}>forever</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
              {['Unlimited workouts', 'AI Scale Scanner', 'AI Food Scanner'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981' }}>✓</span>
                  <span style={{ color: '#e2e8f0', fontSize: '16px' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '32px 48px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)',
              border: '2px solid rgba(59,130,246,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                padding: '4px 16px',
                borderRadius: '100px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>MOST POPULAR</span>
            </div>
            <span style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '8px' }}>PRO</span>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '64px', fontWeight: 800, color: '#ffffff' }}>€4.99</span>
              <span style={{ fontSize: '18px', color: '#64748b', marginLeft: '8px' }}>/mo</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
              {['Everything in Free', 'Unlimited AI', 'Voice Assistant'].map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#3b82f6' }}>✓</span>
                  <span style={{ color: '#e2e8f0', fontSize: '16px' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
