import React, { useState, useEffect, useCallback } from 'react';
import {
  Bluetooth,
  BluetoothOff,
  Scale,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Activity,
  Droplets,
  Bone,
  Flame,
  Heart,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { scaleService } from '../services/scaleService';
import { SmartScaleDevice, WeightLog, BodyComposition, UserSettings } from '../types';

interface SmartScaleProps {
  settings: UserSettings;
  onWeightLogged: (log: WeightLog) => void;
  theme: 'light' | 'dark';
}

type ConnectionState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';

const SmartScale: React.FC<SmartScaleProps> = ({ settings, onWeightLogged, theme }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [bleAvailable, setBleAvailable] = useState<boolean | null>(null);
  const [foundDevices, setFoundDevices] = useState<SmartScaleDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<SmartScaleDevice | null>(null);
  const [lastReading, setLastReading] = useState<WeightLog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    checkBleAvailability();
  }, []);

  const checkBleAvailability = async () => {
    const available = await scaleService.isAvailable();
    setBleAvailable(available);
    if (!available) {
      setError('Bluetooth is not available or disabled');
    }
  };

  const startScan = async () => {
    setError(null);
    setFoundDevices([]);
    setConnectionState('scanning');

    try {
      await scaleService.initialize();
      await scaleService.scanForScales(
        (device) => {
          setFoundDevices((prev) => {
            if (prev.find((d) => d.id === device.id)) return prev;
            return [...prev, device];
          });
        },
        15000
      );

      setTimeout(() => {
        if (connectionState === 'scanning') {
          setConnectionState('idle');
        }
      }, 15000);
    } catch (err) {
      setError('Failed to scan for devices');
      setConnectionState('error');
    }
  };

  const stopScan = async () => {
    await scaleService.stopScan();
    setConnectionState('idle');
  };

  const connectToDevice = async (device: SmartScaleDevice) => {
    setError(null);
    setConnectionState('connecting');

    const success = await scaleService.connect(
      device.id,
      (reading) => {
        const log = scaleService.saveScaleReading(reading);
        setLastReading(log);
        onWeightLogged(log);
      },
      (connected, dev) => {
        if (connected && dev) {
          setConnectedDevice(dev);
          setConnectionState('connected');
        } else {
          setConnectedDevice(null);
          setConnectionState('idle');
        }
      }
    );

    if (!success) {
      setError('Failed to connect to scale');
      setConnectionState('error');
    }
  };

  const disconnect = async () => {
    await scaleService.disconnect();
    setConnectedDevice(null);
    setConnectionState('idle');
  };

  const renderBodyCompositionCard = (
    icon: React.ReactNode,
    label: string,
    value: string | number,
    unit: string,
    color: string
  ) => (
    <div
      className={`p-3 rounded-xl ${isDark ? 'bg-zinc-800/50' : 'bg-gray-100'}`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </span>
        <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>{unit}</span>
      </div>
    </div>
  );

  const renderLastReading = () => {
    if (!lastReading) return null;

    const bc = lastReading.bodyComposition;

    return (
      <div className={`mt-4 p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Latest Reading
          </h3>
          <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            {(() => {
              const d = new Date(lastReading.timestamp);
              return isNaN(d.getTime()) ? '' : d.toLocaleTimeString();
            })()}
          </span>
        </div>

        <div className="flex items-center justify-center mb-4">
          <div className="text-center">
            <span className="text-4xl font-bold text-emerald-500">{lastReading.weight}</span>
            <span className={`text-lg ml-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>kg</span>
          </div>
        </div>

        {bc && (
          <div className="grid grid-cols-2 gap-2">
            {bc.bodyFat !== undefined && (
              renderBodyCompositionCard(
                <Activity size={14} />,
                'Body Fat',
                bc.bodyFat,
                '%',
                '#f97316'
              )
            )}
            {bc.muscleMass !== undefined && (
              renderBodyCompositionCard(
                <Zap size={14} />,
                'Muscle',
                bc.muscleMass,
                'kg',
                '#3b82f6'
              )
            )}
            {bc.waterPercent !== undefined && (
              renderBodyCompositionCard(
                <Droplets size={14} />,
                'Water',
                bc.waterPercent,
                '%',
                '#06b6d4'
              )
            )}
            {bc.boneMass !== undefined && (
              renderBodyCompositionCard(
                <Bone size={14} />,
                'Bone',
                bc.boneMass,
                'kg',
                '#a855f7'
              )
            )}
            {bc.bmi !== undefined && (
              renderBodyCompositionCard(
                <TrendingUp size={14} />,
                'BMI',
                bc.bmi,
                '',
                '#10b981'
              )
            )}
            {bc.bmr !== undefined && (
              renderBodyCompositionCard(
                <Flame size={14} />,
                'BMR',
                bc.bmr,
                'kcal',
                '#ef4444'
              )
            )}
            {bc.visceralFat !== undefined && (
              renderBodyCompositionCard(
                <Heart size={14} />,
                'Visceral',
                bc.visceralFat,
                'lvl',
                '#ec4899'
              )
            )}
            {bc.metabolicAge !== undefined && (
              renderBodyCompositionCard(
                <Activity size={14} />,
                'Meta Age',
                bc.metabolicAge,
                'yrs',
                '#8b5cf6'
              )
            )}
          </div>
        )}
      </div>
    );
  };

  if (bleAvailable === false) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'} shadow-lg`}>
        <div className="flex flex-col items-center text-center">
          <BluetoothOff size={48} className="text-red-500 mb-4" />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Bluetooth Unavailable
          </h3>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            Please enable Bluetooth to connect to your smart scale.
          </p>
          <button
            onClick={checkBleAvailability}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Check Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Card */}
      <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'} shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                connectionState === 'connected'
                  ? 'bg-emerald-500/20'
                  : isDark
                  ? 'bg-zinc-700'
                  : 'bg-gray-100'
              }`}
            >
              {connectionState === 'connected' ? (
                <Bluetooth size={20} className="text-emerald-500" />
              ) : (
                <Scale size={20} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Smart Scale
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {connectionState === 'connected' && connectedDevice
                  ? connectedDevice.name
                  : connectionState === 'scanning'
                  ? 'Searching for scales...'
                  : connectionState === 'connecting'
                  ? 'Connecting...'
                  : 'Xiaomi Mi Scale supported'}
              </p>
            </div>
          </div>

          {connectionState === 'connected' ? (
            <button
              onClick={disconnect}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-500 rounded-lg"
            >
              Disconnect
            </button>
          ) : connectionState === 'scanning' ? (
            <button
              onClick={stopScan}
              className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${
                isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-gray-200 text-gray-700'
              }`}
            >
              <Loader2 size={14} className="animate-spin" />
              Stop
            </button>
          ) : (
            <button
              onClick={startScan}
              disabled={connectionState === 'connecting'}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Search size={14} />
              Scan
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 rounded-lg flex items-center gap-2">
            <XCircle size={16} className="text-red-500" />
            <span className="text-sm text-red-500">{error}</span>
          </div>
        )}

        {/* Found Devices */}
        {foundDevices.length > 0 && connectionState !== 'connected' && (
          <div className="space-y-2">
            <h4 className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Found Devices
            </h4>
            {foundDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => connectToDevice(device)}
                disabled={connectionState === 'connecting'}
                className={`w-full p-3 rounded-xl flex items-center justify-between ${
                  isDark
                    ? 'bg-zinc-700/50 hover:bg-zinc-700'
                    : 'bg-gray-50 hover:bg-gray-100'
                } transition-colors disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <Scale size={18} className="text-blue-500" />
                  <div className="text-left">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {device.name}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      {device.type === 'xiaomi_v2'
                        ? 'Mi Body Composition Scale'
                        : 'Mi Scale V1'}
                    </p>
                  </div>
                </div>
                {connectionState === 'connecting' ? (
                  <Loader2 size={16} className="text-blue-500 animate-spin" />
                ) : (
                  <Bluetooth size={16} className={isDark ? 'text-zinc-500' : 'text-gray-400'} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Connected State */}
        {connectionState === 'connected' && (
          <div className="p-4 bg-emerald-500/10 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 size={20} />
              <span className="font-medium">Connected</span>
            </div>
            <p className={`text-sm mt-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Step on the scale to measure. Make sure to stand still until the reading stabilizes.
            </p>
          </div>
        )}

        {/* Scanning Animation */}
        {connectionState === 'scanning' && foundDevices.length === 0 && (
          <div className="py-8 flex flex-col items-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 flex items-center justify-center">
                <Bluetooth size={24} className="text-blue-500" />
              </div>
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <p className={`mt-4 text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
              Looking for nearby scales...
            </p>
          </div>
        )}
      </div>

      {/* Last Reading */}
      {renderLastReading()}

      {/* Instructions */}
      {connectionState === 'idle' && foundDevices.length === 0 && !lastReading && (
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
          <h4 className={`font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            How to connect
          </h4>
          <ol className={`text-sm space-y-2 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            <li>1. Make sure your Xiaomi Mi Scale is nearby</li>
            <li>2. Step on the scale briefly to wake it up</li>
            <li>3. Tap "Scan" to find your scale</li>
            <li>4. Select your scale from the list to connect</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default SmartScale;
