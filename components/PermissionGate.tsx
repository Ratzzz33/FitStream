/**
 * Permission Gate Component
 *
 * Wraps features that require permissions.
 * Shows rationale dialog before requesting, and helpful UI when denied.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Camera, Bluetooth, Heart, MapPin, Bell,
  AlertCircle, Settings, ExternalLink, Loader2, Check, X,
  RefreshCw, ChevronRight
} from 'lucide-react';
import {
  permissionService,
  PermissionType,
  PermissionStatus,
  PermissionInfo,
  PermissionRationale
} from '../services/permissionService';
import { t } from '../services/i18n';

interface PermissionGateProps {
  permission: PermissionType;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onPermissionChange?: (granted: boolean) => void;
  // If true, shows inline UI instead of blocking content
  inline?: boolean;
  // Custom rationale override
  customRationale?: Partial<PermissionRationale>;
}

const PERMISSION_ICONS: Record<PermissionType, React.ReactNode> = {
  camera: <Camera className="w-8 h-8" />,
  bluetooth: <Bluetooth className="w-8 h-8" />,
  health_connect: <Heart className="w-8 h-8" />,
  location: <MapPin className="w-8 h-8" />,
  notifications: <Bell className="w-8 h-8" />
};

const STATUS_COLORS: Record<PermissionStatus, string> = {
  granted: 'text-green-500',
  denied: 'text-yellow-500',
  denied_forever: 'text-red-500',
  not_requested: 'text-blue-500',
  unavailable: 'text-slate-400'
};

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  children,
  fallback,
  onPermissionChange,
  inline = false,
  customRationale
}) => {
  const [info, setInfo] = useState<PermissionInfo | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [showRationale, setShowRationale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rationale = {
    ...permissionService.getRationale(permission),
    ...customRationale
  };

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [permission]);

  const checkPermission = useCallback(async () => {
    const result = await permissionService.checkPermission(permission);
    setInfo(result);
    onPermissionChange?.(result.status === 'granted');
  }, [permission, onPermissionChange]);

  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true);
    setError(null);
    setShowRationale(false);

    try {
      const result = await permissionService.requestPermission(permission);
      setInfo(result);
      onPermissionChange?.(result.status === 'granted');

      if (result.status !== 'granted') {
        if (result.requiresSettings) {
          setError('Разрешение отклонено. Включите в настройках.');
        } else {
          setError('Разрешение не получено');
        }
      }
    } catch (e) {
      setError('Ошибка запроса разрешения');
    } finally {
      setIsRequesting(false);
    }
  }, [permission, onPermissionChange]);

  const handleOpenSettings = useCallback(async () => {
    if (permission === 'health_connect') {
      await permissionService.openHealthConnect();
    } else {
      await permissionService.openSettings();
    }
  }, [permission]);

  const handleEnableBluetooth = useCallback(async () => {
    setIsRequesting(true);
    const enabled = await permissionService.enableBluetooth();
    if (enabled) {
      await checkPermission();
    } else {
      setError('Не удалось включить Bluetooth');
    }
    setIsRequesting(false);
  }, [checkPermission]);

  // Loading state
  if (!info) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Permission granted - show children
  if (info.status === 'granted') {
    return <>{children}</>;
  }

  // Inline mode - show compact UI
  if (inline) {
    return (
      <InlinePermissionCard
        info={info}
        rationale={rationale}
        isRequesting={isRequesting}
        error={error}
        onRequest={() => setShowRationale(true)}
        onOpenSettings={handleOpenSettings}
        onEnableBluetooth={permission === 'bluetooth' ? handleEnableBluetooth : undefined}
      />
    );
  }

  // Rationale dialog
  if (showRationale) {
    return (
      <RationaleDialog
        permission={permission}
        rationale={rationale}
        isRequesting={isRequesting}
        onConfirm={handleRequestPermission}
        onCancel={() => setShowRationale(false)}
      />
    );
  }

  // Show permission request UI
  return (
    <PermissionRequestCard
      info={info}
      rationale={rationale}
      isRequesting={isRequesting}
      error={error}
      onRequest={() => setShowRationale(true)}
      onRetry={checkPermission}
      onOpenSettings={handleOpenSettings}
      onEnableBluetooth={permission === 'bluetooth' ? handleEnableBluetooth : undefined}
      fallback={fallback}
    />
  );
};

// ============ Sub-components ============

interface RationaleDialogProps {
  permission: PermissionType;
  rationale: PermissionRationale;
  isRequesting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const RationaleDialog: React.FC<RationaleDialogProps> = ({
  permission,
  rationale,
  isRequesting,
  onConfirm,
  onCancel
}) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div className="bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-xl">
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4 text-blue-400">
        {PERMISSION_ICONS[permission]}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-center mb-2">
        {rationale.icon} {rationale.title}
      </h3>

      {/* Message */}
      <p className="text-slate-400 text-center mb-4">
        {rationale.message}
      </p>

      {/* Benefits list */}
      <ul className="space-y-2 mb-6">
        {rationale.benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-slate-300">{benefit}</span>
          </li>
        ))}
      </ul>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          Отмена
        </button>
        <button
          onClick={onConfirm}
          disabled={isRequesting}
          className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRequesting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Разрешить
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);

interface PermissionRequestCardProps {
  info: PermissionInfo;
  rationale: PermissionRationale;
  isRequesting: boolean;
  error: string | null;
  onRequest: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onEnableBluetooth?: () => void;
  fallback?: React.ReactNode;
}

const PermissionRequestCard: React.FC<PermissionRequestCardProps> = ({
  info,
  rationale,
  isRequesting,
  error,
  onRequest,
  onRetry,
  onOpenSettings,
  onEnableBluetooth,
  fallback
}) => {
  const isUnavailable = info.status === 'unavailable';
  const needsSettings = info.requiresSettings || info.status === 'denied_forever';
  const isBluetooth = info.type === 'bluetooth';
  const isHealthConnect = info.type === 'health_connect';

  return (
    <div className="p-6">
      <div className="max-w-md mx-auto">
        {/* Status card */}
        <div className={`rounded-2xl p-6 border ${
          isUnavailable ? 'bg-slate-800/50 border-slate-700' :
          needsSettings ? 'bg-yellow-500/10 border-yellow-500/30' :
          'bg-blue-500/10 border-blue-500/30'
        }`}>
          {/* Icon and status */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isUnavailable ? 'bg-slate-700 text-slate-400' :
              needsSettings ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {PERMISSION_ICONS[info.type]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{rationale.title}</h3>
              <p className={`text-sm ${STATUS_COLORS[info.status]}`}>
                {getStatusText(info.status, info.type)}
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4 p-3 bg-yellow-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Unavailable - show explanation */}
            {isUnavailable && (
              <>
                <p className="text-slate-400 text-sm mb-4">
                  {isHealthConnect
                    ? 'Health Connect не установлен на вашем устройстве.'
                    : 'Эта функция недоступна на вашем устройстве.'}
                </p>
                {isHealthConnect && (
                  <button
                    onClick={onOpenSettings}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Установить из Play Store
                  </button>
                )}
              </>
            )}

            {/* Needs settings */}
            {!isUnavailable && needsSettings && (
              <>
                <p className="text-slate-400 text-sm mb-4">
                  Разрешение было отклонено. Включите его в настройках приложения.
                </p>
                <button
                  onClick={onOpenSettings}
                  className="w-full py-3 px-4 rounded-xl bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" />
                  Открыть настройки
                </button>
                <button
                  onClick={onRetry}
                  className="w-full py-3 px-4 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Проверить снова
                </button>
              </>
            )}

            {/* Can request */}
            {!isUnavailable && !needsSettings && (
              <>
                {/* Bluetooth specific - enable first */}
                {isBluetooth && info.status === 'denied' && onEnableBluetooth && (
                  <button
                    onClick={onEnableBluetooth}
                    disabled={isRequesting}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRequesting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Bluetooth className="w-5 h-5" />
                        Включить Bluetooth
                      </>
                    )}
                  </button>
                )}

                {/* Request permission button */}
                {(!isBluetooth || info.status !== 'denied') && (
                  <button
                    onClick={onRequest}
                    disabled={isRequesting}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isRequesting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Разрешить доступ
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fallback content */}
        {fallback && (
          <div className="mt-6">
            {fallback}
          </div>
        )}
      </div>
    </div>
  );
};

interface InlinePermissionCardProps {
  info: PermissionInfo;
  rationale: PermissionRationale;
  isRequesting: boolean;
  error: string | null;
  onRequest: () => void;
  onOpenSettings: () => void;
  onEnableBluetooth?: () => void;
}

const InlinePermissionCard: React.FC<InlinePermissionCardProps> = ({
  info,
  rationale,
  isRequesting,
  error,
  onRequest,
  onOpenSettings,
  onEnableBluetooth
}) => {
  const needsSettings = info.requiresSettings || info.status === 'denied_forever';
  const isUnavailable = info.status === 'unavailable';
  const isBluetooth = info.type === 'bluetooth';
  const isHealthConnect = info.type === 'health_connect';

  return (
    <div className={`rounded-xl p-4 border ${
      isUnavailable ? 'bg-slate-800/50 border-slate-700' :
      needsSettings ? 'bg-yellow-500/10 border-yellow-500/30' :
      'bg-blue-500/10 border-blue-500/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isUnavailable ? 'bg-slate-700 text-slate-400' :
          needsSettings ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {React.cloneElement(PERMISSION_ICONS[info.type] as React.ReactElement, { className: 'w-5 h-5' })}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{rationale.title}</p>
          <p className={`text-xs ${STATUS_COLORS[info.status]}`}>
            {getStatusText(info.status, info.type)}
          </p>
        </div>

        {/* Action button */}
        {isUnavailable && isHealthConnect ? (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        ) : needsSettings ? (
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-yellow-600 text-white hover:bg-yellow-500 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        ) : isBluetooth && info.status === 'denied' && onEnableBluetooth ? (
          <button
            onClick={onEnableBluetooth}
            disabled={isRequesting}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bluetooth className="w-5 h-5" />}
          </button>
        ) : !isUnavailable ? (
          <button
            onClick={onRequest}
            disabled={isRequesting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isRequesting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Разрешить
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : null}
      </div>

      {error && (
        <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// ============ Helpers ============

function getStatusText(status: PermissionStatus, type: PermissionType): string {
  switch (status) {
    case 'granted':
      return 'Разрешено ✓';
    case 'denied':
      return type === 'bluetooth' ? 'Bluetooth отключен' : 'Требуется разрешение';
    case 'denied_forever':
      return 'Отклонено. Включите в настройках';
    case 'not_requested':
      return 'Нажмите чтобы разрешить';
    case 'unavailable':
      return type === 'health_connect' ? 'Health Connect не установлен' : 'Недоступно на устройстве';
    default:
      return 'Неизвестно';
  }
}

export default PermissionGate;
