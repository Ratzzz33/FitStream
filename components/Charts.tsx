

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import { ExerciseLog, WeightLog } from '../types';
import { t } from '../services/i18n';
import { StorageService } from '../services/storageService';
import { Lock } from 'lucide-react';

interface ChartsProps {
  exercises: ExerciseLog[];
  weights: WeightLog[];
  targetWeight?: number;
  isPro?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  targetWeight?: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, targetWeight }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 shadow-xl rounded-2xl text-sm min-w-[200px] z-50">
        <p className="font-bold text-gray-900 dark:text-white mb-3 text-base border-b border-gray-100 dark:border-gray-700 pb-2">
            {formattedDate}
        </p>
        
        <div className="space-y-3">
            {payload.map((entry: any, idx: number) => {
                 const isReps = entry.name === t('reps');
                 const isWeight = entry.name === t('weight');
                 
                 if (isReps && entry.value !== undefined && entry.value !== null) {
                     return (
                         <div key={idx}>
                             <div className="flex items-center justify-between mb-1">
                                 <div className="flex items-center gap-2">
                                     <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                     <span className="text-gray-500 dark:text-gray-400 font-medium">{t('reps')}</span>
                                 </div>
                                 <span className="font-mono font-bold text-xl text-gray-900 dark:text-white">{entry.value}</span>
                             </div>
                             {data.lastActivityTime && (
                                 <p className="text-xs text-gray-400 text-right">
                                     {t('lastActivity')}: {new Date(data.lastActivityTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                             )}
                         </div>
                     );
                 }
                 
                 if (isWeight && entry.value !== undefined && entry.value !== null) {
                     const diff = targetWeight ? (entry.value - targetWeight).toFixed(1) : null;
                     const isGoalMet = targetWeight && entry.value <= targetWeight;
                     const diffVal = parseFloat(diff || '0');

                     return (
                         <div key={idx}>
                             <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-gray-500 dark:text-gray-400 font-medium">{t('weight')}</span>
                                </div>
                                <span className="font-mono font-bold text-xl text-gray-900 dark:text-white">{entry.value} <span className="text-sm font-normal text-gray-500">{t('unitKg')}</span></span>
                             </div>
                             {data.lastWeightTime && (
                                 <p className="text-xs text-gray-400 text-right mb-1">
                                     {new Date(data.lastWeightTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </p>
                             )}
                             {targetWeight && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg flex justify-between items-center text-xs mt-1">
                                    <span className="text-gray-500">{t('goal')}: {targetWeight}{t('unitKg')}</span>
                                    <span className={`font-bold ${isGoalMet ? 'text-green-500' : 'text-orange-500'}`}>
                                        {diffVal > 0 ? '+' : ''}{diff} {t('unitKg')}
                                    </span>
                                </div>
                             )}
                         </div>
                     );
                 }
                 return null;
            })}
        </div>
      </div>
    );
  }
  return null;
};

export const StatsCharts: React.FC<ChartsProps> = ({ exercises, weights, targetWeight, isPro }) => {
  const [viewMode, setViewMode] = useState<'COMBINED' | 'SEPARATE'>('COMBINED');
  const settings = StorageService.getSettings();
  const isDark = settings.theme === 'dark';

  const processedData = useMemo(() => {
    // Merge data by date
    const dataMap = new Map<string, any>();

    exercises.forEach(e => {
      if (!dataMap.has(e.date)) {
          dataMap.set(e.date, { date: e.date, reps: 0, weight: null, lastActivityTime: e.timestamp });
      }
      const entry = dataMap.get(e.date);
      entry.reps += e.reps;
      // Track latest timestamp for exercises
      if (e.timestamp > (entry.lastActivityTime || 0)) {
          entry.lastActivityTime = e.timestamp;
      }
    });

    weights.forEach(w => {
       const dateKey = w.date; 
       if (!dataMap.has(dateKey)) {
           dataMap.set(dateKey, { date: dateKey, reps: 0, weight: null });
       }
       const entry = dataMap.get(dateKey);
       entry.weight = w.weight;
       entry.lastWeightTime = w.timestamp;
    });

    const fullData = Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // If NOT pro, only show last 7 days + dummy data for blur effect
    if (!isPro) {
        return fullData.slice(-7);
    }
    return fullData;

  }, [exercises, weights, isPro]);

  // Chart colors based on theme
  const colors = {
      grid: isDark ? '#374151' : '#e5e7eb', // gray-700 vs gray-200
      text: isDark ? '#9ca3af' : '#6b7280', // gray-400 vs gray-500
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode('COMBINED')}
          className={`px-3 py-1 text-xs rounded-full border ${viewMode === 'COMBINED' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
        >
          {t('combined')}
        </button>
        <button
          onClick={() => setViewMode('SEPARATE')}
          className={`px-3 py-1 text-xs rounded-full border ${viewMode === 'SEPARATE' ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
        >
          {t('separate')}
        </button>
      </div>

      <div className="relative">
          <div className="h-64 w-full bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/5 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                {viewMode === 'COMBINED' ? (
                    <AreaChart data={processedData}>
                        <defs>
                            <linearGradient id="colorReps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickFormatter={(str) => str.substring(5)} />
                        <YAxis yAxisId="left" stroke="#3b82f6" fontSize={10} />
                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip content={<CustomTooltip targetWeight={targetWeight} />} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="reps" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReps)" name={t('reps')} />
                        <Area yAxisId="right" type="monotone" dataKey="weight" stroke="#10b981" fillOpacity={1} fill="url(#colorWeight)" name={t('weight')} connectNulls />
                        {targetWeight && (
                            <ReferenceLine yAxisId="right" y={targetWeight} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'right', value: t('goal'), fill: '#fbbf24', fontSize: 10 }} />
                        )}
                    </AreaChart>
                ) : (
                    <BarChart data={processedData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                        <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickFormatter={(str) => str.substring(5)} />
                        <YAxis stroke={colors.text} fontSize={10} />
                        <Tooltip content={<CustomTooltip targetWeight={targetWeight} />} />
                        <Legend />
                        <Bar dataKey="reps" fill="#3b82f6" radius={[4, 4, 0, 0]} name={t('reps')} />
                    </BarChart>
                )}
            </ResponsiveContainer>
          </div>
          
          {/* Pro Lock Overlay for History */}
          {!isPro && (
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 flex items-center justify-center">
                   {/* Blur effect simulated by gradient covering the old data */}
              </div>
          )}
          {!isPro && (
               <div className="absolute top-2 left-2 z-20">
                   <div className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 border border-yellow-200 dark:border-yellow-700">
                       <Lock size={10} /> {t('freeLimitReached')}
                   </div>
               </div>
          )}
      </div>

      {viewMode === 'SEPARATE' && (
          <div className="h-64 w-full bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-white/5 shadow-sm">
            <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={processedData}>
                     <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                     <XAxis dataKey="date" stroke={colors.text} fontSize={10} tickFormatter={(str) => str.substring(5)} />
                     <YAxis stroke="#10b981" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                     <Tooltip content={<CustomTooltip targetWeight={targetWeight} />} />
                     <Legend />
                     <Area type="monotone" dataKey="weight" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name={t('weight')} connectNulls />
                     {targetWeight && (
                        <ReferenceLine y={targetWeight} stroke="#fbbf24" strokeDasharray="3 3" label={{ position: 'right', value: t('goal'), fill: '#fbbf24', fontSize: 10 }} />
                    )}
                 </AreaChart>
            </ResponsiveContainer>
          </div>
      )}
    </div>
  );
};