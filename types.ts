

export interface ExerciseLog {
  id: string;
  date: string;
  timestamp: number;
  exerciseName: string;
  reps: number;
  feedback: string;
}

export interface BodyComposition {
  bodyFat?: number;        // Body fat percentage
  muscleMass?: number;     // Muscle mass in kg
  boneMass?: number;       // Bone mass in kg
  waterPercent?: number;   // Body water percentage
  visceralFat?: number;    // Visceral fat level (1-59)
  bmi?: number;            // Body Mass Index
  bmr?: number;            // Basal Metabolic Rate (kcal)
  metabolicAge?: number;   // Metabolic age in years
  proteinPercent?: number; // Protein percentage
  lbm?: number;            // Lean Body Mass in kg
  impedance?: number;      // Raw impedance value from scale
}

export interface WeightLog {
  id: string;
  date: string;
  timestamp: number;
  weight: number;
  photoUrl?: string;
  photoId?: string; // Reference to IndexedDB stored photo
  pendingAiAnalysis?: boolean; // Needs AI processing when online
  manualEntry?: boolean; // Was entered manually
  source?: 'manual' | 'ai_scan' | 'smart_scale'; // How the weight was recorded
  bodyComposition?: BodyComposition; // Body composition from smart scale
}

export interface SmartScaleDevice {
  id: string;
  name: string;
  type: 'xiaomi_v1' | 'xiaomi_v2' | 'unknown';
  connected: boolean;
  lastSeen?: number;
}

export interface NutritionLog {
    id: string;
    date: string;
    timestamp: number;
    type: 'FOOD' | 'WATER';
    name: string; // "Apple", "Glass of Water"
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    amount?: number; // volume in ml for water
    photoId?: string; // Reference to IndexedDB stored photo
    pendingAiAnalysis?: boolean; // Needs AI processing when online
    manualEntry?: boolean; // Was entered manually
}

// Pending item for sync queue
export interface PendingItem {
    id: string;
    type: 'NUTRITION' | 'WEIGHT' | 'EXERCISE';
    data: NutritionLog | WeightLog | ExerciseLog;
    photoId?: string;
    createdAt: number;
    retryCount: number;
    needsAiAnalysis: boolean;
}

export type GoalType = 'STEPS' | 'PUSHUPS' | 'SQUATS' | 'SITUPS' | 'JUMPING_JACKS' | 'LUNGES' | 'BURPEES' | 'DIPS' | 'PULLUPS' | 'PLANK' | 'MOUNTAIN_CLIMBERS' | 'CRUNCHES' | 'LEG_RAISES' | 'BICYCLE_CRUNCHES' | 'HIGH_KNEES';

export interface DailyGoal {
  type: GoalType;
  target: number;
  current: number;
  isEnabled: boolean;
  unit: string;
  color: string;
}

export interface ConnectedPlatforms {
  googleFit: boolean;
  appleHealth: boolean;
  lastSync: string | null;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
export type WeightGoal = 'LOSE' | 'MAINTAIN' | 'GAIN';

export interface UserSettings {
  name: string;
  email?: string; // Added for Google Auth
  googleId?: string; // Added for Google Auth
  telegramId?: number; // Added for Telegram Mini App
  avatar: string;
  age: number;
  height: number; // in cm
  gender: Gender;
  activityLevel: ActivityLevel;
  installDate: string; // For tracking free trial
  referenceObject: string; // e.g., "AirPods Case", "Credit Card"
  referenceDimensions?: string; // e.g., "8.5 x 5.4 cm"
  phoneModel: string;
  phoneWeight?: number; // Weight of the phone in kg
  goals: DailyGoal[];
  targetWeight: number;
  weightGoal?: WeightGoal; // LOSE, MAINTAIN, GAIN - auto-detected from current vs target weight
  streak: number;
  lastActiveDate: string;
  theme: 'light' | 'dark';
  connectedPlatforms: ConnectedPlatforms;
  isPro: boolean;
  backendUrl?: string;
  coachVoice: string; // 'Fenrir' | 'Kore' etc.
  currency?: 'RUB' | 'USD' | 'EUR' | 'GBP' | 'KZT' | 'UAH' | 'GEL'; // Currency for displaying prices
  language?: 'auto' | 'en' | 'ru' | 'es' | 'fr' | 'de' | 'zh'; // UI language
}

export interface Friend {
  id: string;
  name: string;
  score: number;
  avatar: string;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  WORKOUT = 'WORKOUT',
  NUTRITION = 'NUTRITION',
  SHOPPING = 'SHOPPING',
  WEIGHT = 'WEIGHT',
  SOCIAL = 'SOCIAL',
  SETTINGS = 'SETTINGS'
}

// === SMART KITCHEN TYPES ===

export type StorageType = 'fridge' | 'cabinet' | 'freezer';

export interface StoragePhoto {
  id: string;
  base64: string;                  // base64 фото
  createdAt: string;               // ISO date
  label?: string;                  // опциональная метка ("верхняя полка", "дверца")
}

export interface KitchenStorage {
  id: string;
  name: string;                    // "Холодильник", "Шкаф", "Морозилка"
  type: StorageType;
  photo?: string;                  // deprecated: single photo (для обратной совместимости)
  photos?: StoragePhoto[];         // массив фото для мультифото режима
  lastUpdated: string;             // ISO date
}

export interface InventoryItem {
  id: string;
  name: string;                    // "Молоко 2.5%"
  emoji?: string;                  // 🥛
  quantity: number;
  unit: string;                    // "мл", "г", "шт"
  storageId: string;               // к какому хранилищу относится
  expiresAt?: string;              // срок годности ISO date
  addedAt: string;
  source: 'photo' | 'receipt' | 'manual';
  position?: { x: number; y: number };  // координаты на фото для overlay (0-100%)
  photoId?: string;                // ID фото на котором распознан продукт (для мультифото)
  mergedFromPhotoIds?: string[];   // если продукт был на нескольких фото (дедупликация)
  caloriesPer100: number;          // ккал на 100г/мл
  price?: number;                  // цена за единицу
  depleted?: boolean;              // продукт закончился (показывать X на фото)
  depletedAt?: string;             // когда закончился
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;               // сгенерированное Nana Banana
  servings: number;
  totalTime: number;               // минуты
  caloriesPerServing: number;
  ingredients: RecipeIngredient[];
  steps: CookingStep[];
  createdAt: string;
}

export interface RecipeIngredient {
  inventoryItemId?: string;        // связь с инвентарём (если есть)
  name: string;
  emoji?: string;
  quantity: number;
  unit: string;
  available: boolean;              // есть ли в инвентаре
}

export interface CookingStep {
  id: string;
  order: number;
  instruction: string;
  imageUrl?: string;               // фото "как должно выглядеть"
  timerSeconds?: number;           // если нужен таймер
  heatLevel?: 1 | 2 | 3;           // 🔥 🔥🔥 🔥🔥🔥
  reminders: CookingReminder[];
  tip?: string;                    // подсказка "почему так делаем"
  troubleshoot?: TroubleshootOption[];
  doneWhen?: string;               // "Готово когда: жёлтая корочка"
}

export type ReminderType = 'stir' | 'flip' | 'check' | 'add' | 'reduce_heat' | 'cover' | 'custom';

export interface CookingReminder {
  type: ReminderType;
  intervalSeconds?: number;        // повторять каждые N сек
  atSeconds?: number;              // один раз через N сек
  message: string;
  icon: string;                    // 🥄 🔄 👀 и т.д.
}

export interface TroubleshootOption {
  problem: string;                 // "Пригорает"
  solution: string;                // "Убавь огонь, добавь масла"
  icon?: string;
}

export interface CookedMeal {
  id: string;
  recipeId: string;
  recipeName: string;
  photo?: string;
  cookedAt: string;
  servingsCooked: number;
  servingsEaten: number;
  caloriesEaten: number;
  ingredientsUsed: { itemId: string; quantity: number; unit: string }[];
}

export interface Leftover {
  id: string;
  name: string;                    // "Куриное филе с овощами"
  emoji?: string;
  portions: number;
  caloriesPerPortion: number;
  cookedAt: string;
  expiresAt: string;               // обычно +3 дня
  photo?: string;
  fromRecipeId?: string;
}

// PRD: Дневник | Кухня | Рецепты | Финансы
export type NutritionSubTab = 'diary' | 'kitchen' | 'recipes' | 'finance';

// === SMART SHOPPING ASSISTANT TYPES ===

export type CookingDifficulty = 'easy' | 'medium' | 'hard';
export type CookingTime = 'quick' | 'medium' | 'long'; // <30min, 30-60min, >60min

export interface ShoppingPreferences {
  daysCount: number;           // На сколько дней покупки
  peopleCount: number;         // На сколько человек
  cookingDifficulty: CookingDifficulty;
  maxCookingTime: CookingTime;
  dietaryRestrictions?: string[]; // "vegetarian", "low-carb", etc.
  budget?: number;             // Бюджет в рублях
  preferredStores?: string[];  // Любимые магазины
}

export interface ShoppingListItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  estimatedPrice?: number;
  forRecipes: string[];        // Для каких рецептов нужен
  isChecked: boolean;
  verifiedPhoto?: string;      // base64 фото для верификации
  verificationStatus?: 'pending' | 'correct' | 'wrong' | 'alternative';
  healthScore?: 1 | 2 | 3;     // 🟢🟡🔴
  healthNote?: string;         // "Много сахара, возьми без добавок"
  expiryReminder?: boolean;    // Напомнить проверить срок
  alternatives?: ShoppingAlternative[];
  alreadyHave?: boolean;       // Уже есть дома
  alreadyHaveQuantity?: number;
}

export type ShoppingCategory =
  | 'dairy'      // Молочные
  | 'meat'       // Мясо
  | 'fish'       // Рыба
  | 'vegetables' // Овощи
  | 'fruits'     // Фрукты
  | 'grains'     // Крупы
  | 'bread'      // Хлеб
  | 'frozen'     // Заморозка
  | 'drinks'     // Напитки
  | 'snacks'     // Снеки
  | 'spices'     // Специи
  | 'other';     // Прочее

export interface ShoppingAlternative {
  name: string;
  emoji: string;
  reason: string;              // "Дешевле на 30%", "Больше белка"
  healthScore: 1 | 2 | 3;
}

export interface ShoppingSession {
  id: string;
  createdAt: string;
  preferences: ShoppingPreferences;
  mealPlan: PlannedMeal[];
  shoppingList: ShoppingListItem[];
  status: 'planning' | 'shopping' | 'completed';
  totalEstimatedCost: number;
  actualCost?: number;
  store?: string;
}

export interface PlannedMeal {
  id: string;
  day: number;                 // 1, 2, 3...
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeName: string;
  recipeDescription: string;
  servings: number;
  calories: number;
  cookingTime: number;         // минуты
  difficulty: CookingDifficulty;
  ingredients: PlannedIngredient[];
}

export interface PlannedIngredient {
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  inInventory: boolean;
  inventoryQuantity?: number;
  needToBuy: number;
}

export interface ProductVerification {
  isCorrect: boolean;
  confidence: number;          // 0-100
  productName: string;
  healthScore: 1 | 2 | 3;
  healthAnalysis: string;
  expiryWarning?: string;      // "Срок годности через 2 дня!"
  betterAlternative?: {
    name: string;
    reason: string;
  };
  nutritionPer100: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    sugar?: number;
    fiber?: number;
  };
}