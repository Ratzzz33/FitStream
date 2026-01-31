export interface Feature {
  slug: string;
  key: string;
  icon: string;
  image?: string;
  color: string;
  isNew?: boolean;
  isPremium?: boolean;
}

export const features: Feature[] = [
  // Priority order: Food scanning first
  { slug: 'ai-food-scanner', key: 'nutritionScanner', icon: '📸', image: '/covers/nutritionScanner.png', color: 'orange', isNew: true },
  { slug: 'menu-analyzer', key: 'menuAnalyzer', icon: '🍽️', image: '/covers/food.png', color: 'rose', isNew: true },
  { slug: 'smart-kitchen', key: 'smartKitchen', icon: '🧊', image: '/covers/smartKitchen.png', color: 'amber', isNew: true },
  { slug: 'guided-cooking', key: 'cookingMode', icon: '👨‍🍳', image: '/covers/cookingMode.png', color: 'emerald' },
  // Exercise tracking
  { slug: 'ai-exercise-tracking', key: 'poseTracking', icon: '🏋️', image: '/covers/poseTracking.png', color: 'violet' },
  { slug: 'exercises', key: 'exercises', icon: '💪', image: '/covers/exercises.png', color: 'blue' },
  // Health & utilities
  { slug: 'health-sync', key: 'healthIntegrations', icon: '❤️', image: '/covers/healthIntegrations.png', color: 'red' },
  { slug: 'ai-coach', key: 'aiCoach', icon: '🤖', image: '/covers/aiCoach.png', color: 'yellow', isPremium: true },
  { slug: 'shopping-assistant', key: 'smartShopping', icon: '🛒', image: '/covers/smartShopping.png', color: 'pink' },
  { slug: 'food-finance', key: 'foodFinance', icon: '💰', image: '/covers/foodFinance.png', color: 'lime' },
  { slug: 'receipt-scanning', key: 'receiptScanning', icon: '🧾', image: '/covers/receiptScanning.png', color: 'teal' },
  { slug: 'achievements', key: 'gamification', icon: '🏆', image: '/covers/gamification.png', color: 'purple' },
  { slug: 'analytics', key: 'charts', icon: '📊', image: '/covers/charts.png', color: 'cyan' },
  { slug: 'offline-first', key: 'offlineFirst', icon: '📴', image: '/covers/offlineFirst.png', color: 'slate' },
];

export function getFeatureBySlug(slug: string): Feature | undefined {
  return features.find((f) => f.slug === slug);
}
