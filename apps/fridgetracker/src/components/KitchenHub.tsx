import React from 'react';
import { Kitchen } from './Kitchen';

// In FridgeTracker, the KitchenHub is simplified to just the Kitchen inventory view
// (no cooking/recipe section - that belongs to CookBot)

interface KitchenHubProps {
  onScanRequest?: () => void;
}

export const KitchenHub: React.FC<KitchenHubProps> = ({ onScanRequest }) => {
  return <Kitchen onScanRequest={onScanRequest} />;
};

export default KitchenHub;
