# FitStream AI

> **⚠️ STOP: Before making ANY code changes, you MUST be in a git worktree.**
> Run `git rev-parse --git-dir` - if it shows `.git` (not a path), you're in the main repo.
> Create a worktree first: `git worktree add ../FitStream-<feature> -b feature/<feature>`
> See "Git Workflow" section below. This is enforced by hooks.

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

## Git Workflow (MANDATORY - ENFORCED BY HOOKS)

**BLOCKING REQUIREMENT**: All code changes MUST be made in a git worktree. Direct edits to main branch are BLOCKED by pre-edit hooks.

### Before ANY Code Changes

```bash
# 1. FIRST: Create a worktree for the feature
git worktree add ../FitStream-<feature-name> -b feature/<feature-name>

# 2. THEN: cd into the worktree and start Claude Code there
cd ../FitStream-<feature-name>
claude
```

### After Completing Work

```bash
# 1. Commit and push
git add . && git commit -m "feat: description"
git push -u origin feature/<feature-name>

# 2. Create PR and wait for CI
gh pr create --fill
# WAIT for CI to pass - do NOT proceed until green

# 3. Merge to main
gh pr merge --merge

# 4. Return to main and cleanup
cd ../FitStream
git pull
git worktree remove ../FitStream-<feature-name>
```

### Rules (Enforced by `.claude/hooks/`)

1. **NO direct edits in main** - Hook blocks Edit/Write on source files in main repo
2. **NO worktree removal before merge** - Hook warns if branch not merged
3. **WAIT for CI** - Hook checks CI status before allowing cleanup

### If Hook Blocks You

If you see "BLOCKED: Editing source files directly in main branch":
1. Stop immediately
2. Create a worktree (command above)
3. Restart Claude Code in the worktree directory

## Documentation Sync

IMPORTANT: При добавлении/изменении функций:
1. Обновить `docs/features.json` — единый источник истины
2. Проверить соответствие на лендинге (`landing/index.html`)
3. Обновить скриншоты в `landing/screenshots/` если UI изменился

Лендинг должен всегда отражать актуальные возможности приложения.
