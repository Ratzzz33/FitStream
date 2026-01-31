import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const llmsContent = `# FitStream AI
> AI-powered fitness and nutrition companion

## Overview
FitStream AI is a comprehensive fitness and nutrition tracking application that uses artificial intelligence to help users achieve their health goals. Available on iOS, Android, Web, and Telegram Mini App.

## Key Features

### AI Pose Tracking
Real-time exercise form analysis using MediaPipe. Tracks 15 different exercises with automatic rep counting and form feedback. Works entirely on-device without cloud processing.

Supported exercises:
- Squats, Push-ups, Sit-ups, Lunges, Burpees
- Jumping Jacks, High Knees, Mountain Climbers
- Plank, Wall Sit, Leg Raises, Glute Bridges
- Calf Raises, Side Lunges, Tricep Dips

### Smart Kitchen
Manage your fridge, pantry, and freezer inventory. AI recognizes products from photos, tracks expiry dates, and suggests recipes based on available ingredients.

### AI Food Scanner
Take a photo of any meal to get instant calorie and macro estimates. Uses a reference object (like a credit card) for accurate portion sizing.

### Guided Cooking Mode
Step-by-step recipe instructions with integrated timers, stir/flip reminders, and troubleshooting tips. Automatically logs calories when cooking is complete.

### Smart Scale Integration
- Bluetooth connection to Xiaomi Mi Scale for body composition analysis
- Camera-based scale reading using AI vision
- Tracks: weight, body fat, muscle mass, bone mass, BMI

### Health Platform Sync
Seamlessly syncs with:
- Google Fit
- Apple Health
- Samsung Health

### Additional Features
- Offline-first: Full functionality without internet
- 6 languages: English, Russian, Spanish, French, German, Chinese
- Achievements & leaderboard for gamification
- Food finance tracking (spending, home cooking vs eating out)
- Receipt scanning for automatic inventory updates
- Smart shopping assistant with meal planning

## Pricing

### Free Plan
- Unlimited workouts
- AI Scale Scanner
- AI Food Scanner
- Daily Goals & Streaks
- Progress Charts
- 10 AI requests per day
- 7 days history

### Pro Plan - €4.99/month
- Everything in Free
- Unlimited AI requests
- Body Composition Analysis
- Restaurant Menu Analyzer
- Voice Assistant
- PDF Export
- Unlimited history
- Priority Support

## Technical Details
- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Mobile: Capacitor 6 (iOS/Android native)
- AI: Google Gemini 2.5 Flash
- Backend: Express.js + PostgreSQL

## Links
- Website: https://fitstream.health
- Web App: https://app.fitstream.health
- Download: https://fitstream.health/download
- API: https://api.fitstream.health

## Contact
- Support: support@fitstream.health
- Privacy Policy: https://fitstream.health/privacy
- Terms of Service: https://fitstream.health/terms

## Last Updated
${new Date().toISOString().split('T')[0]}
`;

export async function GET() {
  return new NextResponse(llmsContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
