import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fitstream.health'),
  title: {
    default: 'FitStream AI - AI-Powered Fitness & Nutrition Companion',
    template: '%s | FitStream AI',
  },
  description:
    'Track workouts with AI pose detection, scan food for calories, manage your kitchen inventory, and get personalized coaching. Available on iOS, Android, and Web.',
  keywords: [
    'fitness app',
    'AI fitness',
    'calorie tracker',
    'workout tracker',
    'pose detection',
    'nutrition app',
    'meal planning',
    'smart kitchen',
  ],
  authors: [{ name: 'FitStream' }],
  creator: 'FitStream',
  publisher: 'FitStream',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://fitstream.health',
    siteName: 'FitStream AI',
    title: 'FitStream AI - AI-Powered Fitness & Nutrition Companion',
    description:
      'Track workouts with AI pose detection, scan food for calories, manage your kitchen inventory, and get personalized coaching.',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'FitStream AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitStream AI - AI-Powered Fitness & Nutrition Companion',
    description:
      'Track workouts with AI pose detection, scan food for calories, and get personalized coaching.',
    images: ['/og/default.png'],
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon-192.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
