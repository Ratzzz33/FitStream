import React, { useState, useEffect } from 'react';
import { Wallet, TrendingDown, TrendingUp, ShoppingCart, UtensilsCrossed, Truck, Leaf, Trophy, Flame, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { t } from '../../services/i18n';
import { formatCurrency, CurrencyCode } from '../../services/currencyService';

interface MonthlyStats {
    groceries: number;
    restaurants: number;
    delivery: number;
    total: number;
    savedFromCooking: number;
    mealsCooked: number;
}

interface FinanceData {
    currentMonth: MonthlyStats;
    previousMonth: MonthlyStats;
    allTimeSaved: number;
}

export const FoodFinance: React.FC = () => {
    const [data, setData] = useState<FinanceData>({
        currentMonth: { groceries: 0, restaurants: 0, delivery: 0, total: 0, savedFromCooking: 0, mealsCooked: 0 },
        previousMonth: { groceries: 0, restaurants: 0, delivery: 0, total: 0, savedFromCooking: 0, mealsCooked: 0 },
        allTimeSaved: 0
    });
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    const settings = StorageService.getSettings();
    const currency = (settings.currency || 'RUB') as CurrencyCode;

    useEffect(() => {
        // Load finance data from storage
        loadFinanceData();
    }, [selectedMonth]);

    const loadFinanceData = () => {
        // TODO: Load real data from storage
        // For now, use mock data matching PRD example
        setData({
            currentMonth: {
                groceries: 12200,
                restaurants: 4800,
                delivery: 1450,
                total: 18450,
                savedFromCooking: 8900,
                mealsCooked: 23
            },
            previousMonth: {
                groceries: 14500,
                restaurants: 5200,
                delivery: 1050,
                total: 20750,
                savedFromCooking: 6200,
                mealsCooked: 18
            },
            allTimeSaved: 45600
        });
    };

    const monthDiff = data.currentMonth.total - data.previousMonth.total;
    const monthDiffPercent = data.previousMonth.total > 0
        ? Math.round((monthDiff / data.previousMonth.total) * 100)
        : 0;

    const format = (amount: number) => formatCurrency(amount, currency);

    const getMonthName = () => {
        const date = new Date(selectedMonth + '-01');
        return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    };

    // Calculate percentages for breakdown
    const getPercent = (value: number) => {
        if (data.currentMonth.total === 0) return 0;
        return Math.round((value / data.currentMonth.total) * 100);
    };

    return (
        <div className="p-4 space-y-4 pb-24">
            {/* Header with month selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Wallet className="text-purple-500" size={24} />
                    {t('foodExpenses') || 'Траты на еду'}
                </h2>
                <button className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                    <Calendar size={14} />
                    <span>{getMonthName()}</span>
                </button>
            </div>

            {/* Total Spent Card - PRD Section */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
                <p className="text-purple-100 text-sm mb-1">{t('totalSpentMonth') || 'Всего потрачено в этом месяце'}</p>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold">{format(data.currentMonth.total)}</span>
                    <div className={`flex items-center gap-1 text-sm ${monthDiff <= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {monthDiff <= 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                        <span>{monthDiff <= 0 ? '' : '+'}{format(monthDiff)} ({monthDiffPercent}%)</span>
                    </div>
                </div>
                <p className="text-purple-200 text-xs mt-1">{t('vsLastMonth') || 'по сравнению с прошлым месяцем'}</p>
            </div>

            {/* Breakdown - PRD Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('breakdown') || 'Детализация'}</h3>
                <div className="space-y-3">
                    {/* Groceries */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <ShoppingCart size={20} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('groceries') || 'Продукты в магазинах'}</p>
                                <p className="text-xs text-gray-500">{getPercent(data.currentMonth.groceries)}%</p>
                            </div>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{format(data.currentMonth.groceries)}</span>
                    </div>

                    {/* Restaurants */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                <UtensilsCrossed size={20} className="text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('restaurants') || 'Рестораны/кафе'}</p>
                                <p className="text-xs text-gray-500">{getPercent(data.currentMonth.restaurants)}%</p>
                            </div>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{format(data.currentMonth.restaurants)}</span>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Truck size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">{t('delivery') || 'Доставка еды'}</p>
                                <p className="text-xs text-gray-500">{getPercent(data.currentMonth.delivery)}%</p>
                            </div>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{format(data.currentMonth.delivery)}</span>
                    </div>
                </div>
            </div>

            {/* Savings from Cooking - PRD Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                    <Leaf className="text-green-600 dark:text-green-400" size={20} />
                    <h3 className="font-bold text-green-800 dark:text-green-300">{t('savingsFromCooking') || 'Экономия от готовки дома'}</h3>
                </div>

                <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">+{format(data.currentMonth.savedFromCooking)}</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    {t('youCooked') || 'Вы приготовили'} <span className="font-bold">{data.currentMonth.mealsCooked}</span> {t('mealsAtHome') || 'блюд дома'}
                    <br />{t('insteadOfOrderingOrEatingOut') || 'вместо заказа/ресторана'}
                </p>

                {/* Progress to savings goal */}
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between text-xs text-green-700 dark:text-green-300 mb-1">
                        <span>{t('monthlyGoal') || 'Цель на месяц'}</span>
                        <span>{format(data.currentMonth.savedFromCooking)} / {format(10000)}</span>
                    </div>
                    <div className="h-2 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (data.currentMonth.savedFromCooking / 10000) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Monthly Forecast - PRD Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="text-blue-500" size={20} />
                    <h3 className="font-bold text-gray-900 dark:text-white">{t('monthlyForecast') || 'Прогноз на месяц'}</h3>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('willSpend') || 'Потратите'}:</span>
                        <span className="font-bold text-gray-900 dark:text-white">~{format(19000)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{t('willSave') || 'Сэкономите'}:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">~{format(9500)}</span>
                    </div>
                </div>

                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                            {t('savingsTip') || 'Если приготовить ещё 3 ужина дома, сэкономите дополнительно'} <span className="font-bold">{format(1200)}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Achievements - PRD Gamification Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="text-amber-500" size={20} />
                    <h3 className="font-bold text-gray-900 dark:text-white">{t('achievements') || 'Достижения'}</h3>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                        <span className="text-2xl">🎉</span>
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mt-1">{t('firstSaving') || 'Первая экономия'}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
                        <span className="text-2xl">💰</span>
                        <p className="text-xs font-medium text-green-800 dark:text-green-300 mt-1">{t('savingChef') || 'Экономный повар'}</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 text-center opacity-50">
                        <span className="text-2xl">🏆</span>
                        <p className="text-xs font-medium text-purple-800 dark:text-purple-300 mt-1">{t('savingMaster') || 'Мастер экономии'}</p>
                        <p className="text-[10px] text-gray-500">{format(10000 - data.allTimeSaved)} {t('toUnlock') || 'до открытия'}</p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 text-center opacity-50">
                        <span className="text-2xl">🔥</span>
                        <p className="text-xs font-medium text-orange-800 dark:text-orange-300 mt-1">{t('weekWithoutDelivery') || 'Неделя без доставки'}</p>
                        <p className="text-[10px] text-gray-500">4/7 {t('days') || 'дней'}</p>
                    </div>
                </div>
            </div>

            {/* All-time Stats */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('allTimeSaved') || 'Сэкономлено за всё время'}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{format(data.allTimeSaved)}</p>
            </div>
        </div>
    );
};

export default FoodFinance;
