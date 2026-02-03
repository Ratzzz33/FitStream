// FoodScan-specific types
export interface FoodScanResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portionSize: string;
  confidence: string;
  photoId?: string;
}

export interface ScaleScanResult {
  weight: number | null;
  confidence: string;
}
