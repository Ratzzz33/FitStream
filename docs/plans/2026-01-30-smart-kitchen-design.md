# Smart Kitchen для FitStream — Дизайн-документ

**Дата:** 2026-01-30
**Статус:** Ready for Implementation
**Основа:** docs/smart-kitchen-prd.md

---

## Обзор

Интеграция двух новых блоков в таб Nutrition:
- **Кухня** — инвентарь продуктов (холодильник/шкафы) с AI-распознаванием
- **Готовка** — AI-рецепты из инвентаря с пошаговыми таймерами

**Главная цель:** помочь похудеть через удобный трекинг калорий домашней еды.

**UX-философия:** минимум кликов, AI угадывает, пользователь только подтверждает.

---

## Скоуп MVP

### Включено:
- Фото холодильника/шкафов с AI-распознаванием продуктов (Gemini)
- Сканирование чеков для добавления покупок (Gemini)
- Ручное добавление продуктов (когда AI ошибся)
- AI-рецепты из имеющихся продуктов
- Пошаговая готовка с таймерами и напоминаниями
- Beginner-friendly UI с фото каждого шага
- "I Cooked This" — автовычитание продуктов + запись калорий
- Генерация фото блюд (Nana Banana 2+)

### Отложено на v2:
- Расчёт экономии (домашняя еда vs ресторан)
- Интеграции с магазинами (ВкусВилл, Lavka)
- Финансовая аналитика трат на еду
- Голосовые подсказки

---

## Архитектура

### Новые компоненты

```
components/
├── Kitchen/
│   ├── Kitchen.tsx              # Главный компонент
│   ├── StoragePhoto.tsx         # Фото с overlay метками
│   ├── ProductMarker.tsx        # Метка продукта на фото
│   ├── ProductList.tsx          # Список продуктов
│   ├── AddProductModal.tsx      # Ручное добавление
│   └── ScanReceiptModal.tsx     # Сканирование чека
│
├── Cooking/
│   ├── Cooking.tsx              # Главный компонент
│   ├── RecipeCard.tsx           # Карточка рецепта
│   ├── CookingMode.tsx          # Режим готовки
│   ├── CookingStep.tsx          # Шаг с таймером
│   ├── CookingComplete.tsx      # "I Cooked This" финал
│   └── TroubleshootTip.tsx      # "Что-то пошло не так?"
│
└── NutritionTracker.tsx         # Обновить — добавить табы

services/
├── geminiService.ts             # Добавить новые AI функции
├── storageService.ts            # Добавить kitchen/cooking данные
└── nanaBananaService.ts         # NEW: генерация фото блюд
```

### Интеграция в NutritionTracker

```
┌─────────────────────────────────────────────────┐
│  🍎 Питание                      Сегодня ▼     │
├─────────────────────────────────────────────────┤
│  ████████████░░░░░░ 1450 / 2000 ккал           │
├─────────────────────────────────────────────────┤
│  [📸 Еда]  [🍽 Меню]  [🗄 Кухня]  [👨‍🍳 Готовить] │
├─────────────────────────────────────────────────┤
│  (содержимое выбранного блока)                 │
└─────────────────────────────────────────────────┘
```

---

## Типы данных (types.ts)

```typescript
// === KITCHEN TYPES ===

interface KitchenStorage {
  id: string;
  name: string;                    // "Холодильник", "Шкаф", "Морозилка"
  photo?: string;                  // base64 или URL фото
  lastUpdated: string;             // ISO date
}

interface InventoryItem {
  id: string;
  name: string;                    // "Молоко 2.5%"
  quantity: number;
  unit: string;                    // "мл", "г", "шт"
  storageId: string;               // к какому хранилищу относится
  expiresAt?: string;              // срок годности
  addedAt: string;
  source: 'photo' | 'receipt' | 'manual';
  position?: { x: number; y: number };  // координаты на фото для overlay
  calories?: number;               // ккал на 100г/мл
  price?: number;                  // цена (для будущей экономии)
}

// === COOKING TYPES ===

interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;               // сгенерированное Nana Banana
  servings: number;
  totalTime: number;               // минуты
  calories: number;                // на порцию
  ingredients: RecipeIngredient[];
  steps: CookingStep[];
}

interface RecipeIngredient {
  inventoryItemId?: string;        // связь с инвентарём
  name: string;
  quantity: number;
  unit: string;
  available: boolean;              // есть ли в инвентаре
}

interface CookingStep {
  id: string;
  order: number;
  instruction: string;
  imageUrl?: string;               // фото "как должно выглядеть"
  timerSeconds?: number;           // если нужен таймер
  reminders: CookingReminder[];    // напоминания (помешать, перевернуть)
  tips?: string;                   // подсказка "почему так делаем"
  troubleshoot?: TroubleshootOption[];  // "что-то пошло не так"
}

interface CookingReminder {
  type: 'stir' | 'flip' | 'check' | 'add' | 'reduce_heat' | 'custom';
  intervalSeconds?: number;        // повторять каждые N сек
  atSeconds?: number;              // один раз через N сек
  message: string;
  icon: string;                    // 🥄 🔄 👀 и т.д.
}

interface TroubleshootOption {
  problem: string;                 // "Пригорает"
  solution: string;                // "Убавь огонь, добавь масла"
}

interface CookedMeal {
  id: string;
  recipeId: string;
  recipeName: string;
  photo?: string;
  cookedAt: string;
  servingsCooked: number;
  servingsEaten: number;
  caloriesEaten: number;
  ingredientsUsed: { itemId: string; quantity: number }[];
}

interface Leftover {
  id: string;
  name: string;                    // "Куриное филе с овощами"
  portions: number;
  caloriesPerPortion: number;
  cookedAt: string;
  expiresAt: string;               // обычно +3 дня
  photo?: string;
}
```

---

## AI-функции (geminiService.ts)

```typescript
/** Распознать продукты на фото холодильника/шкафа */
async function scanStoragePhoto(
  photoBase64: string,
  storageType: 'fridge' | 'cabinet' | 'freezer'
): Promise<InventoryItem[]>

/** Распознать продукты из чека */
async function scanReceipt(
  photoBase64: string
): Promise<{ items: InventoryItem[]; totalPrice: number; store?: string }>

/** Сгенерировать рецепты из доступных продуктов */
async function generateRecipes(
  inventory: InventoryItem[],
  context: {
    timeOfDay: 'breakfast' | 'lunch' | 'dinner';
    caloriesRemaining: number;
    servingsNeeded: number;
    excludeRecent?: string[];      // не повторять недавние
  }
): Promise<Recipe[]>

/** Рассчитать калории готового блюда */
async function calculateCookedMealCalories(
  recipe: Recipe,
  actualServings: number,
  portionsEaten: number
): Promise<{ totalCalories: number; caloriesEaten: number }>
```

---

## UI Спецификации

### Блок "Кухня"

```
┌─────────────────────────────────────────────────┐
│  🗄️ Моя Кухня                    [+ Добавить]  │
├─────────────────────────────────────────────────┤
│  📊 Продуктов: 24   ⚠️ Портится: 3              │
├─────────────────────────────────────────────────┤
│  [🧊 Холодильник]  [📦 Шкафы]  [❄️ Морозилка]   │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │   [ФОТО ХОЛОДИЛЬНИКА С OVERLAY МЕТКАМИ]   │  │
│  │                                           │  │
│  │   ┌──────┐                                │  │
│  │   │🥛    │← тап = редактировать           │  │
│  │   │Молоко│                                │  │
│  │   │2дн 🔴│← индикатор срока              │  │
│  │   └──────┘                                │  │
│  │                                           │  │
│  │   [📷 Обновить фото]                      │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  📋 Список (12)                        [▼]     │
│  ├─ 🥛 Молоко 2.5% · 400мл · 2 дня 🔴          │
│  ├─ 🧀 Сыр · 200г · 10 дней                    │
│  └─ [+ Добавить пропущенное]                   │
└─────────────────────────────────────────────────┘
```

**Меню "+ Добавить":**
- 📷 Сфотографировать хранилище
- 🧾 Сканировать чек
- ✏️ Добавить вручную

### Блок "Готовка" — выбор рецепта (zero-click)

```
┌─────────────────────────────────────────────────┐
│  👨‍🍳 Ужин готов к старту                        │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │           [AI-ФОТО БЛЮДА]                 │  │
│  │                                           │  │
│  │      Куриное филе с овощами               │  │
│  │      ⏱ 25 мин · 🔥 380 ккал              │  │
│  │                                           │  │
│  │      ⚠️ Курица портится завтра            │  │
│  │                                           │  │
│  │        [🍳 ГОТОВИТЬ]                      │  │
│  │                                           │  │
│  │         [↻ Другой вариант]               │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**AI автоматически учитывает:**
- Время суток → тип блюда
- Что портится → приоритет ингредиентов
- Историю → не повторять
- Остаток калорий → вписать в цель

### Режим готовки (beginner-friendly)

```
┌─────────────────────────────────────────────────┐
│  ← Куриное филе                    Шаг 2 из 6  │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐  │
│  │    [AI-ФОТО: как должно выглядеть]        │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  🍳 Пожарить курицу                            │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ 🔥🔥🔥 Сильный огонь                       │  │
│  │ ⏱️ 5-7 минут                              │  │
│  │ 🥄 Помешивай каждую минуту                │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ✅ Готово когда: жёлтая корочка, нет розового │
│                                                 │
│  💡 Подсказка                            [▼]   │
│  │ Почему сильный огонь? Курица будет        │
│  │ сочной внутри и хрустящей снаружи.        │
│                                                 │
│  😰 Что-то не так?                       [▼]   │
│  │ [Пригорает] → Убавь огонь, добавь масла   │
│  │ [Не жарится] → Прибавь огонь, подожди     │
│                                                 │
│       ⏱️ ████████░░░░░░ 4:23                   │
│                                                 │
├─────────────────────────────────────────────────┤
│             [✓ Получилось!]                    │
└─────────────────────────────────────────────────┘
```

**Иконки:**
- 🔥 / 🔥🔥 / 🔥🔥🔥 = слабый/средний/сильный огонь
- ⏱️ = время
- 🥄 = помешивать
- 🔄 = перевернуть
- 👀 = проверить
- 🧂 = посолить

### Напоминания во время готовки

```
┌─────────────────────────────────────────────────┐
│                                                 │
│         🥄                                      │
│                                                 │
│    Помешай курицу                              │
│                                                 │
│         [👍 Ок]                                 │
│                                                 │
└─────────────────────────────────────────────────┘
        + вибрация + звук
```

### "I Cooked This" — завершение

```
┌─────────────────────────────────────────────────┐
│  🎉 Готово!                                     │
├─────────────────────────────────────────────────┤
│                                                 │
│         [📷 ФОТО ТВОЕГО БЛЮДА]                 │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  Куриное филе с овощами                        │
│  4 порции · 380 ккал каждая                    │
│                                                 │
│  Съедаю сейчас:                                │
│        ◀︎    [2 порции]    ▶︎                   │
│             760 ккал                            │
│                                                 │
│  В холодильник: 2 порции                       │
│                                                 │
├─────────────────────────────────────────────────┤
│           [✓ Сохранить]                        │
└─────────────────────────────────────────────────┘
```

**Автоматически при сохранении:**
1. Вычитаются продукты из инвентаря
2. Калории → NutritionLog
3. Остатки → Leftovers в холодильнике
4. Фото → история

---

## Хранение данных (storageService.ts)

```typescript
const STORAGE_KEYS = {
  KITCHEN_STORAGES: 'kitchen_storages',
  INVENTORY: 'inventory',
  COOKING_HISTORY: 'cooking_history',
  LEFTOVERS: 'leftovers',
};

// Новые методы
function getInventory(): InventoryItem[]
function saveInventoryItem(item: InventoryItem): void
function removeInventoryItem(id: string): void
function updateInventoryQuantity(id: string, delta: number): void
function getExpiringItems(days: number): InventoryItem[]

function getStorages(): KitchenStorage[]
function saveStoragePhoto(storageId: string, photo: string): void

function getCookingHistory(): CookedMeal[]
function saveCookedMeal(meal: CookedMeal): void

function getLeftovers(): Leftover[]
function saveLeftover(leftover: Leftover): void
function removeLeftover(id: string): void
```

---

## План реализации MVP

### Фаза 1: Фундамент (2-3 дня)
- [ ] Создать git worktree `feature/smart-kitchen`
- [ ] Добавить типы в `types.ts`
- [ ] Расширить `storageService.ts`
- [ ] Создать структуру папок `Kitchen/` и `Cooking/`
- [ ] Создать `nanaBananaService.ts`

### Фаза 2: Кухня — инвентарь (3-4 дня)
- [ ] `Kitchen.tsx` — базовый layout
- [ ] `geminiService.scanStoragePhoto()`
- [ ] `StoragePhoto.tsx` — фото с overlay
- [ ] `ProductMarker.tsx` — метка продукта
- [ ] `ProductList.tsx` — список
- [ ] `AddProductModal.tsx` — ручное добавление
- [ ] `geminiService.scanReceipt()`
- [ ] `ScanReceiptModal.tsx`

### Фаза 3: Готовка — рецепты (3-4 дня)
- [ ] `geminiService.generateRecipes()`
- [ ] `Cooking.tsx` — главный экран
- [ ] `RecipeCard.tsx`
- [ ] Генерация фото блюд (Nana Banana)
- [ ] Интеграция с инвентарём

### Фаза 4: Готовка — процесс (3-4 дня)
- [ ] `CookingMode.tsx`
- [ ] `CookingStep.tsx` с таймером
- [ ] Система напоминаний (помешать, перевернуть)
- [ ] `TroubleshootTip.tsx`
- [ ] Фото для каждого шага

### Фаза 5: Завершение (2-3 дня)
- [ ] `CookingComplete.tsx`
- [ ] Автовычитание из инвентаря
- [ ] Запись калорий в `NutritionLog`
- [ ] Сохранение leftovers
- [ ] Интеграция в `NutritionTracker.tsx`
- [ ] E2E тестирование

**Итого: ~2 недели**

---

## Зависимости

- **Gemini API** — уже интегрирован (`geminiService.ts`)
- **Nana Banana 2+** — новый сервис для генерации фото
- **Camera API** — уже используется для анализа еды
- **localStorage** — существующий паттерн

---

## Риски и митигации

| Риск | Митигация |
|------|-----------|
| Gemini плохо распознаёт продукты | Ручное добавление + возможность коррекции |
| Генерация фото дорогая | Кэширование по ингредиентам, lazy loading |
| Сложный UI готовки | Итеративное упрощение по фидбеку |
| Неточные калории | Возможность коррекции порций |
