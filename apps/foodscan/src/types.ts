/**
 * FoodScan - App-specific types
 * Shared types (NutritionLog, WeightLog, UserSettings, etc.) come from @fitstream/shared
 * AI result types (FoodAnalysisResult, FoodAnalysisWithCost, etc.) come from ./services/geminiService
 */

// Re-export commonly used shared types for convenience
export type {
  NutritionLog,
  WeightLog,
  UserSettings,
  BodyComposition,
  SmartScaleDevice,
  DailyGoal,
  GoalType,
  InventoryItem,
  BillingActionType,
  UserBalance,
  ChargeResult,
} from '@fitstream/shared';

// Re-export AI result types
export type {
  FoodAnalysisResult,
  FoodAnalysisWithCost,
  FoodIngredient,
  PhotoContentType,
  PhotoTypeDetectionResult,
  MenuRecommendation,
  SupportedCostCurrency,
} from './services/geminiService';

// FoodScan-specific types

/** Summary of today's nutrition intake */
export interface DailyNutritionSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  meals: number;
}

/** Result from scanning a scale display */
export interface ScaleScanResult {
  weight: number | null;
  confidence: string;
}

/** Navigation views in the FoodScan app */
export type FoodScanView = 'scan' | 'history' | 'settings';

/** Camera mode states for scanning flow */
export type ScanMode =
  | 'IDLE'
  | 'CAMERA_FOOD'
  | 'CAMERA_UNIVERSAL'
  | 'ANALYZING'
  | 'DETECTING_TYPE'
  | 'RESULT_FOOD'
  | 'OFFLINE_PHOTO';

/** Error types during scanning */
export type ScanErrorType = 'offline' | 'no_api_key' | 'no_balance' | null;
