/**
 * Menu Cache Service
 *
 * Caches restaurant menus by geolocation and name.
 * Saves AI tokens by avoiding duplicate scans.
 * Prepares data for future healthy food map feature.
 */

import {
  CachedRestaurant,
  CachedMenuItem,
  GeoLocation,
  RestaurantMapPoint,
  MenuCacheStats
} from '../types';

const STORAGE_KEY = 'fitstream_menu_cache';
const STATS_KEY = 'fitstream_menu_cache_stats';

// Distance in meters to consider same location
const LOCATION_THRESHOLD_METERS = 100;

// Haversine formula for distance between two points
const calculateDistance = (loc1: GeoLocation, loc2: GeoLocation): number => {
  const R = 6371000; // Earth radius in meters
  const lat1 = loc1.lat * Math.PI / 180;
  const lat2 = loc2.lat * Math.PI / 180;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Normalize restaurant name for matching
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яёღ-ჰ0-9]/gi, '') // keep latin, cyrillic, georgian
    .trim();
};

// Calculate health score from menu items
const calculateHealthyScore = (items: CachedMenuItem[]): number => {
  if (items.length === 0) return 0;
  const avgScore = items.reduce((sum, item) => sum + (4 - item.healthScore), 0) / items.length;
  return Math.round((avgScore / 3) * 100); // 0-100 scale
};

// Get all cached restaurants
export const getAllRestaurants = (): CachedRestaurant[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save all restaurants
const saveRestaurants = (restaurants: CachedRestaurant[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
  updateStats();
};

// Get stats
export const getCacheStats = (): MenuCacheStats => {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) return JSON.parse(data);
  } catch { /* ignore */ }

  return {
    totalRestaurants: 0,
    totalItems: 0,
    byCity: {},
    byCountry: {},
    lastScanDate: '',
    tokensSaved: 0
  };
};

// Update stats
const updateStats = (): void => {
  const restaurants = getAllRestaurants();
  const stats: MenuCacheStats = {
    totalRestaurants: restaurants.length,
    totalItems: restaurants.reduce((sum, r) => sum + r.menuItems.length, 0),
    byCity: {},
    byCountry: {},
    lastScanDate: new Date().toISOString(),
    tokensSaved: getCacheStats().tokensSaved
  };

  restaurants.forEach(r => {
    stats.byCity[r.city] = (stats.byCity[r.city] || 0) + 1;
    stats.byCountry[r.country] = (stats.byCountry[r.country] || 0) + 1;
  });

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

// Increment tokens saved
export const incrementTokensSaved = (tokens: number): void => {
  const stats = getCacheStats();
  stats.tokensSaved += tokens;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
};

/**
 * Find restaurant by name and/or location
 * Returns match if within threshold distance or exact name match
 */
export const findRestaurant = (
  name?: string,
  location?: GeoLocation
): CachedRestaurant | null => {
  const restaurants = getAllRestaurants();

  if (!name && !location) return null;

  const normalizedInput = name ? normalizeName(name) : '';

  for (const restaurant of restaurants) {
    // Check name match
    const nameMatch = normalizedInput && restaurant.normalizedName.includes(normalizedInput);

    // Check location match
    let locationMatch = false;
    if (location) {
      const distance = calculateDistance(restaurant.location, location);
      locationMatch = distance <= LOCATION_THRESHOLD_METERS;
    }

    // Return if both match, or strong single match
    if (nameMatch && locationMatch) return restaurant;
    if (nameMatch && !location) return restaurant;
    if (locationMatch && !name) return restaurant;
  }

  return null;
};

/**
 * Find restaurants near a location
 */
export const findNearbyRestaurants = (
  location: GeoLocation,
  radiusMeters: number = 1000,
  minHealthyScore?: number
): CachedRestaurant[] => {
  const restaurants = getAllRestaurants();

  return restaurants
    .filter(r => {
      const distance = calculateDistance(r.location, location);
      if (distance > radiusMeters) return false;
      if (minHealthyScore && r.healthyScore < minHealthyScore) return false;
      return true;
    })
    .sort((a, b) => {
      const distA = calculateDistance(a.location, location);
      const distB = calculateDistance(b.location, location);
      return distA - distB;
    });
};

/**
 * Get restaurants for map display (lightweight data)
 */
export const getMapPoints = (
  bounds?: { north: number; south: number; east: number; west: number },
  minHealthyScore?: number
): RestaurantMapPoint[] => {
  const restaurants = getAllRestaurants();

  return restaurants
    .filter(r => {
      if (bounds) {
        if (r.location.lat > bounds.north || r.location.lat < bounds.south) return false;
        if (r.location.lng > bounds.east || r.location.lng < bounds.west) return false;
      }
      if (minHealthyScore && r.healthyScore < minHealthyScore) return false;
      return true;
    })
    .map(r => ({
      id: r.id,
      name: r.name,
      location: r.location,
      healthyScore: r.healthyScore,
      healthyItemsCount: r.healthyItemsCount,
      cuisine: r.cuisine
    }));
};

/**
 * Add or update restaurant with menu items
 */
export const saveRestaurantMenu = (
  name: string,
  location: GeoLocation,
  city: string,
  country: string,
  menuItems: Omit<CachedMenuItem, 'id'>[],
  options?: {
    address?: string;
    cuisine?: string[];
    deliveryPlatforms?: ('glovo' | 'bolt' | 'wolt')[];
    glovoSlug?: string;
    boltSlug?: string;
  }
): CachedRestaurant => {
  const restaurants = getAllRestaurants();
  const normalizedName = normalizeName(name);

  // Check if already exists
  const existingIndex = restaurants.findIndex(r => {
    const nameMatch = r.normalizedName === normalizedName;
    const locationMatch = calculateDistance(r.location, location) <= LOCATION_THRESHOLD_METERS;
    return nameMatch || locationMatch;
  });

  // Create menu items with IDs and health scores
  const items: CachedMenuItem[] = menuItems.map((item, idx) => ({
    ...item,
    id: `${normalizedName}_${idx}_${Date.now()}`,
    healthScore: item.healthScore || calculateItemHealthScore(item)
  }));

  const healthyItems = items.filter(i => i.healthScore === 1);

  if (existingIndex >= 0) {
    // Update existing
    const existing = restaurants[existingIndex];

    // Merge menu items (avoid duplicates)
    const existingNames = new Set(existing.menuItems.map(i => normalizeName(i.name)));
    const newItems = items.filter(i => !existingNames.has(normalizeName(i.name)));

    existing.menuItems = [...existing.menuItems, ...newItems];
    existing.healthyScore = calculateHealthyScore(existing.menuItems);
    existing.healthyItemsCount = existing.menuItems.filter(i => i.healthScore === 1).length;
    existing.lastUpdated = new Date().toISOString();
    existing.scanCount += 1;

    // Update optional fields
    if (options?.deliveryPlatforms) {
      existing.deliveryPlatforms = [...new Set([
        ...(existing.deliveryPlatforms || []),
        ...options.deliveryPlatforms
      ])];
    }
    if (options?.glovoSlug) existing.glovoSlug = options.glovoSlug;
    if (options?.boltSlug) existing.boltSlug = options.boltSlug;

    restaurants[existingIndex] = existing;
    saveRestaurants(restaurants);
    return existing;
  }

  // Create new restaurant
  const newRestaurant: CachedRestaurant = {
    id: `rest_${normalizedName}_${Date.now()}`,
    name,
    normalizedName,
    location,
    city,
    country,
    menuItems: items,
    healthyScore: calculateHealthyScore(items),
    healthyItemsCount: healthyItems.length,
    lastUpdated: new Date().toISOString(),
    scanCount: 1,
    ...options
  };

  restaurants.push(newRestaurant);
  saveRestaurants(restaurants);
  return newRestaurant;
};

/**
 * Calculate health score for individual item
 */
const calculateItemHealthScore = (item: Omit<CachedMenuItem, 'id' | 'healthScore'>): 1 | 2 | 3 => {
  // Simple heuristics
  const caloriesPerProtein = item.protein > 0 ? item.calories / item.protein : 999;

  // 🟢 Good: high protein, reasonable calories
  if (item.protein >= 20 && item.calories <= 500 && caloriesPerProtein <= 20) {
    return 1;
  }

  // 🔴 Bad: very high calories or very low protein
  if (item.calories > 800 || (item.protein < 10 && item.calories > 400)) {
    return 3;
  }

  // 🟡 Moderate: everything else
  return 2;
};

/**
 * Get healthy recommendations from cached menu
 */
export const getCachedRecommendations = (
  restaurantId: string,
  userGoals?: { targetProtein?: number; targetCalories?: number }
): CachedMenuItem[] => {
  const restaurants = getAllRestaurants();
  const restaurant = restaurants.find(r => r.id === restaurantId);

  if (!restaurant) return [];

  // Sort by health score, then by protein
  return restaurant.menuItems
    .filter(item => item.healthScore <= 2) // exclude worst items
    .sort((a, b) => {
      if (a.healthScore !== b.healthScore) return a.healthScore - b.healthScore;
      return b.protein - a.protein; // higher protein first
    })
    .slice(0, 5);
};

/**
 * Search restaurants by cuisine
 */
export const searchByCuisine = (
  cuisine: string,
  location?: GeoLocation,
  radiusMeters?: number
): CachedRestaurant[] => {
  let restaurants = getAllRestaurants();

  // Filter by cuisine
  const cuisineLower = cuisine.toLowerCase();
  restaurants = restaurants.filter(r =>
    r.cuisine?.some(c => c.toLowerCase().includes(cuisineLower))
  );

  // Filter by location if provided
  if (location && radiusMeters) {
    restaurants = restaurants.filter(r =>
      calculateDistance(r.location, location) <= radiusMeters
    );
  }

  return restaurants;
};

/**
 * Get top healthy restaurants in city
 */
export const getTopHealthyRestaurants = (
  city: string,
  limit: number = 10
): CachedRestaurant[] => {
  return getAllRestaurants()
    .filter(r => r.city.toLowerCase() === city.toLowerCase())
    .sort((a, b) => b.healthyScore - a.healthyScore)
    .slice(0, limit);
};

/**
 * Export data for backup/sharing
 */
export const exportMenuCache = (): string => {
  const data = {
    restaurants: getAllRestaurants(),
    stats: getCacheStats(),
    exportedAt: new Date().toISOString(),
    version: 1
  };
  return JSON.stringify(data, null, 2);
};

/**
 * Import data from backup
 */
export const importMenuCache = (jsonData: string, merge: boolean = true): number => {
  try {
    const data = JSON.parse(jsonData);
    if (!data.restaurants || !Array.isArray(data.restaurants)) {
      throw new Error('Invalid format');
    }

    if (merge) {
      const existing = getAllRestaurants();
      const existingIds = new Set(existing.map(r => r.id));
      const newRestaurants = data.restaurants.filter((r: CachedRestaurant) => !existingIds.has(r.id));
      saveRestaurants([...existing, ...newRestaurants]);
      return newRestaurants.length;
    } else {
      saveRestaurants(data.restaurants);
      return data.restaurants.length;
    }
  } catch (error) {
    console.error('Failed to import menu cache:', error);
    return 0;
  }
};

/**
 * Clear all cached data
 */
export const clearMenuCache = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STATS_KEY);
};

/**
 * Generate deep link to restaurant on delivery platform
 */
export const getDeliveryLink = (
  restaurant: CachedRestaurant,
  platform: 'glovo' | 'bolt'
): string | null => {
  if (platform === 'glovo' && restaurant.glovoSlug) {
    // Glovo deep link format for Georgia
    return `https://glovoapp.com/ge/en/tbilisi/${restaurant.glovoSlug}/`;
  }

  if (platform === 'bolt' && restaurant.boltSlug) {
    return `https://food.bolt.eu/en-US/149-tbilisi/${restaurant.boltSlug}/`;
  }

  // Fallback: open search with restaurant name
  if (platform === 'glovo') {
    return `https://glovoapp.com/ge/en/tbilisi/search/?query=${encodeURIComponent(restaurant.name)}`;
  }

  if (platform === 'bolt') {
    return `https://food.bolt.eu/en-US/149-tbilisi/?q=${encodeURIComponent(restaurant.name)}`;
  }

  return null;
};
