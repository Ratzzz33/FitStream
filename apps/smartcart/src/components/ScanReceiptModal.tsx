import React, { useState } from 'react';
import { X, Camera, Check, AlertCircle, Package, Thermometer, Snowflake, Microwave } from 'lucide-react';
import { InventoryItem, StorageType } from '@fitstream/shared';
import { StorageService } from '../services/storageService';
import { scanReceipt, ScannedReceipt, ScannedReceiptItem } from '../services/geminiService';
import { formatCurrency, CurrencyCode } from '../services/currencyService';

interface ScanReceiptModalProps {
  onClose: () => void;
  onAdded: () => void;
}

type ScanState = 'idle' | 'scanning' | 'review' | 'error';

export const ScanReceiptModal: React.FC<ScanReceiptModalProps> = ({
  onClose,
  onAdded
}) => {
  const [state, setState] = useState<ScanState>('idle');
  const [receipt, setReceipt] = useState<ScannedReceipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string>('');

  const settings = StorageService.getSettings();
  const currency = (settings.currency || 'RUB') as CurrencyCode;

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setState('scanning');
      setError('');

      try {
        const base64 = await fileToBase64(file);
        const scannedReceipt = await scanReceipt(base64);

        if (scannedReceipt.items.length === 0) {
          setError('Could not recognize items on the receipt. Please try again.');
          setState('error');
          return;
        }

        setReceipt(scannedReceipt);
        setSelectedItems(new Set(scannedReceipt.items.map((_, i) => i)));
        setState('review');
      } catch (err) {
        console.error('Error scanning receipt:', err);
        setError('An error occurred while scanning. Please try again.');
        setState('error');
      }
    };

    input.click();
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleAddAll = async () => {
    if (!receipt) return;

    const selectedItemsList = receipt.items.filter((_, i) => selectedItems.has(i));

    const items: InventoryItem[] = selectedItemsList.map((item: ScannedReceiptItem) => ({
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      emoji: item.emoji,
      quantity: item.quantity,
      unit: item.unit,
      storageId: item.storageType,
      expiresAt: item.expiresInDays
        ? new Date(Date.now() + item.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      addedAt: new Date().toISOString(),
      source: 'receipt' as const,
      caloriesPer100: item.caloriesPer100,
      price: item.price
    }));

    StorageService.saveInventoryBulk(items);

    // Sync prices with backend (async, non-blocking)
    const backendUrl = settings.backendUrl || 'https://api.fitstream.health';
    try {
      fetch(`${backendUrl}/api/prices/sync-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItemsList.map(item => ({
            name: item.name,
            emoji: item.emoji,
            price: item.price,
            unit: item.unit,
            category: guessCategory(item.storageType, item.name)
          })),
          currencyCode: currency,
          storeName: receipt.store
        })
      }).then(res => res.json())
        .then(data => console.log('Prices synced:', data))
        .catch(err => console.warn('Price sync failed (non-blocking):', err));
    } catch (e) {
      console.warn('Price sync error:', e);
    }

    onAdded();
  };

  const guessCategory = (storageType: string, name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('milk') || nameLower.includes('cheese') || nameLower.includes('yogurt')) return 'dairy';
    if (nameLower.includes('meat') || nameLower.includes('chicken') || nameLower.includes('pork') || nameLower.includes('beef')) return 'meat';
    if (nameLower.includes('fish') || nameLower.includes('salmon') || nameLower.includes('shrimp')) return 'fish';
    if (nameLower.includes('bread') || nameLower.includes('baguette')) return 'bread';
    if (storageType === 'freezer') return 'frozen';
    if (storageType === 'fridge') return 'dairy';
    return 'other';
  };

  const storageIcons: Record<StorageType, React.ReactNode> = {
    fridge: <Thermometer className="w-4 h-4" />,
    cabinet: <Package className="w-4 h-4" />,
    freezer: <Snowflake className="w-4 h-4" />,
    appliances: <Microwave className="w-4 h-4" />
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold dark:text-white">Scan Receipt</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {state === 'idle' && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                Take a photo of your receipt after shopping.<br />
                AI will automatically recognize all items.
              </p>
              <button
                onClick={handleTakePhoto}
                className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
            </div>
          )}

          {state === 'scanning' && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Scanning receipt...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
              <button
                onClick={handleTakePhoto}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Try Again
              </button>
            </div>
          )}

          {state === 'review' && receipt && (
            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium dark:text-white">{receipt.store || 'Store'}</span>
                  {receipt.date && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">{receipt.date}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Recognized {receipt.items.length} items
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(receipt.totalPrice, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {receipt.items.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => toggleItem(index)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors
                      ${selectedItems.has(index)
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent'
                      }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center
                      ${selectedItems.has(index)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      {selectedItems.has(index) && <Check className="w-4 h-4" />}
                    </div>

                    <span className="text-xl">{item.emoji}</span>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium dark:text-white truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span>{item.quantity} {item.unit}</span>
                        <span className="flex items-center gap-1">
                          {storageIcons[item.storageType]}
                        </span>
                        {item.expiresInDays && (
                          <>
                            <span>{item.expiresInDays}d</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {formatCurrency(item.price, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {state === 'review' && receipt && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAddAll}
              disabled={selectedItems.size === 0}
              className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Add {selectedItems.size} items to inventory
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

export default ScanReceiptModal;
