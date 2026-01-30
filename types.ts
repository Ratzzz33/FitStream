

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

export type GoalType = 'STEPS' | 'PUSHUPS' | 'SQUATS' | 'SITUPS' | 'JUMPING_JACKS' | 'LUNGES' | 'BURPEES' | 'DIPS' | 'PULLUPS';

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
  streak: number;
  lastActiveDate: string;
  theme: 'light' | 'dark';
  connectedPlatforms: ConnectedPlatforms;
  isPro: boolean;
  backendUrl?: string;
  coachVoice: string; // 'Fenrir' | 'Kore' etc.
  currency?: 'RUB' | 'USD' | 'EUR' | 'GBP' | 'KZT' | 'UAH'; // Currency for displaying prices
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
  WEIGHT = 'WEIGHT',
  SOCIAL = 'SOCIAL',
  SETTINGS = 'SETTINGS'
}

// === SMART KITCHEN TYPES ===

export type StorageType = 'fridge' | 'cabinet' | 'freezer';

export interface KitchenStorage {
  id: string;
  name: string;                    // "Холодильник", "Шкаф", "Морозилка"
  type: StorageType;
  photo?: string;                  // base64 или URL фото
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
  caloriesPer100: number;          // ккал на 100г/мл
  price?: number;                  // цена за единицу
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