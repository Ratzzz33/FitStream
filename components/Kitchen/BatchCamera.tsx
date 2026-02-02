import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, Check, Loader2, SwitchCamera, Zap, ZapOff, ImageIcon, WifiOff } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { scanStoragePhoto, detectStorageType, deduplicateProducts, ProductWithPhotoId, ScannedProduct } from '../../services/geminiService';
import { InventoryItem, StorageType } from '../../types';
// Offline photos saved to localStorage for later processing

interface BatchCameraProps {
  onClose: () => void;
  onComplete: () => void;
}

interface QueuedPhoto {
  id: string;
  base64: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  detectedType?: StorageType;
  productsCount?: number;
  error?: string;
}

const MAX_PHOTOS = 10;
const IDLE_TIMEOUT_MS = 3000; // 3 seconds

export const BatchCamera: React.FC<BatchCameraProps> = ({ onClose, onComplete }) => {
  const [photos, setPhotos] = useState<QueuedPhoto[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
  const [showFinishPrompt, setShowFinishPrompt] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 2560 },
          height: { ideal: 1440 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.error('Camera access denied:', e);
      alert('Не удалось получить доступ к камере');
      onClose();
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (photos.length >= 1 && isCapturing) {
      idleTimerRef.current = setTimeout(() => {
        setShowFinishPrompt(true);
      }, IDLE_TIMEOUT_MS);
    }
  }, [photos.length, isCapturing]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [photos.length, resetIdleTimer]);

  // Capture photo
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || photos.length >= MAX_PHOTOS) return;

    setShowFinishPrompt(false);
    resetIdleTimer();

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];

    // Vibration feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Audio feedback
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
      // Audio not supported
    }

    const photoId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    setPhotos(prev => [...prev, {
      id: photoId,
      base64,
      status: 'pending'
    }]);
  };

  // Finish capturing and start processing
  const finishCapturing = () => {
    setIsCapturing(false);
    setShowFinishPrompt(false);
    stopCamera();
    processPhotos();
  };

  // Process all photos
  const processPhotos = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    const pendingPhotos = photos.filter(p => p.status === 'pending');
    setProcessingProgress({ current: 0, total: pendingPhotos.length });

    // If offline, save for later processing
    if (!isOnline) {
      const pendingBatchPhotos = JSON.parse(localStorage.getItem('fitstream_pending_batch_photos') || '[]');
      for (const photo of pendingPhotos) {
        pendingBatchPhotos.push({
          id: photo.id,
          base64: photo.base64,
          timestamp: Date.now()
        });
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, status: 'done' } : p
        ));
      }
      localStorage.setItem('fitstream_pending_batch_photos', JSON.stringify(pendingBatchPhotos));
      setTimeout(() => onComplete(), 1000);
      return;
    }

    // Process photos one by one
    let processedCount = 0;
    const allProducts: ProductWithPhotoId[] = [];
    const storageTypes: Map<StorageType, string[]> = new Map();

    for (const photo of pendingPhotos) {
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, status: 'processing' } : p
      ));

      try {
        // Detect storage type
        const detectedType = await detectStorageType(`data:image/jpeg;base64,${photo.base64}`);

        // Save photo to storage
        const photoId = StorageService.addStoragePhoto(detectedType, `data:image/jpeg;base64,${photo.base64}`);

        // Track which photos go to which storage
        if (!storageTypes.has(detectedType)) {
          storageTypes.set(detectedType, []);
        }
        storageTypes.get(detectedType)!.push(photoId);

        // Scan for products
        const scannedProducts = await scanStoragePhoto(`data:image/jpeg;base64,${photo.base64}`, detectedType);
        const productsWithPhotoId: ProductWithPhotoId[] = scannedProducts.map((p: ScannedProduct) => ({
          ...p,
          photoId
        }));

        allProducts.push(...productsWithPhotoId);

        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? {
            ...p,
            status: 'done',
            detectedType,
            productsCount: scannedProducts.length
          } : p
        ));
      } catch (error: any) {
        console.error('Error processing photo:', error);
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? {
            ...p,
            status: 'error',
            error: error.message || 'Ошибка обработки'
          } : p
        ));
      }

      processedCount++;
      setProcessingProgress({ current: processedCount, total: pendingPhotos.length });
    }

    // Deduplicate products across all photos
    if (allProducts.length > 0) {
      try {
        const deduplicated = await deduplicateProducts(allProducts);

        // Group by storage type and save
        for (const [storageType, photoIds] of storageTypes.entries()) {
          const storageProducts = deduplicated.filter(p =>
            p.photoIds.some(pid => photoIds.includes(pid))
          );

          // Remove old photo-items for these storages
          const existingItems = StorageService.getInventory();
          const nonPhotoItems = existingItems.filter(i =>
            i.storageId !== storageType || i.source !== 'photo'
          );

          // Create new items
          const newItems: InventoryItem[] = storageProducts.map(p => {
            const primaryPosition = p.positions[0];
            return {
              id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: p.name,
              emoji: p.emoji,
              quantity: p.quantity,
              unit: p.unit,
              storageId: storageType,
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
        }
      } catch (error) {
        console.error('Error deduplicating products:', error);
      }
    }

    // Complete
    setTimeout(() => onComplete(), 1500);
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      }
    }
  };

  const completedCount = photos.filter(p => p.status === 'done').length;
  const errorCount = photos.filter(p => p.status === 'error').length;
  const processingCount = photos.filter(p => p.status === 'processing').length;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Camera View */}
      {isCapturing ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Top controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
            <button
              onClick={onClose}
              className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
              <Camera size={18} className="text-white" />
              <span className="text-white font-bold">{photos.length}/{MAX_PHOTOS}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={toggleFlash}
                className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
              >
                {flashEnabled ? <Zap size={24} className="text-yellow-400" /> : <ZapOff size={24} />}
              </button>
              <button
                onClick={switchCamera}
                className="bg-black/50 backdrop-blur-sm text-white p-3 rounded-full"
              >
                <SwitchCamera size={24} />
              </button>
            </div>
          </div>

          {/* Photo thumbnails */}
          {photos.length > 0 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              {photos.slice(-5).map((photo, i) => (
                <div
                  key={photo.id}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${
                    photo.status === 'done' ? 'border-green-500' :
                    photo.status === 'error' ? 'border-red-500' :
                    photo.status === 'processing' ? 'border-yellow-500' :
                    'border-white/50'
                  }`}
                >
                  <img
                    src={`data:image/jpeg;base64,${photo.base64}`}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photo.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Center guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-56 border-2 border-white/40 rounded-2xl">
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
            </div>
          </div>

          {/* Hint */}
          <div className="absolute top-24 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              Снимайте полки, дверцы, ящики - до {MAX_PHOTOS} фото
            </div>
          </div>

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-8 pt-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-8">
            {/* Photo count */}
            <div className="text-white text-center">
              <ImageIcon size={24} className="mx-auto mb-1 opacity-60" />
              <span className="text-sm opacity-60">{photos.length}</span>
            </div>

            {/* Capture button */}
            <button
              onClick={capturePhoto}
              disabled={photos.length >= MAX_PHOTOS}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>

            {/* Finish button */}
            {photos.length > 0 && (
              <button
                onClick={finishCapturing}
                className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold flex items-center gap-2"
              >
                <Check size={20} />
                Готово
              </button>
            )}
          </div>

          {/* Finish prompt */}
          {showFinishPrompt && (
            <div className="absolute bottom-32 left-0 right-0 flex justify-center animate-in fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mx-4 flex items-center gap-4">
                <span className="text-gray-700 dark:text-gray-300">Завершить съёмку?</span>
                <button
                  onClick={finishCapturing}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Да
                </button>
                <button
                  onClick={() => {
                    setShowFinishPrompt(false);
                    resetIdleTimer();
                  }}
                  className="text-gray-500 px-4 py-2"
                >
                  Нет
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Processing View */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-white">
          {!isOnline && (
            <div className="flex items-center gap-2 text-yellow-400 mb-4">
              <WifiOff size={20} />
              <span>Офлайн - фото сохранены для обработки позже</span>
            </div>
          )}

          <div className="w-20 h-20 mb-6 relative">
            <Loader2 className="w-full h-full text-blue-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{processingProgress.current}/{processingProgress.total}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">Обработка фото</h2>
          <p className="text-gray-400 mb-6">Распознаём продукты...</p>

          {/* Progress bar */}
          <div className="w-full max-w-xs h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(processingProgress.current / processingProgress.total) * 100}%` }}
            />
          </div>

          {/* Photo results */}
          <div className="w-full max-w-md space-y-2">
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  photo.status === 'done' ? 'bg-green-900/30' :
                  photo.status === 'error' ? 'bg-red-900/30' :
                  photo.status === 'processing' ? 'bg-yellow-900/30' :
                  'bg-gray-800'
                }`}
              >
                <img
                  src={`data:image/jpeg;base64,${photo.base64}`}
                  alt={`Photo ${i + 1}`}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {photo.status === 'done' && photo.detectedType && (
                      <>
                        {photo.detectedType === 'fridge' && '🧊 Холодильник'}
                        {photo.detectedType === 'freezer' && '❄️ Морозилка'}
                        {photo.detectedType === 'cabinet' && '📦 Шкаф'}
                        {photo.detectedType === 'appliances' && '🍳 Приборы'}
                      </>
                    )}
                    {photo.status === 'processing' && 'Обработка...'}
                    {photo.status === 'pending' && 'В очереди'}
                    {photo.status === 'error' && 'Ошибка'}
                  </div>
                  {photo.status === 'done' && photo.productsCount !== undefined && (
                    <div className="text-sm text-gray-400">
                      Найдено: {photo.productsCount} продуктов
                    </div>
                  )}
                  {photo.status === 'error' && photo.error && (
                    <div className="text-sm text-red-400">{photo.error}</div>
                  )}
                </div>
                {photo.status === 'done' && <Check className="w-5 h-5 text-green-400" />}
                {photo.status === 'processing' && <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />}
              </div>
            ))}
          </div>

          {/* Summary */}
          {processingProgress.current === processingProgress.total && (
            <div className="mt-6 text-center animate-in fade-in">
              <div className="text-green-400 font-semibold mb-2">
                Готово! {completedCount} из {photos.length} фото обработано
              </div>
              {errorCount > 0 && (
                <div className="text-red-400 text-sm">{errorCount} с ошибками</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchCamera;
