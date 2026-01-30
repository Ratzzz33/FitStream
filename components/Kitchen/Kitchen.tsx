import React, { useState, useEffect } from 'react';
import { Camera, Plus, Package, Thermometer, Snowflake, RefreshCw, Receipt, PenLine, AlertTriangle, Images } from 'lucide-react';
import { KitchenStorage, InventoryItem, StorageType, StoragePhoto as StoragePhotoType } from '../../types';
import { StorageService } from '../../services/storageService';
import { StoragePhoto } from './StoragePhoto';
import { ProductList } from './ProductList';
import { AddProductModal } from './AddProductModal';
import { ScanReceiptModal } from './ScanReceiptModal';
import { scanStoragePhoto, ScannedProduct, deduplicateProducts, ProductWithPhotoId } from '../../services/geminiService';

interface KitchenProps {
  onClose?: () => void;
}

type AddMenuOption = 'photo' | 'receipt' | 'manual' | null;

export const Kitchen: React.FC<KitchenProps> = ({ onClose }) => {
  const [storages, setStorages] = useState<KitchenStorage[]>([]);
  const [activeStorage, setActiveStorage] = useState<StorageType>('fridge');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [addMenuOpen, setAddMenuOpen] = useState<AddMenuOption>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');

  const settings = StorageService.getSettings();

  // Load data
  useEffect(() => {
    setStorages(StorageService.getStorages());
    setInventory(StorageService.getInventory());
  }, []);

  const currentStorage = storages.find(s => s.type === activeStorage);
  const currentPhotos = currentStorage?.photos || [];
  const currentInventory = inventory.filter(i => i.storageId === activeStorage);
  const expiringItems = StorageService.getExpiringItems(3);
  const totalItems = inventory.length;

  // PRD: Financial tracking of inventory
  const calculateInventoryValue = () => {
    const avgPrices: Record<string, number> = {
      'мл': 0.08, 'л': 80, 'г': 0.3, 'кг': 300, 'шт': 50
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
  const currency = (settings as any)?.currency || '₽';

  // Scan single photo and return products with photoId
  const scanSinglePhoto = async (base64: string, photoId: string): Promise<ProductWithPhotoId[]> => {
    const scannedProducts = await scanStoragePhoto(base64, activeStorage);
    return scannedProducts.map((p: ScannedProduct) => ({
      ...p,
      photoId
    }));
  };

  // Handle taking photo of storage (add to existing photos)
  const handleTakePhoto = async (isAddingMore = false) => {
    setAddMenuOpen(null);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsScanning(true);
      setScanProgress('Сохраняем фото...');

      try {
        const base64 = await fileToBase64(file);

        // Добавляем фото в хранилище
        const photoId = StorageService.addStoragePhoto(activeStorage, base64);
        setScanProgress('Распознаём продукты...');

        // Сканируем новое фото
        const newProducts = await scanSinglePhoto(base64, photoId);

        // Получаем все фото хранилища
        const allPhotos = StorageService.getStoragePhotos(activeStorage);

        if (allPhotos.length > 1) {
          // Мультифото режим — нужна дедупликация
          setScanProgress('Объединяем продукты с разных фото...');

          // Собираем продукты со всех фото
          const existingInventory = StorageService.getInventoryByStorage(activeStorage)
            .filter(i => i.source === 'photo');

          // Конвертируем существующие items обратно в ProductWithPhotoId для дедупликации
          const existingProducts: ProductWithPhotoId[] = existingInventory.flatMap(item => {
            const positions = item.mergedFromPhotoIds?.length
              ? item.mergedFromPhotoIds.map(pid => ({ photoId: pid, x: 0, y: 0 }))
              : item.photoId
                ? [{ photoId: item.photoId, x: item.position?.x || 0, y: item.position?.y || 0 }]
                : [];

            return positions.map(pos => ({
              name: item.name,
              emoji: item.emoji || '',
              quantity: item.quantity,
              unit: item.unit,
              expiresInDays: item.expiresAt
                ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                : null,
              caloriesPer100: item.caloriesPer100,
              positionX: pos.x,
              positionY: pos.y,
              photoId: pos.photoId
            }));
          });

          // Объединяем и дедуплицируем
          const allProducts = [...existingProducts, ...newProducts];
          const deduplicated = await deduplicateProducts(allProducts);

          // Удаляем старые photo-items для этого хранилища
          const nonPhotoItems = StorageService.getInventory().filter(
            i => i.storageId !== activeStorage || i.source !== 'photo'
          );

          // Создаём новые items из дедуплицированных
          const newItems: InventoryItem[] = deduplicated.map(p => {
            // Находим позицию для первого фото
            const primaryPosition = p.positions[0];
            return {
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
              position: { x: primaryPosition.x, y: primaryPosition.y },
              photoId: primaryPosition.photoId,
              mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
              caloriesPer100: p.caloriesPer100
            };
          });

          // Сохраняем
          localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));

        } else {
          // Первое фото — просто добавляем без дедупликации
          const newItems: InventoryItem[] = newProducts.map((p: ProductWithPhotoId) => ({
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
            photoId: p.photoId,
            caloriesPer100: p.caloriesPer100
          }));

          StorageService.saveInventoryBulk(newItems);
        }

        // Update state
        setStorages(StorageService.getStorages());
        setInventory(StorageService.getInventory());
      } catch (error) {
        console.error('Error scanning storage:', error);
        alert('Не удалось распознать продукты. Попробуйте ещё раз.');
      } finally {
        setIsScanning(false);
        setScanProgress('');
      }
    };

    input.click();
  };

  // Rescan all photos (refresh)
  const handleRescanAll = async () => {
    const photos = StorageService.getStoragePhotos(activeStorage);
    if (photos.length === 0) {
      handleTakePhoto();
      return;
    }

    setIsScanning(true);

    try {
      // Сканируем все фото заново
      const allProducts: ProductWithPhotoId[] = [];

      for (let i = 0; i < photos.length; i++) {
        setScanProgress(`Сканируем фото ${i + 1}/${photos.length}...`);
        const products = await scanSinglePhoto(photos[i].base64, photos[i].id);
        allProducts.push(...products);
      }

      if (photos.length > 1) {
        setScanProgress('Объединяем продукты...');
        const deduplicated = await deduplicateProducts(allProducts);

        // Удаляем старые photo-items
        const nonPhotoItems = StorageService.getInventory().filter(
          i => i.storageId !== activeStorage || i.source !== 'photo'
        );

        const newItems: InventoryItem[] = deduplicated.map(p => {
          const primaryPosition = p.positions[0];
          return {
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
            position: { x: primaryPosition.x, y: primaryPosition.y },
            photoId: primaryPosition.photoId,
            mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
            caloriesPer100: p.caloriesPer100
          };
        });

        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      } else {
        // Одно фото
        const nonPhotoItems = StorageService.getInventory().filter(
          i => i.storageId !== activeStorage || i.source !== 'photo'
        );

        const newItems: InventoryItem[] = allProducts.map(p => ({
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
          photoId: p.photoId,
          caloriesPer100: p.caloriesPer100
        }));

        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      }

      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error) {
      console.error('Error rescanning:', error);
      alert('Ошибка при пересканировании.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    if (confirm('Удалить это фото? Продукты, видимые только на этом фото, будут удалены.')) {
      StorageService.removeStoragePhoto(activeStorage, photoId);
      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    }
  };

  // Заменить фото (тот же ракурс — убирает X-маркеры и пересканирует)
  const handleReplacePhoto = async (oldPhotoId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsScanning(true);
      setScanProgress('Заменяем фото...');

      try {
        const base64 = await fileToBase64(file);

        // Удаляем depleted items для этого фото
        StorageService.clearDepletedForPhoto(oldPhotoId);

        // Заменяем фото
        const newPhotoId = StorageService.replaceStoragePhoto(activeStorage, oldPhotoId, base64);

        setScanProgress('Распознаём продукты...');

        // Сканируем новое фото
        const newProducts = await scanSinglePhoto(base64, newPhotoId);

        // Получаем все фото хранилища
        const allPhotos = StorageService.getStoragePhotos(activeStorage);

        if (allPhotos.length > 1) {
          // Мультифото режим — дедупликация
          setScanProgress('Объединяем продукты...');

          const existingInventory = StorageService.getInventoryByStorage(activeStorage)
            .filter(i => i.source === 'photo' && !i.depleted);

          const existingProducts: ProductWithPhotoId[] = existingInventory
            .filter(item => item.photoId !== newPhotoId) // Исключаем старые items с этого фото
            .flatMap(item => {
              const positions = item.mergedFromPhotoIds?.length
                ? item.mergedFromPhotoIds.map(pid => ({ photoId: pid, x: 0, y: 0 }))
                : item.photoId
                  ? [{ photoId: item.photoId, x: item.position?.x || 0, y: item.position?.y || 0 }]
                  : [];

              return positions.map(pos => ({
                name: item.name,
                emoji: item.emoji || '',
                quantity: item.quantity,
                unit: item.unit,
                expiresInDays: item.expiresAt
                  ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                  : null,
                caloriesPer100: item.caloriesPer100,
                positionX: pos.x,
                positionY: pos.y,
                photoId: pos.photoId
              }));
            });

          const allProducts = [...existingProducts, ...newProducts];
          const deduplicated = await deduplicateProducts(allProducts);

          const nonPhotoItems = StorageService.getInventory().filter(
            i => i.storageId !== activeStorage || i.source !== 'photo'
          );

          const newItems: InventoryItem[] = deduplicated.map(p => {
            const primaryPosition = p.positions[0];
            return {
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
              position: { x: primaryPosition.x, y: primaryPosition.y },
              photoId: primaryPosition.photoId,
              mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
              caloriesPer100: p.caloriesPer100
            };
          });

          localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
        } else {
          // Одно фото — просто заменяем items
          const nonPhotoItems = StorageService.getInventory().filter(
            i => i.storageId !== activeStorage || i.source !== 'photo'
          );

          const newItems: InventoryItem[] = newProducts.map(p => ({
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
            photoId: p.photoId,
            caloriesPer100: p.caloriesPer100
          }));

          localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
        }

        setStorages(StorageService.getStorages());
        setInventory(StorageService.getInventory());
      } catch (error) {
        console.error('Error replacing photo:', error);
        alert('Ошибка при замене фото.');
      } finally {
        setIsScanning(false);
        setScanProgress('');
      }
    };

    input.click();
  };

  const handleLabelPhoto = (photoId: string) => {
    const photos = StorageService.getStoragePhotos(activeStorage);
    const photo = photos.find(p => p.id === photoId);
    setLabelInput(photo?.label || '');
    setShowLabelModal(photoId);
  };

  const saveLabelPhoto = () => {
    if (showLabelModal) {
      StorageService.updateStoragePhotoLabel(activeStorage, showLabelModal, labelInput);
      setStorages(StorageService.getStorages());
      setShowLabelModal(null);
      setLabelInput('');
    }
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
                onClick={() => handleTakePhoto(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium dark:text-white">Сфотографировать</div>
                  <div className="text-xs text-gray-500">Холодильник или шкаф</div>
                </div>
              </button>
              {currentPhotos.length > 0 && (
                <button
                  onClick={() => handleTakePhoto(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <Images className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium dark:text-white">Добавить ещё фото</div>
                    <div className="text-xs text-gray-500">Другой ракурс / полка</div>
                  </div>
                </button>
              )}
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

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 text-sm">
        <div className="flex items-center gap-1">
          <span>📊</span>
          <span className="text-gray-600 dark:text-gray-400">Всего продуктов:</span>
          <span className="font-medium dark:text-white">{totalItems}</span>
        </div>
        <div className="flex items-center gap-1">
          <span>💰</span>
          <span className="text-gray-600 dark:text-gray-400">~</span>
          <span className="font-medium dark:text-white">{totalValue.toLocaleString()} {currency}</span>
        </div>
        {currentPhotos.length > 1 && (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Images className="w-4 h-4" />
            <span>Фото:</span>
            <span className="font-medium">{currentPhotos.length}</span>
          </div>
        )}
        {expiringItems.length > 0 && (
          <>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Скоро портится:</span>
              <span className="font-medium">{expiringItems.length}</span>
            </div>
            <div className="flex items-center gap-1 text-red-500 dark:text-red-400 col-span-2">
              <span>❌</span>
              <span>Под угрозой ~{expiringValue.toLocaleString()} {currency}</span>
            </div>
          </>
        )}
      </div>

      {/* Storage tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['fridge', 'cabinet', 'freezer'] as StorageType[]).map(type => {
          const typePhotos = storages.find(s => s.type === type)?.photos || [];
          return (
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
              {typePhotos.length > 1 && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                  {typePhotos.length}📷
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {isScanning ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-600 dark:text-gray-400">{scanProgress || 'Распознаём продукты...'}</p>
          </div>
        ) : (
          <>
            {/* Storage photo with overlay (supports multi-photo) */}
            {currentPhotos.length > 0 && (
              <StoragePhoto
                photos={currentPhotos}
                items={currentInventory}
                onItemClick={(item) => console.log('Item clicked:', item)}
                onRefresh={handleRescanAll}
                onAddPhoto={() => handleTakePhoto(true)}
                onRemovePhoto={handleRemovePhoto}
                onLabelPhoto={handleLabelPhoto}
                onReplacePhoto={handleReplacePhoto}
              />
            )}

            {/* Empty state */}
            {currentPhotos.length === 0 && currentInventory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-6xl mb-4">
                  {activeStorage === 'fridge' ? '🧊' : activeStorage === 'freezer' ? '❄️' : '📦'}
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {storageLabels[activeStorage]} пуст
                </p>
                <button
                  onClick={() => handleTakePhoto(false)}
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

      {/* Label Photo Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Метка для фото</h3>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Например: верхняя полка, дверца..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowLabelModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                onClick={saveLabelPhoto}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
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
