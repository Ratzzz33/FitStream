# Landing Content Generation Status

> Последнее обновление: 2026-01-31

## Тексты ✅

| Файл | Статус |
|------|--------|
| `docs/content/features-copy.json` | ✅ 16 функций, RU + EN |
| `docs/content/image-prompts.md` | ✅ Промпты для Gemini |
| `docs/content/demo-gifs-guide.md` | ✅ Сценарии записи |

---

## Cover Images (16:9) ✅

Все 16 готовы в `landing/covers/`:

| Feature | Файл | Статус |
|---------|------|--------|
| poseTracking | `poseTracking.png` | ✅ |
| exercises | `exercises.png` | ✅ |
| smartKitchen | `smartKitchen.png` | ✅ |
| cookingMode | `cookingMode.png` | ✅ |
| nutritionScanner | `nutritionScanner.png` | ✅ |
| smartScale | `smartScale.png` | ✅ |
| healthIntegrations | `healthIntegrations.png` | ✅ |
| offlineFirst | `offlineFirst.png` | ✅ |
| multiLanguage | `multiLanguage.png` | ✅ |
| multiPlatform | `multiPlatform.png` | ✅ |
| aiCoach | `aiCoach.png` | ✅ |
| smartShopping | `smartShopping.png` | ✅ |
| foodFinance | `foodFinance.png` | ✅ |
| receiptScanning | `receiptScanning.png` | ✅ |
| gamification | `gamification.png` | ✅ |
| charts | `charts.png` | ✅ |

---

## Tile Images (1:1) — 48/64

В `landing/covers/tiles/`:

| Feature | Tiles | Статус |
|---------|-------|--------|
| poseTracking | realtime, exercises, feedback, counting | ✅ 4/4 |
| smartKitchen | scan, expiry, recipes, shopping | ✅ 4/4 |
| cookingMode | steps, timers, reminders, calories | ✅ 4/4 |
| nutritionScanner | photo, reference, macros, history | ✅ 4/4 |
| smartScale | bluetooth, metrics, charts, sync | ✅ 4/4 |
| healthIntegrations | googlefit, applehealth, samsung, metrics | ✅ 4/4 |
| offlineFirst | offline, storage, sync, reliable | ✅ 4/4 |
| multiLanguage | auto, switch, interface, content | ✅ 4/4 |
| multiPlatform | ios, android, web, telegram | ✅ 4/4 |
| aiCoach | motivation, voice, personas, adaptive | ✅ 4/4 |
| smartShopping | planning, lists, verify, scan | ✅ 4/4 |
| foodFinance | expenses, compare, reports, savings | ✅ 4/4 |
| **receiptScanning** | scan, extract, prices, history | ❌ 0/4 |
| **gamification** | achievements, streaks, leaderboard, challenges | ❌ 0/4 |
| **charts** | weight, calories, workouts, export | ❌ 0/4 |

### Догенерировать (когда лимит обновится):

```bash
npx tsx scripts/generate-landing-images.ts --tiles --feature=receiptScanning
npx tsx scripts/generate-landing-images.ts --tiles --feature=gamification
npx tsx scripts/generate-landing-images.ts --tiles --feature=charts
```

---

## Demo GIFs — 0/16

В `landing/demos/` (нужна ручная запись экрана):

| Feature | Файл | Статус | Приоритет |
|---------|------|--------|-----------|
| poseTracking | `poseTracking.gif` | ❌ | 🔴 Высокий |
| nutritionScanner | `nutritionScanner.gif` | ❌ | 🔴 Высокий |
| smartKitchen | `smartKitchen.gif` | ❌ | 🔴 Высокий |
| cookingMode | `cookingMode.gif` | ❌ | 🔴 Высокий |
| charts | `charts.gif` | ❌ | 🟡 Средний |
| smartScale | `smartScale.gif` | ❌ | 🟡 Средний |
| smartShopping | `smartShopping.gif` | ❌ | 🟡 Средний |
| receiptScanning | `receiptScanning.gif` | ❌ | 🟡 Средний |
| exercises | `exercises.gif` | ❌ | 🟢 Низкий |
| healthIntegrations | `healthIntegrations.gif` | ❌ | 🟢 Низкий |
| offlineFirst | `offlineFirst.gif` | ❌ | 🟢 Низкий |
| multiLanguage | `multiLanguage.gif` | ❌ | 🟢 Низкий |
| multiPlatform | `multiPlatform.gif` | ❌ | 🟢 Низкий |
| aiCoach | `aiCoach.gif` | ❌ | 🟢 Низкий |
| foodFinance | `foodFinance.gif` | ❌ | 🟢 Низкий |
| gamification | `gamification.gif` | ❌ | 🟢 Низкий |

### Как записать:

См. полный гайд: `docs/content/demo-gifs-guide.md`

```bash
# Конвертация видео в GIF
ffmpeg -i input.mp4 -vf "fps=15,scale=360:-1" -loop 0 output.gif
```

---

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| `scripts/generate-landing-images.ts` | Генерация картинок через Gemini Imagen 4 |

---

## Итого

| Категория | Готово | Всего | % |
|-----------|--------|-------|---|
| Тексты | 16 | 16 | 100% |
| Covers | 16 | 16 | 100% |
| Tiles | 48 | 64 | 75% |
| GIFs | 0 | 16 | 0% |
| **Общий прогресс** | **80** | **112** | **71%** |
