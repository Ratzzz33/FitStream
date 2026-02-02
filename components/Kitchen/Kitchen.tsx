import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Package, Snowflake, RefreshCw, Receipt, PenLine, AlertTriangle, Images, X, Image, Zap, ChevronLeft } from 'lucide-react';
import { KitchenStorage, InventoryItem, StorageType, StoragePhoto as StoragePhotoType } from '../../types';
import { StorageService } from '../../services/storageService';
import { StoragePhoto } from './StoragePhoto';
import { ProductList } from './ProductList';
import { AddProductModal } from './AddProductModal';
import { ScanReceiptModal } from './ScanReceiptModal';
import { scanStoragePhoto, ScannedProduct, deduplicateProducts, ProductWithPhotoId, detectStorageType } from '../../services/geminiService';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';
import { georgiaPrices } from '../../services/georgiaPricesService';

// Custom Fridge Icon (matches Dashboard)
const FridgeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="15" y1="5" x2="15" y2="7" />
    <line x1="15" y1="12" x2="15" y2="16" />
  </svg>
);

// Custom Appliances Icon (oven + mixer)
const AppliancesIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    {/* Oven/Microwave */}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="5" y="8" width="10" height="8" rx="1" />
      <circle cx="18" cy="10" r="1" />
      <circle cx="18" cy="14" r="1" />
    </svg>
    {/* Mixer */}
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <ellipse cx="12" cy="6" rx="4" ry="2" />
      <path d="M8 6v4c0 1.5 1.8 3 4 3s4-1.5 4-3V6" />
      <line x1="12" y1="13" x2="12" y2="18" />
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="21" x2="14" y2="21" />
      <line x1="10" y1="18" x2="10" y2="21" />
      <line x1="14" y1="18" x2="14" y2="21" />
    </svg>
  </div>
);

// Check if we have price database for user's currency
const hasPriceDatabase = (currency: CurrencyCode): boolean => {
  // Currently only Georgia (GEL) has price database
  return currency === 'GEL';
};

interface KitchenProps {
  onClose?: () => void;
}

type AddMenuOption = 'photo' | 'receipt' | 'manual' | null;
type CameraMode = 'IDLE' | 'CAMERA' | 'CAMERA_REPLACE';

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

  // Camera state
  const [cameraMode, setCameraMode] = useState<CameraMode>('IDLE');
  const [replacePhotoId, setReplacePhotoId] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [exposure, setExposure] = useState(0); // -2 to +2
  const [isDraggingExposure, setIsDraggingExposure] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // PRD: Financial tracking of inventory using Georgia prices database
  const calculateInventoryValue = () => {
    return inventory.reduce((sum, item) => {
      // Use item's stored price, or lookup from Georgia prices database
      if (item.price) {
        return sum + item.price;
      }
      const dbPrice = georgiaPrices.getPrice(item.name, item.quantity, item.unit);
      return sum + (dbPrice || item.quantity * 2); // fallback: 2 GEL per unit
    }, 0);
  };

  const calculateExpiringValue = () => {
    return expiringItems.reduce((sum, item) => {
      if (item.price) {
        return sum + item.price;
      }
      const dbPrice = georgiaPrices.getPrice(item.name, item.quantity, item.unit);
      return sum + (dbPrice || item.quantity * 2);
    }, 0);
  };

  const totalValue = Math.round(calculateInventoryValue());
  const expiringValue = Math.round(calculateExpiringValue());
  const currency = (settings?.currency || 'RUB') as CurrencyCode;

  // Scan single photo and return products with photoId
  const scanSinglePhoto = async (base64: string, photoId: string): Promise<ProductWithPhotoId[]> => {
    const scannedProducts = await scanStoragePhoto(base64, activeStorage);
    return scannedProducts.map((p: ScannedProduct) => ({
      ...p,
      photoId
    }));
  };

  // Start camera stream
  const startCamera = async (mode: CameraMode = 'CAMERA') => {
    setAddMenuOpen(null);
    setCameraMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 2560 },
          height: { ideal: 1440 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error('Camera access denied:', e);
      setCameraMode('IDLE');
      alert('Не удалось получить доступ к камере. Проверьте разрешения.');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraMode('IDLE');
    setReplacePhotoId(null);
  };

  // Capture photo from video and process
  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);

    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95);

    // Stop camera stream
    stopCamera();

    // Process the captured image
    if (cameraMode === 'CAMERA_REPLACE' && replacePhotoId) {
      await processReplacePhoto(base64, replacePhotoId);
    } else {
      await processNewPhoto(base64);
    }
  };

  // Process new photo (original handleTakePhoto logic)
  const processNewPhoto = async (base64: string) => {
    setIsScanning(true);
    setScanProgress('Определяем тип хранения...');

    try {
      // Автоматически определяем тип хранения
      const detectedType = await detectStorageType(base64);

      // Если тип отличается от текущего, переключаемся
      if (detectedType !== activeStorage) {
        setActiveStorage(detectedType);
      }
      const targetStorage = detectedType;

      setScanProgress('Сохраняем фото...');

      // Добавляем фото в хранилище (используем определённый тип)
      const photoId = StorageService.addStoragePhoto(targetStorage, base64);
      setScanProgress('Распознаём продукты...');

      // Сканируем новое фото (используем targetStorage для правильного определения контекста)
      const scannedProducts = await scanStoragePhoto(base64, targetStorage);
      const newProducts: ProductWithPhotoId[] = scannedProducts.map(p => ({ ...p, photoId }));

      // Получаем все фото хранилища
      const allPhotos = StorageService.getStoragePhotos(targetStorage);

      if (allPhotos.length > 1) {
        // Мультифото режим — нужна дедупликация
        setScanProgress('Объединяем продукты с разных фото...');

        // Собираем продукты со всех фото
        const existingInventory = StorageService.getInventoryByStorage(targetStorage)
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
          i => i.storageId !== targetStorage || i.source !== 'photo'
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
            storageId: targetStorage,
            expiresAt: p.expiresInDays
              ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
              : undefined,
            addedAt: new Date().toISOString(),
            source: 'photo' as const,
            position: { x: primaryPosition.x, y: primaryPosition.y },
            photoId: primaryPosition.photoId,
            mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
            caloriesPer100: p.caloriesPer100,
          price: p.price
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
          storageId: targetStorage,
          expiresAt: p.expiresInDays
            ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
          addedAt: new Date().toISOString(),
          source: 'photo' as const,
          position: { x: p.positionX, y: p.positionY },
          photoId: p.photoId,
          caloriesPer100: p.caloriesPer100,
          price: p.price
        }));

        StorageService.saveInventoryBulk(newItems);
      }

      // Update state
      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error: any) {
      console.error('Error scanning storage:', error);
      const errorMsg = error?.message || String(error);
      if (errorMsg.includes('API Key')) {
        alert('Ошибка API ключа. Проверьте настройки.');
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        alert('Ошибка сети. Проверьте подключение к интернету.');
      } else {
        alert('Не удалось распознать продукты. Попробуйте ещё раз.\n\n' + errorMsg);
      }
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  // Handle taking photo - now opens camera UI
  const handleTakePhoto = async (isAddingMore = false) => {
    startCamera('CAMERA');
  };

  // Handle picking from gallery (fallback option)
  const handlePickFromGallery = () => {
    setAddMenuOpen(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const base64 = await fileToBase64(file);
      await processNewPhoto(base64);
    };

    input.click();
  };

  // Track which photo is currently being retried
  const [retryingPhotoId, setRetryingPhotoId] = useState<string | null>(null);

  // Retry parsing for a single photo
  const handleRetryParse = async (photoId: string) => {
    const photos = StorageService.getStoragePhotos(activeStorage);
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    setRetryingPhotoId(photoId);

    try {
      const products = await scanSinglePhoto(photo.base64, photoId);

      // Update inventory with new products
      const nonPhotoItems = StorageService.getInventory().filter(
        i => i.storageId !== activeStorage || i.source !== 'photo' || i.photoId !== photoId
      );

      const newItems: InventoryItem[] = products.map(p => ({
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
        caloriesPer100: p.caloriesPer100,
        price: p.price
      }));

      localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));

      // Update parseStatus on photo
      StorageService.updateStoragePhotoParseStatus(activeStorage, photoId, products.length > 0 ? 'success' : 'empty');

      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error) {
      console.error('Error retrying parse:', error);
      StorageService.updateStoragePhotoParseStatus(activeStorage, photoId, 'error');
    } finally {
      setRetryingPhotoId(null);
    }
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
            caloriesPer100: p.caloriesPer100,
          price: p.price
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
          caloriesPer100: p.caloriesPer100,
          price: p.price
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

  // Process replace photo (original handleReplacePhoto logic)
  const processReplacePhoto = async (base64: string, oldPhotoId: string) => {
    setIsScanning(true);
    setScanProgress('Заменяем фото...');

    try {
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
            caloriesPer100: p.caloriesPer100,
          price: p.price
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
          caloriesPer100: p.caloriesPer100,
          price: p.price
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

  // Заменить фото - открывает камеру
  const handleReplacePhoto = async (oldPhotoId: string) => {
    setReplacePhotoId(oldPhotoId);
    startCamera('CAMERA_REPLACE');
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

  // Quick-add a frequent product with 1 click
  const handleQuickAdd = (product: {
    name: string;
    emoji: string;
    unit: string;
    caloriesPer100: number;
    typicalQuantity: number;
    storageId: StorageType;
  }) => {
    const item: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: product.name,
      emoji: product.emoji,
      quantity: product.typicalQuantity,
      unit: product.unit,
      storageId: activeStorage,
      addedAt: new Date().toISOString(),
      source: 'manual',
      caloriesPer100: product.caloriesPer100
    };
    StorageService.saveInventoryItem(item);
    StorageService.trackProductUsage(item);
    setInventory(StorageService.getInventory());
    setAddMenuOpen(null);
  };

  const frequentProducts = StorageService.getFrequentProducts(4);

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
    fridge: <FridgeIcon className="w-5 h-5" />,
    cabinet: <FridgeIcon className="w-5 h-5" />,
    freezer: <Snowflake className="w-5 h-5" />,
    appliances: <AppliancesIcon className="" />
  };

  const storageLabels: Record<StorageType, string> = {
    fridge: 'Холодильник',
    cabinet: 'Шкафы',
    freezer: 'Морозилка',
    appliances: 'Приборы'
  };

  const storageEmojis: Record<StorageType, string> = {
    fridge: '🧊',
    freezer: '❄️',
    cabinet: '📦',
    appliances: '🍳'
  };

  // Check if prices should be shown
  const showPrices = hasPriceDatabase(currency);

  // Get expiring items count per storage
  const getExpiringCount = (type: StorageType) => {
    return expiringItems.filter(i => i.storageId === type).length;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Clean Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {onClose && (
          <button onClick={onClose} className="p-1 -ml-1">
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <h2 className="text-lg font-semibold dark:text-white flex-1 text-center">Кухня</h2>

        {/* Add button */}
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen(addMenuOpen ? null : 'photo')}
            className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          {addMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[200px]">
              {/* Quick-add section */}
              {frequentProducts.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Быстрое добавление
                  </div>
                  <div className="px-3 pb-2 flex flex-wrap gap-1">
                    {frequentProducts.map((product) => (
                      <button
                        key={product.name}
                        onClick={() => handleQuickAdd(product)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      >
                        <span>{product.emoji}</span>
                        <span>{product.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                </>
              )}
              <button
                onClick={() => handleTakePhoto(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Camera className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="font-medium dark:text-white">Сфотографировать</div>
                  <div className="text-xs text-gray-500">Открыть камеру</div>
                </div>
              </button>
              <button
                onClick={handlePickFromGallery}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                <Image className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="font-medium dark:text-white">Выбрать из галереи</div>
                  <div className="text-xs text-gray-500">Загрузить готовое фото</div>
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

      {/* Storage Tiles - Compact Horizontal Row */}
      <div className="px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {(['fridge', 'freezer', 'cabinet', 'appliances'] as StorageType[]).map(type => {
            const count = inventory.filter(i => i.storageId === type).length;
            const hasExpiring = getExpiringCount(type) > 0;
            const isActive = activeStorage === type;

            return (
              <button
                key={type}
                onClick={() => setActiveStorage(type)}
                className={`relative flex-1 py-2 px-1 rounded-lg flex flex-col items-center gap-0.5 transition-all
                  ${isActive
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {/* Expiring badge */}
                {hasExpiring && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-2.5 h-2.5 text-white" />
                  </div>
                )}

                {/* Compact: emoji + count */}
                <div className="flex items-center gap-1">
                  <span className="text-sm">{storageEmojis[type]}</span>
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : ''}`}>{count}</span>
                </div>

                {/* Short label */}
                <span className={`text-[10px] font-medium truncate max-w-full ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                  {storageLabels[type]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content - No scroll layout */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
        {isScanning ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{scanProgress || 'Распознаём продукты...'}</p>
          </div>
        ) : (
          <>
            {/* Storage photo with overlay (supports multi-photo) */}
            {currentPhotos.length > 0 && (
              <div className="shrink-0 max-h-[40%]">
                <StoragePhoto
                  photos={currentPhotos}
                  items={currentInventory}
                  onItemClick={(item) => console.log('Item clicked:', item)}
                  onRefresh={handleRescanAll}
                  onAddPhoto={() => handleTakePhoto(true)}
                  onRemovePhoto={handleRemovePhoto}
                  onLabelPhoto={handleLabelPhoto}
                  onReplacePhoto={handleReplacePhoto}
                  onRetryParse={handleRetryParse}
                  isRetrying={retryingPhotoId}
                />
              </div>
            )}

            {/* Empty state */}
            {currentPhotos.length === 0 && currentInventory.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="mb-3 text-gray-400 dark:text-gray-500 [&_svg]:w-12 [&_svg]:h-12">
                  {storageIcons[activeStorage]}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {storageLabels[activeStorage]} пуст{activeStorage === 'appliances' ? 'ы' : ''}
                </p>
                <button
                  onClick={() => handleTakePhoto(false)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                >
                  <Camera className="w-4 h-4" />
                  Сфотографировать
                </button>
              </div>
            )}

            {/* Product list - fills remaining space with internal scroll */}
            {currentInventory.length > 0 && (
              <div className="flex-1 min-h-0 overflow-auto">
                <ProductList
                  items={currentInventory}
                  onUpdate={handleProductUpdate}
                  onRemove={handleProductRemove}
                  onAddMissing={handleAddManual}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera UI */}
      {cameraMode !== 'IDLE' && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Camera header */}
          <div className="flex items-center justify-between p-4 bg-black/80">
            <button
              onClick={stopCamera}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>
            <span className="text-white font-medium text-sm">
              {cameraMode === 'CAMERA_REPLACE' ? 'Заменить фото' : `Сфотографируйте ${storageLabels[activeStorage].toLowerCase()}`}
            </span>
            {/* Flash toggle */}
            <button
              onClick={() => {
                setFlashMode(prev => prev === 'auto' ? 'on' : prev === 'on' ? 'off' : 'auto');
              }}
              className="p-2 text-white hover:bg-white/20 rounded-full"
            >
              {flashMode === 'auto' && <span className="text-sm font-medium">⚡A</span>}
              {flashMode === 'on' && <span className="text-sm font-medium">⚡</span>}
              {flashMode === 'off' && <span className="text-sm font-medium text-gray-400">⚡̸</span>}
            </button>
          </div>

          {/* Video preview with tap-to-focus */}
          <div
            className="flex-1 relative"
            onClick={async (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 100;
              const y = ((e.clientY - rect.top) / rect.height) * 100;
              setFocusPoint({ x, y });
              setExposure(0); // Reset exposure on new focus

              // Apply real camera focus if supported
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                const track = stream.getVideoTracks()[0];
                const capabilities = track.getCapabilities?.() as any;
                if (capabilities?.focusMode?.includes('manual') || capabilities?.focusMode?.includes('single-shot')) {
                  try {
                    await track.applyConstraints({
                      advanced: [{
                        focusMode: 'manual',
                        pointsOfInterest: [{ x: x / 100, y: y / 100 }]
                      }]
                    } as any);
                  } catch (err) {
                    console.log('Focus not supported:', err);
                  }
                }
              }

              // Clear previous timeout
              if (focusTimeoutRef.current) {
                clearTimeout(focusTimeoutRef.current);
              }
              // Hide focus square after 1.5s
              focusTimeoutRef.current = setTimeout(() => {
                setFocusPoint(null);
              }, 1500);
            }}
            onTouchMove={(e) => {
              if (focusPoint && isDraggingExposure) {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const deltaY = (touch.clientY - rect.top - (focusPoint.y / 100 * rect.height)) / rect.height;
                const newExposure = Math.max(-2, Math.min(2, -deltaY * 4));
                setExposure(newExposure);
              }
            }}
            onTouchStart={() => {
              if (focusPoint) {
                setIsDraggingExposure(true);
              }
            }}
            onTouchEnd={() => {
              setIsDraggingExposure(false);
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                filter: `brightness(${1 + exposure * 0.25})`
              }}
            />

            {/* Center guide frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-36 border-2 border-white/40 rounded-lg" />
            </div>

            {/* Focus square */}
            {focusPoint && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${focusPoint.x}%`,
                  top: `${focusPoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="w-20 h-20 border-2 border-yellow-400 rounded-sm animate-pulse">
                  {/* Corner marks */}
                  <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-2 border-r-2 border-yellow-400" />
                  <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-2 border-l-2 border-yellow-400" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />
                </div>

                {/* Exposure indicator */}
                {exposure !== 0 && (
                  <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex items-center gap-1 text-yellow-400">
                    <span className="text-lg">☀️</span>
                    <span className="text-xs font-medium">{exposure > 0 ? '+' : ''}{exposure.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Rule of thirds grid (subtle) */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/10" />
                ))}
              </div>
            </div>
          </div>

          {/* Camera controls */}
          <div className="p-6 bg-black/80 flex items-center justify-center gap-6">
            {/* Gallery button */}
            <button
              onClick={() => {
                stopCamera();
                handlePickFromGallery();
              }}
              className="p-3 text-white hover:bg-white/20 rounded-full"
            >
              <Image className="w-6 h-6" />
            </button>

            {/* Capture button */}
            <button
              onClick={captureAndProcess}
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>

            <div className="w-12" /> {/* Spacer */}
          </div>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

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
