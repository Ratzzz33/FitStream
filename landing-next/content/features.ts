export interface Feature {
  slug: string;
  key: string;
  icon: string;
  color: string;
  isNew?: boolean;
  isPremium?: boolean;
}

export const features: Feature[] = [
  { slug: 'ai-pose-tracking', key: 'poseTracking', icon: '🧘', color: 'violet', isNew: true },
  { slug: 'exercises', key: 'exercises', icon: '💪', color: 'blue' },
  { slug: 'smart-kitchen', key: 'smartKitchen', icon: '🍳', color: 'amber', isNew: true },
  { slug: 'guided-cooking', key: 'cookingMode', icon: '👨‍🍳', color: 'rose', isNew: true },
  { slug: 'ai-food-scanner', key: 'nutritionScanner', icon: '📸', color: 'orange' },
  { slug: 'smart-scale', key: 'smartScale', icon: '⚖️', color: 'emerald' },
  { slug: 'health-sync', key: 'healthIntegrations', icon: '❤️', color: 'red' },
  { slug: 'offline-first', key: 'offlineFirst', icon: '📴', color: 'slate' },
  { slug: 'multi-language', key: 'multiLanguage', icon: '🌍', color: 'cyan' },
  { slug: 'multi-platform', key: 'multiPlatform', icon: '📱', color: 'purple' },
  { slug: 'ai-coach', key: 'aiCoach', icon: '🤖', color: 'yellow', isPremium: true },
  { slug: 'shopping-assistant', key: 'smartShopping', icon: '🛒', color: 'pink' },
  { slug: 'food-finance', key: 'foodFinance', icon: '💰', color: 'lime' },
  { slug: 'receipt-scanning', key: 'receiptScanning', icon: '🧾', color: 'teal' },
  { slug: 'achievements', key: 'gamification', icon: '🏆', color: 'orange' },
  { slug: 'analytics', key: 'charts', icon: '📊', color: 'cyan' },
];

export function getFeatureBySlug(slug: string): Feature | undefined {
  return features.find((f) => f.slug === slug);
}
