
import React from 'react';
import { UserSettings, GoalType, DailyGoal } from '../types';
import { StorageService } from '../services/storageService';
import { X, Check } from 'lucide-react';
import { t } from '../services/i18n';

interface GoalSettingsProps {
  onClose: () => void;
  onUpdate: () => void;
}

const getLabelForType = (type: GoalType): string => {
    switch(type) {
        case 'CALORIES': return t('calories');
        case 'WATER': return t('water');
        case 'STEPS': return t('steps');
        case 'PUSHUPS': return t('pushups');
        case 'SQUATS': return t('squats');
        case 'SITUPS': return t('situps');
        case 'JUMPING_JACKS': return t('jumpingJacks');
        case 'LUNGES': return t('lunges');
        case 'BURPEES': return t('burpees');
        case 'DIPS': return t('dips');
        case 'PULLUPS': return t('pullups');
        default: return type;
    }
};

// Order: CALORIES, WATER first, then exercise goals
const AVAILABLE_TYPES: GoalType[] = [
  'CALORIES', 'WATER', 'STEPS', 'PUSHUPS', 'SQUATS', 'SITUPS', 'JUMPING_JACKS', 'LUNGES', 'BURPEES', 'DIPS', 'PULLUPS'
];

export const GoalSettings: React.FC<GoalSettingsProps> = ({ onClose, onUpdate }) => {
  const [settings, setSettings] = React.useState<UserSettings>(StorageService.getSettings());

  const toggleGoal = (type: GoalType) => {
    const updatedGoals = settings.goals.map(g => {
        if (g.type === type) {
            return { ...g, isEnabled: !g.isEnabled };
        }
        return g;
    });
    const newSettings = { ...settings, goals: updatedGoals };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const updateTarget = (type: GoalType, val: number) => {
    const updatedGoals = settings.goals.map(g => {
        if (g.type === type) {
            return { ...g, target: val };
        }
        return g;
    });
    const newSettings = { ...settings, goals: updatedGoals };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const updateColor = (type: GoalType, color: string) => {
    const updatedGoals = settings.goals.map(g => {
        if (g.type === type) {
            return { ...g, color: color };
        }
        return g;
    });
    const newSettings = { ...settings, goals: updatedGoals };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('manageGoals')}</h2>
            <button onClick={() => { onUpdate(); onClose(); }} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full text-gray-500 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700">
                <X size={20} />
            </button>
        </div>
        
        <div className="overflow-y-auto p-4 space-y-4">
            {AVAILABLE_TYPES.map((type) => {
                const goal = settings.goals.find(g => g.type === type) || { type, target: 50, current: 0, isEnabled: false, unit: 'reps', color: '#3b82f6' };
                const label = getLabelForType(type);
                
                return (
                    <div key={type} className={`p-4 rounded-xl border transition-all ${goal.isEnabled ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/50' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-gray-900 dark:text-white">{label}</span>
                            <button 
                                onClick={() => toggleGoal(type)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center border ${goal.isEnabled ? 'bg-blue-500 border-blue-500' : 'border-gray-400 dark:border-gray-500'}`}
                            >
                                {goal.isEnabled && <Check size={14} className="text-white" />}
                            </button>
                        </div>
                        {goal.isEnabled && (
                            <div className="flex items-center gap-4 mt-2">
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">{t('dailyTarget')}</label>
                                    <input 
                                        type="number" 
                                        value={goal.target}
                                        onChange={(e) => updateTarget(type, parseInt(e.target.value) || 0)}
                                        className="w-full bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white mt-1"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{t('color')}</label>
                                    <div className="relative overflow-hidden w-full h-9 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-950">
                                         <div className="w-6 h-6 rounded-full" style={{ backgroundColor: goal.color }}></div>
                                         <input 
                                            type="color" 
                                            value={goal.color}
                                            onChange={(e) => updateColor(type, e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                         />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => { onUpdate(); onClose(); }} className="w-full bg-blue-600 py-3 rounded-xl font-bold text-white hover:bg-blue-500 transition">
                {t('saveChanges')}
            </button>
        </div>
      </div>
    </div>
  );
};
