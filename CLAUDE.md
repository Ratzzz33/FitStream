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
- **Freemium**: `settings.isPro` gates premium features (no workout limits)
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

## Documentation Sync

IMPORTANT: При добавлении/изменении функций:
1. Обновить `docs/features.json` — единый источник истины
2. Проверить соответствие на лендинге (`landing/index.html`)
3. Обновить скриншоты в `landing/screenshots/` если UI изменился

Лендинг должен всегда отражать актуальные возможности приложения.

## Agent Rules (ОБЯЗАТЕЛЬНО)

### PR и Merge

**ЗАПРЕЩЕНО** мёрджить PR без прохождения CI:
1. После создания PR — дождаться завершения CI
2. Проверить статус: `gh pr checks <number>`
3. Мёрджить ТОЛЬКО если все checks зелёные (✅)
4. При красном CI — исправить ошибки, дождаться нового прогона

```bash
# Правильный flow
gh pr create --title "..." --body "..."
gh pr checks 123 --watch        # Ждать завершения CI
gh pr merge 123 --squash        # Только после зелёного CI
```

**ЗАПРЕЩЕНО**:
- `gh pr merge` без проверки CI статуса
- Игнорировать failed checks
- Использовать `--admin` флаг для обхода защиты

### Branch Protection

**ЗАПРЕЩЕНО** менять настройки branch protection без явного разрешения пользователя:
- Не трогать `gh api repos/.../branches/.../protection`
- Не менять required checks, reviewers, restrictions

При необходимости изменений — спросить пользователя.
