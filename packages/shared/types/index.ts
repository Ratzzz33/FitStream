// @fitstream/shared - Shared types across all standalone apps

// === AUTH & USER ===

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';
export type WeightGoal = 'LOSE' | 'MAINTAIN' | 'GAIN';

export interface ConnectedPlatforms {
  googleFit: boolean;
  appleHealth: boolean;
  lastSync: string | null;
}

export type GoalType = 'STEPS' | 'CALORIES' | 'WATER' | 'PUSHUPS' | 'SQUATS' | 'SITUPS' | 'JUMPING_JACKS' | 'LUNGES' | 'BURPEES' | 'DIPS' | 'PULLUPS' | 'PLANK' | 'MOUNTAIN_CLIMBERS' | 'CRUNCHES' | 'LEG_RAISES' | 'BICYCLE_CRUNCHES' | 'HIGH_KNEES';

export interface DailyGoal {
  type: GoalType;
  target: number;
  current: number;
  isEnabled: boolean;
  unit: string;
  color: string;
}

export interface DietaryPreferences {
  vegetarian: boolean;
  diabetic: boolean;
  allergies?: string[];
}

export interface ShoppingPreferences {
  daysCount: number;
  peopleCount: number;
  cookingDifficulty: CookingDifficulty;
  maxCookingTime: CookingTime;
  dietaryRestrictions?: string[];
  budget?: number;
  preferredStores?: string[];
}

export type CookingDifficulty = 'easy' | 'medium' | 'hard';
export type CookingTime = 'quick' | 'medium' | 'long';

export interface UserSettings {
  name: string;
  email?: string;
  googleId?: string;
  telegramId?: number;
  avatar: string;
  age: number;
  height: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  installDate: string;
  referenceObject: string;
  referenceDimensions?: string;
  phoneModel: string;
  phoneWeight?: number;
  goals: DailyGoal[];
  targetWeight: number;
  weightGoal?: WeightGoal;
  streak: number;
  lastActiveDate: string;
  theme: 'light' | 'dark';
  connectedPlatforms: ConnectedPlatforms;
  isPro: boolean;
  isAdmin?: boolean;
  canTrainAi?: boolean;
  proUntil?: string;
  backendUrl?: string;
  coachVoice: string;
  currency?: 'RUB' | 'USD' | 'EUR' | 'GBP' | 'KZT' | 'UAH' | 'GEL';
  language?: 'auto' | 'en' | 'ru' | 'es' | 'fr' | 'de' | 'zh';
  shoppingPreferences?: ShoppingPreferences;
  dietaryPreferences?: DietaryPreferences;
  dailyCalorieGoal?: number;
  dailyProteinGoal?: number;
}

// === LOGGING ===

export interface ExerciseLog {
  id: string;
  date: string;
  timestamp: number;
  exerciseName: string;
  reps: number;
  feedback: string;
}

export interface BodyComposition {
  bodyFat?: number;
  muscleMass?: number;
  boneMass?: number;
  waterPercent?: number;
  visceralFat?: number;
  bmi?: number;
  bmr?: number;
  metabolicAge?: number;
  proteinPercent?: number;
  lbm?: number;
  impedance?: number;
}

export interface WeightLog {
  id: string;
  date: string;
  timestamp: number;
  weight: number;
  photoUrl?: string;
  photoId?: string;
  pendingAiAnalysis?: boolean;
  manualEntry?: boolean;
  source?: 'manual' | 'ai_scan' | 'smart_scale';
  bodyComposition?: BodyComposition;
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
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  amount?: number;
  photoId?: string;
  pendingAiAnalysis?: boolean;
  manualEntry?: boolean;
}

export interface PendingItem {
  id: string;
  type: 'NUTRITION' | 'WEIGHT' | 'EXERCISE';
  data: NutritionLog | WeightLog | ExerciseLog;
  photoId?: string;
  createdAt: number;
  retryCount: number;
  needsAiAnalysis: boolean;
}

// === BILLING ===

export interface UserBalance {
  balanceCents: number;
  balanceDollars: string;
  isTrialActive: boolean;
  trialDaysLeft: number;
  trialUsageCents: number;
  trialUsageDollars: string;
  isLowBalance: boolean;
  isBlocked: boolean;
}

export interface UsageStats {
  today: { cents: number; dollars: string };
  week: { cents: number; dollars: string };
  month: { cents: number; dollars: string };
  byType: Array<{ type: string; cents: number; dollars: string }>;
}

export interface ChargeResult {
  allowed: boolean;
  charged?: number;
  trial?: boolean;
  reason?: string;
}

export type BillingActionType =
  | 'food_scan'
  | 'food_scan_cost'
  | 'receipt_scan'
  | 'storage_scan'
  | 'menu_scan'
  | 'recipe_ai'
  | 'scale_scan'
  | 'showcase_scan';

export interface EconomySettings {
  recipeImages: 'ai' | 'database' | 'none';
  recipeSource: 'ai' | 'database' | 'hybrid';
  foodAnalysis: 'full' | 'basic';
}

// === SOCIAL ===

export interface Friend {
  id: string;
  name: string;
  score: number;
  avatar: string;
}

// === KITCHEN / INVENTORY (shared between FridgeTracker, CookBot, SmartCart) ===

export type StorageType = 'fridge' | 'cabinet' | 'freezer' | 'appliances';

export interface StoragePhoto {
  id: string;
  base64: string;
  createdAt: string;
  label?: string;
  parseStatus?: 'success' | 'empty' | 'error';
}

export interface KitchenStorage {
  id: string;
  name: string;
  type: StorageType;
  photo?: string;
  photos?: StoragePhoto[];
  lastUpdated: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  emoji?: string;
  quantity: number;
  unit: string;
  storageId: string;
  expiresAt?: string;
  addedAt: string;
  source: 'photo' | 'receipt' | 'manual';
  position?: { x: number; y: number };
  photoId?: string;
  mergedFromPhotoIds?: string[];
  caloriesPer100: number;
  price?: number;
  depleted?: boolean;
  depletedAt?: string;
}

// === RECIPES (shared between CookBot, SmartCart) ===

export type RecipeCategory = 'breakfast' | 'salad' | 'soup' | 'main' | 'dessert' | 'snack' | 'drink' | 'side';

export interface Recipe {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  servings: number;
  totalTime: number;
  caloriesPerServing: number;
  ingredients: RecipeIngredient[];
  steps: CookingStep[];
  createdAt: string;
}

export interface RecipeIngredient {
  inventoryItemId?: string;
  name: string;
  emoji?: string;
  quantity: number;
  unit: string;
  available: boolean;
}

export interface CookingStep {
  id: string;
  order: number;
  instruction: string;
  imageUrl?: string;
  timerSeconds?: number;
  heatLevel?: 1 | 2 | 3;
  reminders: CookingReminder[];
  tip?: string;
  troubleshoot?: TroubleshootOption[];
  doneWhen?: string;
}

export type ReminderType = 'stir' | 'flip' | 'check' | 'add' | 'reduce_heat' | 'cover' | 'custom';

export interface CookingReminder {
  type: ReminderType;
  intervalSeconds?: number;
  atSeconds?: number;
  message: string;
  icon: string;
}

export interface TroubleshootOption {
  problem: string;
  solution: string;
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
  name: string;
  emoji?: string;
  portions: number;
  caloriesPerPortion: number;
  cookedAt: string;
  expiresAt: string;
  photo?: string;
  fromRecipeId?: string;
}

// === SHOPPING (SmartCart) ===

export type ShoppingCategory =
  | 'dairy'
  | 'meat'
  | 'fish'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'bread'
  | 'frozen'
  | 'drinks'
  | 'snacks'
  | 'spices'
  | 'other';

export interface ShoppingListItem {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  estimatedPrice?: number;
  forRecipes: string[];
  isChecked: boolean;
  verifiedPhoto?: string;
  verificationStatus?: 'pending' | 'correct' | 'wrong' | 'alternative';
  healthScore?: 1 | 2 | 3;
  healthNote?: string;
  expiryReminder?: boolean;
  alternatives?: ShoppingAlternative[];
  alreadyHave?: boolean;
  alreadyHaveQuantity?: number;
}

export interface ShoppingAlternative {
  name: string;
  emoji: string;
  reason: string;
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
  day: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeName: string;
  recipeDescription: string;
  servings: number;
  calories: number;
  cookingTime: number;
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
  confidence: number;
  productName: string;
  healthScore: 1 | 2 | 3;
  healthAnalysis: string;
  expiryWarning?: string;
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

// === RESTAURANT MENU (MenuScan) ===

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface CachedMenuItem {
  id: string;
  name: string;
  description?: string;
  price?: number;
  currency?: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  healthScore: 1 | 2 | 3;
  category: 'BEST_CHOICE' | 'HIGH_PROTEIN' | 'LESSER_OF_EVILS' | 'REGULAR';
  tags?: string[];
  photoHash?: string;
}

export interface CachedRestaurant {
  id: string;
  name: string;
  normalizedName: string;
  location: GeoLocation;
  address?: string;
  city: string;
  country: string;
  cuisine?: string[];
  menuItems: CachedMenuItem[];
  healthyScore: number;
  healthyItemsCount: number;
  lastUpdated: string;
  scanCount: number;
  deliveryPlatforms?: ('glovo' | 'bolt' | 'wolt')[];
  glovoSlug?: string;
  boltSlug?: string;
}

export interface RestaurantMapPoint {
  id: string;
  name: string;
  location: GeoLocation;
  healthyScore: number;
  healthyItemsCount: number;
  cuisine?: string[];
}

export interface MenuCacheStats {
  totalRestaurants: number;
  totalItems: number;
  byCity: Record<string, number>;
  byCountry: Record<string, number>;
  lastScanDate: string;
  tokensSaved: number;
}
