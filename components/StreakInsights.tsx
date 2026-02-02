// components/StreakInsights.tsx
// Streak counter + AI daily tip for dashboard

import React, { useMemo } from 'react';
import { Flame, Lightbulb, TrendingUp, Droplets, Footprints, Utensils, Dumbbell, Moon, Target } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UserSettings, NutritionLog } from '../types';

interface StreakInsightsProps {
  settings: UserSettings;
}

// Tips based on context
const getTip = (
  hour: number,
  caloriesRemaining: number,
  caloriesTarget: number,
  waterPercent: number,
  stepsPercent: number,
  streak: number
): { icon: React.ReactNode; text: string; action?: string } => {
  const caloriesPercent = ((caloriesTarget - caloriesRemaining) / caloriesTarget) * 100;

  // Morning tips (6-11)
  if (hour >= 6 && hour < 11) {
    if (waterPercent < 20) {
      return {
        icon: <Droplets className="w-4 h-4 text-blue-400" />,
        text: 'Начни день со стакана воды — это запустит метаболизм',
        action: '+250мл'
      };
    }
    if (caloriesPercent < 15) {
      return {
        icon: <Utensils className="w-4 h-4 text-orange-400" />,
        text: 'Не пропускай завтрак — он даёт энергию на весь день'
      };
    }
    return {
      icon: <TrendingUp className="w-4 h-4 text-green-400" />,
      text: 'Отличное утро! Поставь цели на день'
    };
  }

  // Midday tips (11-14)
  if (hour >= 11 && hour < 14) {
    if (stepsPercent < 30) {
      return {
        icon: <Footprints className="w-4 h-4 text-purple-400" />,
        text: 'Прогуляйся 10 минут после обеда — это улучшит пищеварение'
      };
    }
    if (caloriesPercent > 60) {
      return {
        icon: <Utensils className="w-4 h-4 text-amber-400" />,
        text: 'Уже съел больше половины калорий — выбери лёгкий ужин'
      };
    }
    return {
      icon: <Target className="w-4 h-4 text-blue-400" />,
      text: 'Середина дня — самое время для продуктивной тренировки'
    };
  }

  // Afternoon tips (14-18)
  if (hour >= 14 && hour < 18) {
    if (waterPercent < 50) {
      return {
        icon: <Droplets className="w-4 h-4 text-blue-400" />,
        text: 'Выпей воды — к вечеру нужно набрать норму',
        action: '+500мл'
      };
    }
    if (stepsPercent < 50) {
      return {
        icon: <Dumbbell className="w-4 h-4 text-indigo-400" />,
        text: 'До цели по шагам ещё далеко — успей потренироваться!'
      };
    }
    return {
      icon: <TrendingUp className="w-4 h-4 text-green-400" />,
      text: 'Отличный темп! Продолжай в том же духе'
    };
  }

  // Evening tips (18-22)
  if (hour >= 18 && hour < 22) {
    if (caloriesRemaining > caloriesTarget * 0.4) {
      return {
        icon: <Utensils className="w-4 h-4 text-orange-400" />,
        text: `Осталось ${caloriesRemaining} ккал — можно поужинать полноценно`
      };
    }
    if (caloriesRemaining < 200 && caloriesRemaining > 0) {
      return {
        icon: <Utensils className="w-4 h-4 text-green-400" />,
        text: 'Почти в норме! Лёгкий перекус — и идеально'
      };
    }
    if (stepsPercent >= 100) {
      return {
        icon: <Flame className="w-4 h-4 text-orange-400" />,
        text: 'Цель по шагам выполнена! Отличная работа 🎉'
      };
    }
    return {
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      text: 'Вечерняя прогулка поможет лучше спать'
    };
  }

  // Night tips (22-6)
  if (streak > 0) {
    return {
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      text: `${streak} ${getStreakWord(streak)} подряд! Хороший сон — залог прогресса`
    };
  }

  return {
    icon: <Moon className="w-4 h-4 text-indigo-400" />,
    text: 'Пора отдыхать — завтра новый день для достижений'
  };
};

// Calculate streak from activity logs
const calculateStreak = (): number => {
  const logs = StorageService.getExercises();
  const nutritionLogs = StorageService.getNutritionLogs();

  // Get unique dates with any activity
  const activityDates = new Set<string>();

  logs.forEach(log => {
    const date = new Date(log.timestamp).toDateString();
    activityDates.add(date);
  });

  nutritionLogs.forEach(log => {
    const date = new Date(log.timestamp).toDateString();
    activityDates.add(date);
  });

  // Count consecutive days ending today or yesterday
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  // Check if today has activity, if not start from yesterday
  if (!activityDates.has(today.toDateString())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days
  while (activityDates.has(checkDate.toDateString())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    if (streak > 365) break; // Safety limit
  }

  return streak;
};

// Russian word forms for streak
function getStreakWord(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'дней';
  }
  if (lastDigit === 1) {
    return 'день';
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return 'дня';
  }
  return 'дней';
}

export const StreakInsights: React.FC<StreakInsightsProps> = ({ settings }) => {
  const isDark = settings.theme === 'dark';
  const streak = useMemo(() => calculateStreak(), []);
  const hour = new Date().getHours();

  // Get today's data
  const today = new Date().toISOString().split('T')[0];
  const nutrition = StorageService.getNutritionLogs();
  const todayNutrition = nutrition.filter((n: NutritionLog) => n.date === today);

  // Calculate calories
  const caloriesConsumed = todayNutrition
    .filter((n: NutritionLog) => n.type !== 'WATER')
    .reduce((sum: number, n: NutritionLog) => sum + (n.calories || 0), 0);
  const caloriesGoal = settings.goals.find(g => g.type === 'CALORIES');
  const caloriesTarget = caloriesGoal?.target || 2000;

  // Calculate water
  const waterConsumed = todayNutrition
    .filter((n: NutritionLog) => n.type === 'WATER')
    .reduce((sum: number, n: NutritionLog) => sum + (n.amount || 0), 0);
  const waterGoal = settings.goals.find(g => g.type === 'WATER');
  const waterTarget = waterGoal?.target || 2000;

  // Calculate steps
  const stepsGoal = settings.goals.find(g => g.type === 'STEPS');
  const stepsToday = stepsGoal?.current || 0;
  const stepsTarget = stepsGoal?.target || 10000;

  const caloriesRemaining = Math.max(0, caloriesTarget - caloriesConsumed);
  const waterPercent = waterTarget > 0 ? (waterConsumed / waterTarget) * 100 : 0;
  const stepsPercent = stepsTarget > 0 ? (stepsToday / stepsTarget) * 100 : 0;

  const tip = useMemo(
    () => getTip(hour, caloriesRemaining, caloriesTarget, waterPercent, stepsPercent, streak),
    [hour, caloriesRemaining, caloriesTarget, waterPercent, stepsPercent, streak]
  );

  return (
    <div className={`rounded-2xl p-4 ${
      isDark
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50'
        : 'bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200'
    }`}>
      {/* Streak Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${
            streak > 0
              ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white'
              : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
          }`}>
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {streak}
              </span>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {getStreakWord(streak)} подряд
              </span>
            </div>
          </div>
        </div>

        {/* Streak fire visualization */}
        {streak > 0 && (
          <div className="flex gap-0.5">
            {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-${3 + Math.min(i, 3)} rounded-full bg-gradient-to-t from-orange-500 to-yellow-400`}
                style={{ height: `${12 + i * 3}px` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tip Row */}
      <div className={`flex items-start gap-3 p-3 rounded-xl ${
        isDark ? 'bg-slate-700/50' : 'bg-white/70'
      }`}>
        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-600' : 'bg-slate-100'}`}>
          <Lightbulb className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
            {tip.text}
          </p>
        </div>
        {tip.icon && (
          <div className={`shrink-0 p-1.5 rounded-lg ${isDark ? 'bg-slate-600' : 'bg-slate-100'}`}>
            {tip.icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakInsights;
