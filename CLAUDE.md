# FitStream AI

AI-powered fitness tracking app with React + Capacitor for iOS/Android.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Mobile**: Capacitor 6 (iOS/Android native)
- **AI**: Google Gemini 2.5 Flash (`@google/genai`)
- **Backend**: Express.js + PostgreSQL (in `/backend`)
- **Charts**: Recharts

## Commands

```bash
# Development
npm run dev              # Start Vite dev server

# Build
npm run build           # Production build

# Mobile
npm run cap:sync        # Sync web assets to native
npm run cap:android     # Open Android Studio
npm run cap:ios         # Open Xcode
npm run cap:build:android  # Build + sync Android
npm run cap:build:ios      # Build + sync iOS

# Backend (from /backend)
npm start               # Start Express server
```

## Project Structure

```
/                    # React frontend
├── App.tsx          # Main app with tabs, routing, state
├── components/      # UI components (WorkoutSession, NutritionTracker, etc.)
├── services/
│   ├── geminiService.ts  # All Gemini AI integrations
│   ├── storageService.ts # LocalStorage + backend sync
│   ├── api.ts            # Backend API calls
│   └── i18n.ts           # Internationalization
├── types.ts         # TypeScript interfaces
└── backend/         # Express.js server
    └── server.js    # API endpoints, PostgreSQL
```

## AI Features (Gemini)

All AI calls in `services/geminiService.ts`:
- `scanScaleDisplay()` - Read weight from scale photo
- `analyzeFood()` - Estimate calories from food photo + reference object
- `analyzeMenu()` - Restaurant menu recommendations
- `getPhoneSpecs()` - Phone weight lookup for scale tare
- `getMotivation()` - Personalized motivational quotes

API key via `process.env.API_KEY`.

## Key Patterns

- **Offline-first**: LocalStorage primary, backend sync secondary
- **Auto-save**: Settings debounced 1.5s, show save indicator
- **Freemium**: `settings.isPro` gates features (3 workouts/week limit)
- **Tabs**: Dashboard, Nutrition, Workout, Social, Settings
- **Theme**: `settings.theme` ('light'|'dark'), class-based Tailwind

## Gotchas

- Google Sign-In uses hardcoded client ID in App.tsx:73
- Phone weight scan requires camera + AI lookup before use
- Reference object (credit card, etc.) needed for food portion estimation
- Backend URL configurable via `settings.backendUrl`
- Coach voice: 'Fenrir' (male) or 'Kore' (female) for Gemini TTS

## Types

Main interfaces in `types.ts`:
- `UserSettings` - User profile, goals, preferences
- `DailyGoal` - Goal type, target, current, color
- `ExerciseLog`, `WeightLog`, `NutritionLog` - Activity records
- `GoalType` - STEPS, PUSHUPS, SQUATS, SITUPS, etc.

## Code Style

- Functional components with hooks
- State in App.tsx, passed via props
- Tailwind for styling (no CSS files)
- Icons from `lucide-react`
- Named exports for services, default export for components

## Git Workflow

IMPORTANT: Все новые фичи и правки делать в отдельном git worktree:

```bash
# Создать worktree для новой фичи
git worktree add ../FitStream-<feature-name> -b feature/<feature-name>

# После завершения — merge и удалить
git worktree remove ../FitStream-<feature-name>
```

Никогда не коммитить напрямую в main без worktree!

## Documentation Sync

IMPORTANT: При добавлении/изменении функций:
1. Обновить `docs/features.json` — единый источник истины
2. Проверить соответствие на лендинге (`landing/index.html`)
3. Обновить скриншоты в `landing/screenshots/` если UI изменился

Лендинг должен всегда отражать актуальные возможности приложения.
