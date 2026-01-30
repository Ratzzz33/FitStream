import React, { useState, useEffect } from 'react';
import { Camera, Plus, Package, Thermometer, Snowflake, RefreshCw, Receipt, PenLine, AlertTriangle } from 'lucide-react';
import { KitchenStorage, InventoryItem, StorageType } from '../../types';
import { StorageService } from '../../services/storageService';
import { StoragePhoto } from './StoragePhoto';
import { ProductList } from './ProductList';
import { AddProductModal } from './AddProductModal';
import { ScanReceiptModal } from './ScanReceiptModal';
import { scanStoragePhoto, ScannedProduct } from '../../services/geminiService';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';

interface KitchenProps {
  onClose?: () => void;
}

type AddMenuOption = 'photo' | 'receipt' | 'manual' | null;

export const Kitchen: React.FC<KitchenProps> = ({ onClose }) => {
  const [storages, setStorages] = useState<KitchenStorage[]>([]);
  const [activeStorage, setActiveStorage] = useState<StorageType>('fridge');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState<AddMenuOption>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const settings = StorageService.getSettings();

  // Load data
  useEffect(() => {
    setStorages(StorageService.getStorages());
    setInventory(StorageService.getInventory());
  }, []);

  const currentStorage = storages.find(s => s.type === activeStorage);
  const currentInventory = inventory.filter(i => i.storageId === activeStorage);
  const expiringItems = StorageService.getExpiringItems(3);
  const totalItems = inventory.length;

  // PRD: Financial tracking of inventory
  const calculateInventoryValue = () => {
    // Approximate value based on average prices per unit
    const avgPrices: Record<string, number> = {
      'мл': 0.08, // ~80₽ per liter
      'л': 80,
      'г': 0.3, // ~300₽ per kg
      'кг': 300,
      'шт': 50 // avg 50₽ per item
    };
    return inventory.reduce((sum, item) => {
      const pricePerUnit = item.price || avgPrices[item.unit] || 50;
      return sum + (item.quantity * pricePerUnit);
    }, 0);
  };

  const calculateExpiringValue = () => {
    const avgPrices: Record<string, number> = {
      'мл': 0.08, 'л': 80, 'г': 0.3, 'кг': 300, 'шт': 50
    };
    return expiringItems.reduce((sum, item) => {
      const pricePerUnit = item.price || avgPrices[item.unit] || 50;
      return sum + (item.quantity * pricePerUnit);
    }, 0);
  };

  const totalValue = Math.round(calculateInventoryValue());
  const expiringValue = Math.round(calculateExpiringValue());
  const currency = (settings?.currency || 'RUB') as CurrencyCode;

  // Handle taking photo of storage
  const handleTakePhoto = async () => {
    setAddMenuOpen(null);

    // Create file input for camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsScanning(true);

      try {
        // Convert to base64
        const base64 = await fileToBase64(file);

        // Save photo to storage
        StorageService.saveStoragePhoto(activeStorage, base64);

        // Scan with AI
        const scannedProducts = await scanStoragePhoto(base64, activeStorage);

        // Convert to inventory items
        const newItems: InventoryItem[] = scannedProducts.map((p: ScannedProduct) => ({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: p.name,
          emoji: p.emoji,
          quantity: p.quantity,
          unit: p.unit,
          storageId: activeStorage,
          expiresAt: p.expiresInDays
            ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          addedAt: new Date().toISOString(),
          source: 'photo' as const,
          position: { x: p.positionX, y: p.positionY },
          caloriesPer100: p.caloriesPer100
        }));

        // Save to storage
        StorageService.saveInventoryBulk(newItems);

        // Update state
        setStorages(StorageService.getStorages());
        setInventory(StorageService.getInventory());
      } catch (error) {
        console.error('Error scanning storage:', error);
        alert('Не удалось распознать продукты. Попробуйте ещё раз.');
      } finally {
        setIsScanning(false);
      }
    };

    input.click();
  };

  const handleAddManual = () => {
    setAddMenuOpen(null);
    setShowAddModal(true);
  };

  const handleScanReceipt = () => {
    setAddMenuOpen(null);
    setShowReceiptModal(true);
  };

  const handleProductAdded = () => {
    setInventory(StorageService.getInventory());
    setShowAddModal(false);
    setShowReceiptModal(false);
  };

  const handleProductUpdate = (item: InventoryItem) => {
    StorageService.saveInventoryItem(item);
    setInventory(StorageService.getInventory());
  };

  const handleProductRemove = (id: string) => {
    StorageService.removeInventoryItem(id);
    setInventory(StorageService.getInventory());
  };

  const storageIcons: Record<StorageType, React.ReactNode> = {
    fridge: <Thermometer className="w-4 h-4" />,
    cabinet: <Package className="w-4 h-4" />,
    freezer: <Snowflake className="w-4 h-4" />
  };

  const storageLabels: Record<StorageType, string> = {
    fridge: 'Холодильник',
    cabinet: 'Шкафы',
    freezer: 'Морозилка'
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-xl">🗄️</span>
          <h2 className="text-lg font-semibold dark:text-white">Моя Кухня</h2>
        </div>

        {/* Add button with dropdown */}
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen(addMenuOpen ? null : 'photo')}
            className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
          </button>

          {addMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[200px]">
              <button
                onClick={handleTakePhoto}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium dark:text-white">Сфотографировать</div>
                  <div className="text-xs text-gray-500">Холодильник или шкаф</div>
                </div>
              </button>
              <button
                onClick={handleScanReceipt}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Receipt className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="font-medium dark:text-white">Сканировать чек</div>
                  <div className="text-xs text-gray-500">После покупок</div>
                </div>
              </button>
              <button
                onClick={handleAddManual}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <PenLine className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium dark:text-white">Добавить вручную</div>
                  <div className="text-xs text-gray-500">Если AI пропустил</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats bar - PRD layout */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-sm">
        <div className="flex items-center gap-1">
          <span>📊</span>
          <span className="text-gray-600 dark:text-gray-400">Всего продуктов:</span>
          <span className="font-medium dark:text-white">{totalItems}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💰</span>
          <span className="text-gray-600 dark:text-gray-400">~</span>
          <span className="font-medium dark:text-white">{formatCurrency(totalValue, currency)}</span>
        </div>
        {expiringItems.length > 0 && (
          <>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Скоро портится:</span>
              <span className="font-medium">{expiringItems.length}</span>
            </div>
            <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
              <span>❌</span>
              <span>~{formatCurrency(expiringValue, currency)}</span>
            </div>
          </>
        )}
      </div>

      {/* Storage tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['fridge', 'cabinet', 'freezer'] as StorageType[]).map(type => (
          <button
            key={type}
            onClick={() => setActiveStorage(type)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
              ${activeStorage === type
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            {storageIcons[type]}
            <span>{storageLabels[type]}</span>
            <span className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {inventory.filter(i => i.storageId === type).length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isScanning ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400">Распознаём продукты...</p>
          </div>
        ) : (
          <>
            {/* Storage photo with overlay */}
            {currentStorage?.photo && (
              <StoragePhoto
                photo={currentStorage.photo}
                items={currentInventory}
                onItemClick={(item) => console.log('Item clicked:', item)}
                onRefresh={handleTakePhoto}
              />
            )}

            {/* Empty state */}
            {!currentStorage?.photo && currentInventory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">
                  {activeStorage === 'fridge' ? '🧊' : activeStorage === 'freezer' ? '❄️' : '📦'}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {storageLabels[activeStorage]} пуст
                </p>
                <button
                  onClick={handleTakePhoto}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Camera className="w-4 h-4" />
                  Сфотографировать
                </button>
              </div>
            )}

            {/* Product list */}
            {currentInventory.length > 0 && (
              <ProductList
                items={currentInventory}
                onUpdate={handleProductUpdate}
                onRemove={handleProductRemove}
                onAddMissing={handleAddManual}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddProductModal
          storageId={activeStorage}
          onClose={() => setShowAddModal(false)}
          onAdded={handleProductAdded}
        />
      )}

      {showReceiptModal && (
        <ScanReceiptModal
          onClose={() => setShowReceiptModal(false)}
          onAdded={handleProductAdded}
        />
      )}

      {/* Click outside to close menu */}
      {addMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setAddMenuOpen(null)}
        />
      )}
    </div>
  );
};

// Helper function
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
};

export default Kitchen;
