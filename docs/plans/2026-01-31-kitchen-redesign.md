# Kitchen Page Redesign

## Overview

Redesign "My Kitchen" page for mobile-first UX. Minimal text, visual hierarchy, auto-detection of storage types.

## Problems

1. Unclear storage separation — tabs don't convey "different places"
2. No camera focus — can't tap to focus
3. Failed parsing — no retry button
4. Screen overflow — stats expand beyond viewport
5. Currency bug — wrong currency shown without conversion
6. Icon mismatch — Thermometer instead of fridge icon

---

## Design

### 1. Clean Header + Tiles UI

**Before (cluttered):**
```
┌────────────────────────────────┐
│ 🗄️ Моя Кухня          [+ Добавить] │
├────────────────────────────────┤
│ 📊 Всего продуктов: 35              │
│ 💰 ~12,500 ₾                        │
│ 📷 Фото: 3                          │
│ ⚠️ Скоро портится: 5                │
├────────────────────────────────┤
│ [Холодильник] [Шкафы] [Морозилка]   │
└────────────────────────────────┘
```

**After (clean):**
```
┌────────────────────────────────┐
│ ←  Кухня                    [+] │
├────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐     │
│ │ 🧊  12   │  │ ❄️  5    │     │
│ └──────────┘  └──────────┘     │
│ ┌──────────┐  ┌──────────┐     │
│ │ 📦  8    │  │ 🍳  15   │     │
│ └──────────┘  └──────────┘     │
├────────────────────────────────┤
│        [контент полки]          │
└────────────────────────────────┘
```

**Rules:**
- Header: just "Кухня" + "+" button
- 4 tiles in 2x2 grid: emoji + count only, NO text labels
- Fixed height 80px — no jumping
- Selected tile "embraces" content below (border continues down)
- Unselected tiles stay visible but muted
- ⚠️ badge on tile if expiring items inside

### 2. Camera: Focus, Exposure, Flash

```
┌────────────────────────────────┐
│  ✕                    ⚡A      │
├────────────────────────────────┤
│                                │
│         ┌────────┐             │
│         │        │  ☀️↕        │
│         │        │             │
│         └────────┘             │
│                                │
├────────────────────────────────┤
│   [📷]      ◯◯◯      [ ]       │
└────────────────────────────────┘
```

**Tap to Focus:**
- Tap anywhere → yellow focus square for 1.5s
- Focus at tap point using `focusPointOfInterest`

**Exposure:**
- After tap, swipe up/down to adjust exposure
- Sun icon (☀️) with slider appears near focus point
- Range: -2.0 to +2.0 EV

**Flash:**
- Button in camera header (top right)
- 3 states cycling: Auto (⚡A) → On (⚡) → Off (⚡̸)
- Default: Auto

**Center Guide:**
- Thin white rectangle in center — alignment helper

### 3. Retry Failed Parsing

**UI:**
```
┌─────────────────┐
│                 │
│   [photo]   ⚠️  │
│                 │
│  Нет продуктов  │
│  [🔄 Повторить]  │
└─────────────────┘
```

**Behavior:**
1. Photo with `parseStatus: 'empty'` shows ⚠️ badge
2. "Повторить" button below "Нет продуктов" text
3. Tap → spinner → re-scan single photo
4. Success → badge gone, products appear
5. Still empty → button remains

### 4. Currency/Prices Logic

```typescript
const hasPriceDatabase = (currency: CurrencyCode): boolean => {
  return currency === 'GEL'; // Only Georgia for now
};

const showPrices = hasPriceDatabase(settings.currency);
```

**If `showPrices === false`:**
- Hide all price displays
- Hide "💰" value line
- Hide prices in product list
- Hide "❌ waste value" for expiring items

**Always show:**
- Product counts
- Expiry dates

### 5. Fridge Icon

Replace `<Thermometer>` with custom SVG:

```tsx
const FridgeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="15" y1="5" x2="15" y2="7" />
    <line x1="15" y1="12" x2="15" y2="16" />
  </svg>
);
```

### 6. New Storage Type: Appliances

```typescript
export type StorageType = 'fridge' | 'cabinet' | 'freezer' | 'appliances';
```

**Items:** pans, pots, knives, boards, mixers, blenders, slow cookers

**Emoji:** 🍳

**AI Detection prompt addition:**
```
"Determine storage type:
- fridge: refrigerator (shelves, chilled products)
- freezer: freezer (ice, frozen products)
- cabinet: cabinet (dry goods, grains, canned)
- appliances: kitchen tools (cookware, appliances, utensils)"
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `types.ts` | Add `'appliances'` to StorageType |
| `components/Kitchen/Kitchen.tsx` | New tiles UI, clean header, price logic, fridge icon |
| `components/Kitchen/StoragePhoto.tsx` | Retry button, parseStatus |
| `services/geminiService.ts` | Add storage type detection to prompt |
| `services/storageService.ts` | Handle appliances type |

## Implementation Order

1. ✅ Design approved
2. [ ] Add 'appliances' to types.ts
3. [ ] Fix currency display logic (quick win)
4. [ ] Replace fridge icon (quick win)
5. [ ] Implement tiles UI (remove stats bar, 2x2 grid)
6. [ ] Add camera focus/exposure/flash
7. [ ] Add retry parsing button
8. [ ] Add AI storage type detection
9. [ ] Test on mobile

## Out of Scope

- Price databases for other countries
- Receipt scanning improvements
- Recipe integration
