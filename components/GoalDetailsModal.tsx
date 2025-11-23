import React, { useState, useMemo } from 'react';
import { X, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DailyGoal } from '../types';
import { StorageService } from '../services/storageService';
import { t } from '../services/i18n';

interface GoalDetailsModalProps {
  goal: DailyGoal;
  label: string;
  onClose: () => void;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
                <p className="font-bold text-gray-900 dark:text-white mb-1">{label}</p>
                <p className="text-blue-500 font-mono font-bold">
                    {payload[0].value} <span className="text-xs text-gray-400">{unit}</span>
                </p>
            </div>
        );
    }
    return null;
};

export const GoalDetailsModal: React.FC<GoalDetailsModalProps> = ({ goal, label, onClose }) => {
  const [period, setPeriod] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = useMemo(() => {
    const exercises = StorageService.getExercises();
    const now = new Date();
    const days = period === 'WEEK' ? 7 : 30;
    const result = [];

    // Normalize strings for comparison
    // Goal Type: "JUMPING_JACKS" -> "jumpingjacks"
    const goalKey = goal.type.replace(/[^a-zA-Z]/g, '').toLowerCase(); 
    
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        // Filter logs for this specific day and exercise type
        const dayLogs = exercises.filter(e => {
            const logName = e.exerciseName.replace(/[^a-zA-Z]/g, '').toLowerCase();
            return e.date === dateStr && logName.includes(goalKey);
        });

        // Special case for STEPS if it's not logged as an exercise event but updated in daily goal?
        // In this architecture, useStepCounter updates goal.current but doesn't log history.
        // We will show 0 or partial data for steps unless logs exist. 
        // Assuming WorkoutSession logs "Steps" events (running in place).
        
        const total = dayLogs.reduce((acc, curr) => acc + curr.reps, 0);
        
        result.push({
            date: dateStr,
            displayDate: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
            value: total
        });
    }
    return result;
  }, [goal, period]);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const average = Math.round(total / data.length);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {label}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('statistics')}</p>
            </div>
            <button onClick={onClose} className="bg-white dark:bg-gray-700 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition shadow-sm">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
            {/* Period Toggles */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                <button 
                    onClick={() => setPeriod('WEEK')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${period === 'WEEK' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    {t('week')}
                </button>
                <button 
                    onClick={() => setPeriod('MONTH')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${period === 'MONTH' ? 'bg-white dark:bg-gray-700 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    {t('month')}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase mb-1">{t('total')}</p>
                    <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{total}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-300 font-bold uppercase mb-1">{t('average')}</p>
                    <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{average}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={goal.color} strokeOpacity={0.1} />
                        <XAxis 
                            dataKey="displayDate" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }} 
                            interval={period === 'WEEK' ? 0 : 6}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#9ca3af' }} 
                        />
                        <Tooltip content={<CustomTooltip unit={goal.unit} />} cursor={{ fill: 'transparent' }} />
                        <Bar 
                            dataKey="value" 
                            radius={[4, 4, 0, 0]}
                            onClick={(data, index) => setActiveIndex(index)}
                        >
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={goal.color} 
                                    opacity={activeIndex === index || activeIndex === null ? 1 : 0.6}
                                    cursor="pointer"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};