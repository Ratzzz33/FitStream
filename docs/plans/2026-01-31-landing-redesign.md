# FitStream Landing Page Redesign

**Date:** 2026-01-31
**Status:** Approved

## Overview

Create a comprehensive, modern landing page at `fitstream.health` with the web app moved to `app.fitstream.health`. The landing must be optimized for both SEO and AI search engines (ChatGPT, Perplexity, Gemini).

## Key Decisions

| Aspect | Decision |
|--------|----------|
| Tech Stack | Next.js 15 + Tailwind v4 + Motion |
| Content Strategy | Progressive disclosure (feature pages) |
| Interactivity | Moderate (scroll animations, interactive demos) |
| AI Optimization | Structured data + `/llms.txt` endpoint |
| i18n | Subdirectories (`/ru/`, `/es/`, etc.) |
| Theme | Light default + dark toggle |
| Hosting | AWS S3 + CloudFront (static export) |

## URL Structure

```
fitstream.health              → Landing (Next.js SSG)
app.fitstream.health          → Web App (React+Vite)
api.fitstream.health          → Backend (existing)

Landing routes:
/                             → Homepage
/features                     → All 16 features overview
/features/[slug]              → Detailed feature pages
/pricing                      → Free vs Pro comparison
/download                     → App Store, Google Play, Web
/llms.txt                     → AI-readable product info

Multilingual:
/ru/features/smart-kitchen
/es/features/smart-kitchen
...
```

## Homepage Sections

1. **Hero** - Dynamic headline, 2 CTAs, interactive phone demo
2. **Social Proof** - Stats, ratings, platform logos
3. **Bento Grid** - Top 6 features with hover animations
4. **All Features Preview** - Compact grid of remaining 10
5. **AI Section** - Gemini-powered features demo
6. **Pricing** - Compact Free vs Pro
7. **Download CTA** - Final conversion block
8. **Footer** - Links, legal, language switcher

## Feature Page Structure

1. Hero with video/image
2. "How it works" - 3-4 steps
3. Interactive demo or video
4. Detailed feature list (6-8 bullets)
5. FAQ section (3-5 Q&As with Schema.org)
6. CTA block
7. Related features

## AI/SEO Optimization

### Structured Data (JSON-LD)
- `Organization` - FitStream company info
- `SoftwareApplication` - App details, ratings
- `FAQPage` - On each feature page
- `HowTo` - Step-by-step guides
- `VideoObject` - For embedded videos
- `Product` + `Offer` - Pricing page

### `/llms.txt` Endpoint
Machine-readable product description for AI crawlers.

### Meta Tags
- Unique `<title>` and `<meta description>` per page
- Open Graph + Twitter Cards
- Canonical URLs
- hreflang for all 6 languages

## Visual Design

### Light Mode (default)
```
Background:     #FFFFFF / #FAFAFA
Text primary:   #0F172A (slate-900)
Text secondary: #64748B (slate-500)
Accent:         #2563EB (blue-600)
Success:        #10B981 (emerald-500)
Gradient:       blue-600 → emerald-500
```

### Dark Mode
```
Background:     #0F172A (slate-900)
Cards:          #1E293B (slate-800)
Text:           #F8FAFC (slate-50)
```

### Typography
- Font: Inter
- H1: 56-72px extrabold
- H2: 40-48px bold
- Body: 16-18px normal

## Project Structure

```
/landing
├── app/
│   ├── [locale]/
│   │   ├── page.tsx
│   │   ├── features/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── download/page.tsx
│   ├── llms.txt/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── features/
│   ├── home/
│   └── shared/
├── content/
├── messages/
├── public/
├── styles/globals.css
└── next.config.js
```

## Deployment

```bash
npm run build    # Static export
aws s3 sync out/ s3://fitstream-landing-xxx
aws cloudfront create-invalidation --distribution-id XXX
```

## Features to Document (16 total)

1. AI Pose Tracking (poseTracking)
2. 15 Trackable Exercises (exercises)
3. Smart Kitchen (smartKitchen)
4. Guided Cooking Mode (cookingMode)
5. AI Food Scanner (nutritionScanner)
6. Smart Scale Integration (smartScale)
7. Health Platform Sync (healthIntegrations)
8. Offline First (offlineFirst)
9. 6 Languages (multiLanguage)
10. Multi-Platform (multiPlatform)
11. AI Motivation Coach (aiCoach) - Premium
12. Smart Shopping Assistant (smartShopping)
13. Food Finance Tracker (foodFinance)
14. Receipt Scanning (receiptScanning)
15. Achievements & Leaderboard (gamification)
16. Analytics & Charts (charts)

## Languages

- English (en) - default
- Russian (ru)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
