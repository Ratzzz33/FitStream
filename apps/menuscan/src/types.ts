// MenuScan-specific types
// Re-export shared types used by MenuScan
export type {
  CachedRestaurant,
  CachedMenuItem,
  GeoLocation,
  RestaurantMapPoint,
  MenuCacheStats,
  NutritionLog,
  UserSettings,
  WeightGoal,
  ActivityLevel,
  Gender,
  BillingActionType,
} from '@fitstream/shared';

// Menu analysis types (used by geminiService)
export interface MenuRecommendation {
  dishName: string;
  calories: number;
  protein: number;
  category: 'BEST_CHOICE' | 'HIGH_PROTEIN' | 'LESSER_OF_EVILS';
  reasoning: string;
}

export interface MenuAnalysisResult {
  recommendations: MenuRecommendation[];
  restaurantName?: string;
  allItems?: MenuItemAnalysis[];
  fromCache: boolean;
  cachedRestaurant?: import('@fitstream/shared').CachedRestaurant;
}

export interface MenuAnalysisOptions {
  restaurantName?: string;
  location?: import('@fitstream/shared').GeoLocation;
  city?: string;
  country?: string;
  forceRefresh?: boolean;
}

export interface MenuItemAnalysis {
  name: string;
  calories: number;
  protein: number;
  healthScore: 1 | 2 | 3;
  category: 'BEST_CHOICE' | 'HIGH_PROTEIN' | 'LESSER_OF_EVILS' | 'REGULAR';
  description?: string;
  price?: number;
  currency?: string;
  carbs?: number;
  fat?: number;
  tags?: string[];
}

// Photo type detection
export type PhotoContentType = 'FOOD' | 'MENU' | 'QR_MENU' | 'UNKNOWN';

export interface PhotoTypeDetectionResult {
  type: PhotoContentType;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  qrUrl?: string;
}

// Menu scan history entry
export interface MenuScanEntry {
  id: string;
  restaurantName: string;
  scannedAt: string;
  photoBase64?: string;
  recommendations: MenuRecommendation[];
  allItems?: MenuItemAnalysis[];
  location?: import('@fitstream/shared').GeoLocation;
  fromCache: boolean;
  selectedItem?: string; // name of the item user chose to log
}

// Daily nutrition summary for MenuScan
export interface DailyNutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
}
