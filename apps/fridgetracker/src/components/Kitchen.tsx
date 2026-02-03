import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Snowflake, RefreshCw, Receipt, PenLine, AlertTriangle, Images, X, Image, Zap } from 'lucide-react';
import { KitchenStorage, InventoryItem, StorageType, StoragePhoto as StoragePhotoType } from '@fitstream/shared';
import { StorageService } from '../services/storageService';
import { StoragePhoto } from './StoragePhoto';
import { ProductList } from './ProductList';
import { AddProductModal } from './AddProductModal';
import { ScanReceiptModal } from './ScanReceiptModal';
import { scanStoragePhoto, ScannedProduct, deduplicateProducts, ProductWithPhotoId, detectStorageType } from '../services/geminiService';

// Custom Fridge Icon
const FridgeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="5" y1="9" x2="19" y2="9" />
    <line x1="15" y1="5" x2="15" y2="7" />
    <line x1="15" y1="12" x2="15" y2="16" />
  </svg>
);

// Custom Appliances Icon
const AppliancesIcon = ({ className }: { className?: string }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <rect x="5" y="8" width="10" height="8" rx="1" />
      <circle cx="18" cy="10" r="1" />
      <circle cx="18" cy="14" r="1" />
    </svg>
  </div>
);

interface KitchenProps {
  onScanRequest?: () => void;
}

type AddMenuOption = 'photo' | 'receipt' | 'manual' | null;
type CameraMode = 'IDLE' | 'CAMERA' | 'CAMERA_REPLACE';

export const Kitchen: React.FC<KitchenProps> = ({ onScanRequest }) => {
  const [storages, setStorages] = useState<KitchenStorage[]>([]);
  const [activeStorage, setActiveStorage] = useState<StorageType | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<string>('');
  const [addMenuOpen, setAddMenuOpen] = useState<AddMenuOption>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [retryingPhotoId, setRetryingPhotoId] = useState<string | null>(null);

  // Camera state
  const [cameraMode, setCameraMode] = useState<CameraMode>('IDLE');
  const [replacePhotoId, setReplacePhotoId] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setStorages(StorageService.getStorages());
    setInventory(StorageService.getInventory());
  }, []);

  const currentStorage = activeStorage ? storages.find(s => s.type === activeStorage) : null;
  const currentPhotos = currentStorage?.photos || [];
  const currentInventory = activeStorage
    ? inventory.filter(i => i.storageId === activeStorage)
    : inventory;
  const expiringItems = StorageService.getExpiringItems(3);

  // Scan single photo
  const scanSinglePhoto = async (base64: string, photoId: string): Promise<ProductWithPhotoId[]> => {
    const scannedProducts = await scanStoragePhoto(base64, activeStorage || 'fridge');
    return scannedProducts.map((p: ScannedProduct) => ({ ...p, photoId }));
  };

  // Start camera stream
  const startCamera = async (mode: CameraMode = 'CAMERA') => {
    setAddMenuOpen(null);
    setCameraMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 2560 }, height: { ideal: 1440 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error('Camera access denied:', e);
      setCameraMode('IDLE');
      alert('Could not access camera. Check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraMode('IDLE');
    setReplacePhotoId(null);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);

    const base64 = canvasRef.current.toDataURL('image/jpeg', 0.95);
    stopCamera();

    if (cameraMode === 'CAMERA_REPLACE' && replacePhotoId) {
      await processReplacePhoto(base64, replacePhotoId);
    } else {
      await processNewPhoto(base64);
    }
  };

  const processNewPhoto = async (base64: string) => {
    setIsScanning(true);
    setScanProgress('Detecting storage type...');

    try {
      const detectedType = await detectStorageType(base64);
      if (detectedType !== activeStorage) {
        setActiveStorage(detectedType);
      }
      const targetStorage = detectedType;

      setScanProgress('Saving photo...');
      const photoId = StorageService.addStoragePhoto(targetStorage, base64);
      setScanProgress('Detecting products...');

      const scannedProducts = await scanStoragePhoto(base64, targetStorage);
      const newProducts: ProductWithPhotoId[] = scannedProducts.map(p => ({ ...p, photoId }));

      const allPhotos = StorageService.getStoragePhotos(targetStorage);

      if (allPhotos.length > 1) {
        setScanProgress('Merging products from multiple photos...');
        const existingInventory = StorageService.getInventoryByStorage(targetStorage)
          .filter(i => i.source === 'photo');

        const existingProducts: ProductWithPhotoId[] = existingInventory.flatMap(item => {
          const positions = item.mergedFromPhotoIds?.length
            ? item.mergedFromPhotoIds.map(pid => ({ photoId: pid, x: 0, y: 0 }))
            : item.photoId
              ? [{ photoId: item.photoId, x: item.position?.x || 0, y: item.position?.y || 0 }]
              : [];

          return positions.map(pos => ({
            name: item.name, emoji: item.emoji || '', quantity: item.quantity, unit: item.unit,
            expiresInDays: item.expiresAt ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null,
            caloriesPer100: item.caloriesPer100, positionX: pos.x, positionY: pos.y, photoId: pos.photoId
          }));
        });

        const allProducts = [...existingProducts, ...newProducts];
        const deduplicated = await deduplicateProducts(allProducts);

        const nonPhotoItems = StorageService.getInventory().filter(
          i => i.storageId !== targetStorage || i.source !== 'photo'
        );

        const newItems: InventoryItem[] = deduplicated.map(p => {
          const primaryPosition = p.positions[0];
          return {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
            storageId: targetStorage,
            expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
            addedAt: new Date().toISOString(), source: 'photo' as const,
            position: { x: primaryPosition.x, y: primaryPosition.y },
            photoId: primaryPosition.photoId,
            mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
            caloriesPer100: p.caloriesPer100, price: p.price
          };
        });

        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      } else {
        const newItems: InventoryItem[] = newProducts.map((p: ProductWithPhotoId) => ({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
          storageId: targetStorage,
          expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
          addedAt: new Date().toISOString(), source: 'photo' as const,
          position: { x: p.positionX, y: p.positionY },
          photoId: p.photoId, caloriesPer100: p.caloriesPer100, price: p.price
        }));
        StorageService.saveInventoryBulk(newItems);
      }

      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error: any) {
      console.error('Error scanning storage:', error);
      alert('Could not detect products. Please try again.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const processReplacePhoto = async (base64: string, oldPhotoId: string) => {
    setIsScanning(true);
    setScanProgress('Replacing photo...');

    try {
      StorageService.clearDepletedForPhoto(oldPhotoId);
      const newPhotoId = StorageService.replaceStoragePhoto(activeStorage || 'fridge', oldPhotoId, base64);
      setScanProgress('Detecting products...');

      const newProducts = await scanSinglePhoto(base64, newPhotoId);
      const allPhotos = StorageService.getStoragePhotos(activeStorage || 'fridge');

      if (allPhotos.length > 1) {
        setScanProgress('Merging products...');
        const existingInventory = StorageService.getInventoryByStorage(activeStorage || 'fridge')
          .filter(i => i.source === 'photo' && !i.depleted);

        const existingProducts: ProductWithPhotoId[] = existingInventory
          .filter(item => item.photoId !== newPhotoId)
          .flatMap(item => {
            const positions = item.mergedFromPhotoIds?.length
              ? item.mergedFromPhotoIds.map(pid => ({ photoId: pid, x: 0, y: 0 }))
              : item.photoId
                ? [{ photoId: item.photoId, x: item.position?.x || 0, y: item.position?.y || 0 }]
                : [];
            return positions.map(pos => ({
              name: item.name, emoji: item.emoji || '', quantity: item.quantity, unit: item.unit,
              expiresInDays: item.expiresAt ? Math.ceil((new Date(item.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null,
              caloriesPer100: item.caloriesPer100, positionX: pos.x, positionY: pos.y, photoId: pos.photoId
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
            name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
            storageId: activeStorage || 'fridge',
            expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
            addedAt: new Date().toISOString(), source: 'photo' as const,
            position: { x: primaryPosition.x, y: primaryPosition.y },
            photoId: primaryPosition.photoId,
            mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
            caloriesPer100: p.caloriesPer100, price: p.price
          };
        });

        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      } else {
        const nonPhotoItems = StorageService.getInventory().filter(
          i => i.storageId !== activeStorage || i.source !== 'photo'
        );

        const newItems: InventoryItem[] = newProducts.map(p => ({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
          storageId: activeStorage || 'fridge',
          expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
          addedAt: new Date().toISOString(), source: 'photo' as const,
          position: { x: p.positionX, y: p.positionY },
          photoId: p.photoId, caloriesPer100: p.caloriesPer100, price: p.price
        }));

        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      }

      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error) {
      console.error('Error replacing photo:', error);
      alert('Error replacing photo.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const handleTakePhoto = () => startCamera('CAMERA');

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

  const handleRetryParse = async (photoId: string) => {
    const photos = StorageService.getStoragePhotos(activeStorage || 'fridge');
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    setRetryingPhotoId(photoId);
    try {
      const products = await scanSinglePhoto(photo.base64, photoId);
      const nonPhotoItems = StorageService.getInventory().filter(
        i => i.storageId !== activeStorage || i.source !== 'photo' || i.photoId !== photoId
      );
      const newItems: InventoryItem[] = products.map(p => ({
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
        storageId: activeStorage || 'fridge',
        expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
        addedAt: new Date().toISOString(), source: 'photo' as const,
        position: { x: p.positionX, y: p.positionY },
        photoId: p.photoId, caloriesPer100: p.caloriesPer100, price: p.price
      }));
      localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      StorageService.updateStoragePhotoParseStatus(activeStorage || 'fridge', photoId, products.length > 0 ? 'success' : 'empty');
      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error) {
      console.error('Error retrying parse:', error);
      StorageService.updateStoragePhotoParseStatus(activeStorage || 'fridge', photoId, 'error');
    } finally {
      setRetryingPhotoId(null);
    }
  };

  const handleRescanAll = async () => {
    const photos = StorageService.getStoragePhotos(activeStorage || 'fridge');
    if (photos.length === 0) { handleTakePhoto(); return; }

    setIsScanning(true);
    try {
      const allProducts: ProductWithPhotoId[] = [];
      for (let i = 0; i < photos.length; i++) {
        setScanProgress(`Scanning photo ${i + 1}/${photos.length}...`);
        const products = await scanSinglePhoto(photos[i].base64, photos[i].id);
        allProducts.push(...products);
      }

      const nonPhotoItems = StorageService.getInventory().filter(
        i => i.storageId !== activeStorage || i.source !== 'photo'
      );

      if (photos.length > 1) {
        setScanProgress('Merging products...');
        const deduplicated = await deduplicateProducts(allProducts);
        const newItems: InventoryItem[] = deduplicated.map(p => {
          const primaryPosition = p.positions[0];
          return {
            id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
            storageId: activeStorage || 'fridge',
            expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
            addedAt: new Date().toISOString(), source: 'photo' as const,
            position: { x: primaryPosition.x, y: primaryPosition.y },
            photoId: primaryPosition.photoId,
            mergedFromPhotoIds: p.photoIds.length > 1 ? p.photoIds : undefined,
            caloriesPer100: p.caloriesPer100, price: p.price
          };
        });
        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      } else {
        const newItems: InventoryItem[] = allProducts.map(p => ({
          id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: p.name, emoji: p.emoji, quantity: p.quantity, unit: p.unit,
          storageId: activeStorage || 'fridge',
          expiresAt: p.expiresInDays ? new Date(Date.now() + p.expiresInDays * 24 * 60 * 60 * 1000).toISOString() : undefined,
          addedAt: new Date().toISOString(), source: 'photo' as const,
          position: { x: p.positionX, y: p.positionY },
          photoId: p.photoId, caloriesPer100: p.caloriesPer100, price: p.price
        }));
        localStorage.setItem('fitstream_inventory', JSON.stringify([...nonPhotoItems, ...newItems]));
      }

      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    } catch (error) {
      console.error('Error rescanning:', error);
      alert('Error rescanning.');
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    if (confirm('Delete this photo? Products visible only in this photo will be removed.')) {
      StorageService.removeStoragePhoto(activeStorage || 'fridge', photoId);
      setStorages(StorageService.getStorages());
      setInventory(StorageService.getInventory());
    }
  };

  const handleReplacePhoto = (oldPhotoId: string) => {
    setReplacePhotoId(oldPhotoId);
    startCamera('CAMERA_REPLACE');
  };

  const handleLabelPhoto = (photoId: string) => {
    const photos = StorageService.getStoragePhotos(activeStorage || 'fridge');
    const photo = photos.find(p => p.id === photoId);
    setLabelInput(photo?.label || '');
    setShowLabelModal(photoId);
  };

  const saveLabelPhoto = () => {
    if (showLabelModal) {
      StorageService.updateStoragePhotoLabel(activeStorage || 'fridge', showLabelModal, labelInput);
      setStorages(StorageService.getStorages());
      setShowLabelModal(null);
      setLabelInput('');
    }
  };

  const handleAddManual = () => { setAddMenuOpen(null); setShowAddModal(true); };
  const handleScanReceipt = () => { setAddMenuOpen(null); setShowReceiptModal(true); };

  const handleQuickAdd = (product: { name: string; emoji: string; unit: string; caloriesPer100: number; typicalQuantity: number; storageId: StorageType; }) => {
    const item: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: product.name, emoji: product.emoji, quantity: product.typicalQuantity, unit: product.unit,
      storageId: activeStorage || product.storageId, addedAt: new Date().toISOString(),
      source: 'manual', caloriesPer100: product.caloriesPer100
    };
    StorageService.saveInventoryItem(item);
    StorageService.trackProductUsage(item);
    setInventory(StorageService.getInventory());
    setAddMenuOpen(null);
  };

  const frequentProducts = StorageService.getFrequentProducts(4);

  const handleProductAdded = () => { setInventory(StorageService.getInventory()); setShowAddModal(false); setShowReceiptModal(false); };
  const handleProductUpdate = (item: InventoryItem) => { StorageService.saveInventoryItem(item); setInventory(StorageService.getInventory()); };
  const handleProductRemove = (id: string) => { StorageService.removeInventoryItem(id); setInventory(StorageService.getInventory()); };

  const storageIcons: Record<StorageType, React.ReactNode> = {
    fridge: <FridgeIcon className="w-5 h-5" />,
    cabinet: <FridgeIcon className="w-5 h-5" />,
    freezer: <Snowflake className="w-5 h-5" />,
    appliances: <AppliancesIcon className="" />
  };

  const storageLabels: Record<StorageType, string> = {
    fridge: 'Fridge', cabinet: 'Cabinet', freezer: 'Freezer', appliances: 'Appliances'
  };

  const getExpiringCount = (type: StorageType) => expiringItems.filter(i => i.storageId === type).length;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-1 justify-center">
          <FridgeIcon className="w-6 h-6 text-cyan-500" />
          <h2 className="text-lg font-semibold dark:text-white">Inventory</h2>
        </div>

        {/* Add button */}
        <div className="relative">
          <button
            onClick={() => setAddMenuOpen(addMenuOpen ? null : 'photo')}
            className="w-9 h-9 flex items-center justify-center bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          {addMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[200px]">
              {frequentProducts.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Quick Add
                  </div>
                  <div className="px-3 pb-2 flex flex-wrap gap-1">
                    {frequentProducts.map((product) => (
                      <button
                        key={product.name}
                        onClick={() => handleQuickAdd(product)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full text-sm hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
                      >
                        <span>{product.emoji}</span>
                        <span>{product.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                </>
              )}
              <button onClick={() => handleTakePhoto()} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                <Camera className="w-5 h-5 text-cyan-500" />
                <div><div className="font-medium dark:text-white">Take Photo</div><div className="text-xs text-gray-500">Open camera</div></div>
              </button>
              <button onClick={handlePickFromGallery} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                <Image className="w-5 h-5 text-indigo-500" />
                <div><div className="font-medium dark:text-white">From Gallery</div><div className="text-xs text-gray-500">Upload existing photo</div></div>
              </button>
              {currentPhotos.length > 0 && (
                <button onClick={() => handleTakePhoto()} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                  <Images className="w-5 h-5 text-green-500" />
                  <div><div className="font-medium dark:text-white">Add More Photos</div><div className="text-xs text-gray-500">Different angle</div></div>
                </button>
              )}
              <button onClick={handleScanReceipt} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                <Receipt className="w-5 h-5 text-purple-500" />
                <div><div className="font-medium dark:text-white">Scan Receipt</div><div className="text-xs text-gray-500">After shopping</div></div>
              </button>
              <button onClick={handleAddManual} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 text-left">
                <PenLine className="w-5 h-5 text-gray-500" />
                <div><div className="font-medium dark:text-white">Add Manually</div><div className="text-xs text-gray-500">If AI missed something</div></div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Storage Tabs */}
      <div className="px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveStorage(null)}
            className={`relative py-2 px-3 rounded-lg flex flex-col items-center gap-0.5 transition-all
              ${activeStorage === null
                ? 'bg-cyan-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {expiringItems.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <span className={`text-sm font-bold ${activeStorage === null ? 'text-white' : ''}`}>{inventory.length}</span>
            <span className={`text-[10px] font-medium ${activeStorage === null ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>All</span>
          </button>

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
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {hasExpiring && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className={`${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {storageIcons[type]}
                  </span>
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : ''}`}>{count}</span>
                </div>
                <span className={`text-[10px] font-medium truncate max-w-full ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                  {storageLabels[type]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-3 gap-2">
        {isScanning ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-cyan-500 border-t-transparent"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{scanProgress || 'Detecting products...'}</p>
          </div>
        ) : (
          <>
            {currentPhotos.length > 0 && (
              <div className="shrink-0 max-h-[40%]">
                <StoragePhoto
                  photos={currentPhotos}
                  items={currentInventory}
                  onItemClick={(item) => console.log('Item clicked:', item)}
                  onRefresh={handleRescanAll}
                  onAddPhoto={() => handleTakePhoto()}
                  onRemovePhoto={handleRemovePhoto}
                  onLabelPhoto={handleLabelPhoto}
                  onReplacePhoto={handleReplacePhoto}
                  onRetryParse={handleRetryParse}
                  isRetrying={retryingPhotoId}
                />
              </div>
            )}

            {currentPhotos.length === 0 && currentInventory.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="mb-3 text-gray-400 dark:text-gray-500 [&_svg]:w-12 [&_svg]:h-12">
                  {activeStorage ? storageIcons[activeStorage] : <FridgeIcon className="w-12 h-12" />}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {activeStorage ? `${storageLabels[activeStorage]} is empty` : 'No products yet'}
                </p>
                <button
                  onClick={() => handleTakePhoto()}
                  className="flex items-center gap-2 px-3 py-2 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
              </div>
            )}

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
          <div className="flex items-center justify-between p-4 bg-black/80">
            <button onClick={stopCamera} className="p-2 text-white hover:bg-white/20 rounded-full">
              <X className="w-6 h-6" />
            </button>
            <span className="text-white font-medium text-sm">
              {cameraMode === 'CAMERA_REPLACE' ? 'Replace Photo' : 'Photograph Storage'}
            </span>
            <div className="w-10" />
          </div>

          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-36 border-2 border-white/40 rounded-lg" />
            </div>
          </div>

          <div className="p-6 bg-black/80 flex items-center justify-center gap-6">
            <button onClick={() => { stopCamera(); handlePickFromGallery(); }} className="p-3 text-white hover:bg-white/20 rounded-full">
              <Image className="w-6 h-6" />
            </button>
            <button onClick={captureAndProcess} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white" />
            </button>
            <div className="w-12" />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Modals */}
      {showAddModal && (
        <AddProductModal
          storageId={activeStorage || 'fridge'}
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

      {showLabelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold dark:text-white mb-4">Photo Label</h3>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="e.g. Top shelf, Door"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowLabelModal(null)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={saveLabelPhoto} className="flex-1 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">Save</button>
            </div>
          </div>
        </div>
      )}

      {addMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setAddMenuOpen(null)} />
      )}
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

export default Kitchen;
