// MenuScan-specific types (re-exports shared menu types)
export type { CachedRestaurant, CachedMenuItem, GeoLocation, RestaurantMapPoint } from '@fitstream/shared';

export interface MenuRecommendation {
  name: string;
  description?: string;
  calories: number;
  protein: number;
  healthScore: 1 | 2 | 3;
  category: 'BEST_CHOICE' | 'HIGH_PROTEIN' | 'LESSER_OF_EVILS' | 'REGULAR';
  reason: string;
}
