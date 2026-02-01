import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/home/Hero';
import { TrustBadges } from '@/components/home/TrustBadges';
import { HowItWorks } from '@/components/home/HowItWorks';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQ } from '@/components/home/FAQ';
import { StickyCTA } from '@/components/home/StickyCTA';
// import { SocialProof } from '@/components/home/SocialProof'; // Hidden until real data
import { BentoGrid } from '@/components/home/BentoGrid';
import { Pricing } from '@/components/home/Pricing';
import { DownloadCTA } from '@/components/home/DownloadCTA';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <TrustBadges />
      <HowItWorks />
      {/* <SocialProof /> - Hidden until real data available */}
      <BentoGrid />
      <Testimonials />
      <Pricing />
      <FAQ />
      <DownloadCTA />
      <StickyCTA />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'FitStream AI',
            applicationCategory: 'HealthApplication',
            operatingSystem: 'iOS, Android, Web',
            offers: [
              {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
                name: 'Free',
              },
              {
                '@type': 'Offer',
                price: '4.99',
                priceCurrency: 'EUR',
                name: 'Pro',
                priceValidUntil: '2027-12-31',
              },
            ],
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.8',
              ratingCount: '10000',
              bestRating: '5',
              worstRating: '1',
            },
            description:
              'AI-powered fitness and nutrition companion. Track workouts with pose detection, scan food for calories, manage kitchen inventory, and get personalized coaching.',
            featureList: [
              'AI Pose Tracking',
              'Smart Kitchen Management',
              'AI Food Scanner',
              'Guided Cooking Mode',
              'Smart Scale Integration',
              'Health Platform Sync',
            ],
          }),
        }}
      />
    </>
  );
}
