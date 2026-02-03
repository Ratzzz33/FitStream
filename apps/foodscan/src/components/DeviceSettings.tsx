/**
 * Device Settings Component (FoodScan standalone)
 * Phone weight calibration and reference object configuration
 */

import React, { useState } from 'react';
import { Smartphone, Camera, Loader2, CheckCircle, X, Search } from 'lucide-react';
import { UserSettings } from '@fitstream/shared';
import { t } from '@fitstream/shared';
import { StorageService } from '../services/storageService';
import { getPhoneSpecs } from '../services/geminiService';
import { ReferenceObjectScanner } from './ReferenceObjectScanner';

interface DeviceSettingsProps {
  settings: UserSettings;
  onUpdate: () => void;
  onClose?: () => void;
}

export const DeviceSettings: React.FC<DeviceSettingsProps> = ({ settings, onUpdate, onClose }) => {
  const [phoneSearch, setPhoneSearch] = useState(settings.phoneModel || '');
  const [isSearching, setIsSearching] = useState(false);
  const [showRefScanner, setShowRefScanner] = useState(false);

  const handlePhoneSearch = async () => {
    if (!phoneSearch.trim()) return;
    setIsSearching(true);
    try {
      const result = await getPhoneSpecs(phoneSearch);
      if (result) {
        const newSettings = {
          ...settings,
          phoneModel: result.officialName,
          phoneWeight: result.weightGrams / 1000, // Convert to kg
        };
        StorageService.saveSettings(newSettings);
        onUpdate();
      }
    } catch (e) {
      console.error('Phone search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRefObjectSave = (name: string, dimensions: string) => {
    const newSettings = {
      ...settings,
      referenceObject: name,
      referenceDimensions: dimensions,
    };
    StorageService.saveSettings(newSettings);
    setShowRefScanner(false);
    onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone size={20} className="text-orange-500" />
          {t('deviceSettings') || 'Device Settings'}
        </h3>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Phone Weight Calibration */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Smartphone size={16} className="text-purple-500" />
          {t('deviceProfile') || 'Phone Calibration'}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {t('calibrationInfo') || 'Your phone weight is subtracted from scale readings for accurate body weight.'}
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            placeholder="iPhone 15 Pro, Galaxy S24..."
            className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-sm outline-none focus:border-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && handlePhoneSearch()}
          />
          <button
            onClick={handlePhoneSearch}
            disabled={isSearching || !phoneSearch.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 rounded-lg flex items-center gap-2 disabled:opacity-50 transition"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </div>

        {settings.phoneModel && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-purple-700 dark:text-purple-300 text-sm">{settings.phoneModel}</p>
                <p className="text-xs text-purple-500 dark:text-purple-400">
                  {t('phoneDeduction') || 'Weight deduction'}: -{settings.phoneWeight} {t('unitKg') || 'kg'}
                </p>
              </div>
              <CheckCircle size={20} className="text-purple-500" />
            </div>
          </div>
        )}
      </div>

      {/* Reference Object */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Camera size={16} className="text-blue-500" />
          {t('referenceObject') || 'Reference Object'}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Place a known object next to food for accurate portion estimation.
        </p>

        {settings.referenceObject ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300 text-sm">{settings.referenceObject}</p>
                {settings.referenceDimensions && (
                  <p className="text-xs text-blue-500 dark:text-blue-400">{settings.referenceDimensions}</p>
                )}
              </div>
              <CheckCircle size={20} className="text-blue-500" />
            </div>
          </div>
        ) : null}

        <button
          onClick={() => setShowRefScanner(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Camera size={18} />
          {settings.referenceObject ? (t('changeRefObject') || 'Change Reference Object') : (t('scanRefObject') || 'Scan Reference Object')}
        </button>
      </div>

      {/* Reference Object Scanner Modal */}
      {showRefScanner && (
        <ReferenceObjectScanner
          onClose={() => setShowRefScanner(false)}
          onSave={handleRefObjectSave}
        />
      )}
    </div>
  );
};

export default DeviceSettings;
