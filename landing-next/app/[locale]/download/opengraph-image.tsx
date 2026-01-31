import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const alt = 'Download FitStream AI - iOS, Android & Web';
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
            right: '10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-10%',
            left: '10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}
          >
            💪
          </div>
          <span
            style={{
              fontSize: '40px',
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
            fontSize: '64px',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: '16px',
          }}
        >
          Download Now
        </span>

        <span
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            marginBottom: '48px',
          }}
        >
          Start your AI-powered fitness journey
        </span>

        {/* Platform buttons */}
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { icon: '🍎', name: 'App Store', sub: 'Download on the' },
            { icon: '🤖', name: 'Google Play', sub: 'Get it on' },
            { icon: '🌐', name: 'Web App', sub: 'Use in browser' },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '20px 32px',
                borderRadius: '16px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ fontSize: '40px' }}>{p.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>{p.sub}</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>{p.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
