import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts';
import { WeightLog, BodyComposition } from '../types';
import { t } from '../services/i18n';
import { StorageService } from '../services/storageService';
import {
  Activity,
  Droplets,
  Zap,
  Bone,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BodyCompositionChartsProps {
  weights: WeightLog[];
  isPro?: boolean;
}

type MetricKey = 'weight' | 'bodyFat' | 'muscleMass' | 'waterPercent' | 'bmi';

interface MetricConfig {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
  icon: React.ReactNode;
  domain?: [number | string, number | string];
  goodDirection: 'up' | 'down' | 'stable';
}

const METRICS: MetricConfig[] = [
  {
    key: 'weight',
    label: 'Weight',
    color: '#10b981',
    unit: 'kg',
    icon: <Activity size={14} />,
    goodDirection: 'down',
  },
  {
    key: 'bodyFat',
    label: 'Body Fat',
    color: '#f97316',
    unit: '%',
    icon: <Activity size={14} />,
    domain: [0, 50],
    goodDirection: 'down',
  },
  {
    key: 'muscleMass',
    label: 'Muscle',
    color: '#3b82f6',
    unit: 'kg',
    icon: <Zap size={14} />,
    goodDirection: 'up',
  },
  {
    key: 'waterPercent',
    label: 'Water',
    color: '#06b6d4',
    unit: '%',
    icon: <Droplets size={14} />,
    domain: [40, 70],
    goodDirection: 'up',
  },
  {
    key: 'bmi',
    label: 'BMI',
    color: '#8b5cf6',
    unit: '',
    icon: <TrendingUp size={14} />,
    domain: [15, 40],
    goodDirection: 'stable',
  },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  selectedMetrics: MetricKey[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, selectedMetrics }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl text-sm min-w-[180px] z-50">
        <p className="font-bold text-gray-900 dark:text-white mb-2 text-xs border-b border-gray-100 dark:border-gray-700 pb-2">
          {formattedDate}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => {
            const metric = METRICS.find((m) => m.key === entry.dataKey);
            if (!metric || entry.value === undefined || entry.value === null) return null;

            return (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  <span className="text-gray-500 dark:text-gray-400 text-xs">{metric.label}</span>
                </div>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                  <span className="text-[10px] text-gray-400 ml-0.5">{metric.unit}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const BodyCompositionCharts: React.FC<BodyCompositionChartsProps> = ({
  weights,
  isPro,
}) => {
  const settings = StorageService.getSettings();
  const isDark = settings.theme === 'dark';

  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['weight', 'bodyFat']);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [showDetails, setShowDetails] = useState(false);

  const toggleMetric = (key: MetricKey) => {
    setSelectedMetrics((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), key];
      }
      return [...prev, key];
    });
  };

  const processedData = useMemo(() => {
    // Filter weights with body composition data
    const weightsWithBC = weights.filter(
      (w) => w.bodyComposition || w.source === 'smart_scale'
    );

    // Apply time range filter
    const now = new Date();
    let cutoffDate = new Date(0);

    if (timeRange === 'week') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (timeRange === 'month') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const filtered = weightsWithBC.filter((w) => new Date(w.date) >= cutoffDate);

    // Group by date, take latest reading per day
    const byDate = new Map<string, WeightLog>();
    filtered.forEach((w) => {
      const existing = byDate.get(w.date);
      if (!existing || w.timestamp > existing.timestamp) {
        byDate.set(w.date, w);
      }
    });

    // Convert to chart data
    return Array.from(byDate.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((w) => ({
        date: w.date,
        weight: w.weight,
        bodyFat: w.bodyComposition?.bodyFat,
        muscleMass: w.bodyComposition?.muscleMass,
        waterPercent: w.bodyComposition?.waterPercent,
        bmi: w.bodyComposition?.bmi,
        boneMass: w.bodyComposition?.boneMass,
        visceralFat: w.bodyComposition?.visceralFat,
        bmr: w.bodyComposition?.bmr,
        metabolicAge: w.bodyComposition?.metabolicAge,
      }));
  }, [weights, timeRange]);

  // Calculate trends
  const trends = useMemo(() => {
    if (processedData.length < 2) return null;

    const first = processedData[0];
    const last = processedData[processedData.length - 1];

    return {
      weight: last.weight && first.weight ? last.weight - first.weight : null,
      bodyFat: last.bodyFat && first.bodyFat ? last.bodyFat - first.bodyFat : null,
      muscleMass:
        last.muscleMass && first.muscleMass ? last.muscleMass - first.muscleMass : null,
      waterPercent:
        last.waterPercent && first.waterPercent
          ? last.waterPercent - first.waterPercent
          : null,
      bmi: last.bmi && first.bmi ? last.bmi - first.bmi : null,
    };
  }, [processedData]);

  const latestReading = processedData[processedData.length - 1];

  const colors = {
    grid: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#9ca3af' : '#6b7280',
  };

  const getTrendIcon = (value: number | null, goodDirection: 'up' | 'down' | 'stable') => {
    if (value === null) return <Minus size={12} className="text-gray-400" />;

    const isPositive = value > 0.1;
    const isNegative = value < -0.1;

    if (goodDirection === 'up') {
      if (isPositive) return <TrendingUp size={12} className="text-green-500" />;
      if (isNegative) return <TrendingDown size={12} className="text-red-500" />;
    } else if (goodDirection === 'down') {
      if (isNegative) return <TrendingUp size={12} className="text-green-500" />;
      if (isPositive) return <TrendingDown size={12} className="text-red-500" />;
    }

    return <Minus size={12} className="text-gray-400" />;
  };

  if (processedData.length === 0) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'} shadow-lg`}>
        <div className="text-center py-8">
          <Activity size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('noBodyCompositionData') || 'No Body Composition Data'}
          </h3>
          <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
            {t('connectScaleToSeeData') ||
              'Connect your smart scale to see body composition trends.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {latestReading && (
        <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'} shadow-lg`}>
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('latestMeasurement') || 'Latest Measurement'}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                {new Date(latestReading.date).toLocaleDateString()}
              </span>
              {showDetails ? (
                <ChevronUp size={16} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
              ) : (
                <ChevronDown size={16} className={isDark ? 'text-zinc-400' : 'text-gray-500'} />
              )}
            </div>
          </div>

          {showDetails && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {latestReading.weight && (
                <div
                  className={`p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}
                  style={{ borderLeft: '3px solid #10b981' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity size={12} className="text-emerald-500" />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('weight')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {latestReading.weight.toFixed(1)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      kg
                    </span>
                    {trends?.weight !== null && (
                      <span className="ml-auto flex items-center">
                        {getTrendIcon(trends.weight, 'down')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {latestReading.bodyFat && (
                <div
                  className={`p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}
                  style={{ borderLeft: '3px solid #f97316' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity size={12} className="text-orange-500" />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('bodyFat')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {latestReading.bodyFat.toFixed(1)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>%</span>
                    {trends?.bodyFat !== null && (
                      <span className="ml-auto flex items-center">
                        {getTrendIcon(trends.bodyFat, 'down')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {latestReading.muscleMass && (
                <div
                  className={`p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}
                  style={{ borderLeft: '3px solid #3b82f6' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap size={12} className="text-blue-500" />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('muscleMass')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {latestReading.muscleMass.toFixed(1)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      kg
                    </span>
                    {trends?.muscleMass !== null && (
                      <span className="ml-auto flex items-center">
                        {getTrendIcon(trends.muscleMass, 'up')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {latestReading.waterPercent && (
                <div
                  className={`p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}
                  style={{ borderLeft: '3px solid #06b6d4' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Droplets size={12} className="text-cyan-500" />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      {t('waterPercent')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {latestReading.waterPercent.toFixed(1)}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>%</span>
                    {trends?.waterPercent !== null && (
                      <span className="ml-auto flex items-center">
                        {getTrendIcon(trends.waterPercent, 'up')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {latestReading.bmi && (
                <div
                  className={`p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}
                  style={{ borderLeft: '3px solid #8b5cf6' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={12} className="text-violet-500" />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      BMI
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {latestReading.bmi.toFixed(1)}
                    </span>
                    {trends?.bmi !== null && (
                      <span className="ml-auto flex items-center">
                        {getTrendIcon(trends.bmi, 'stable')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {latestReading.bmr && (
                <div
                  className={`p-3 rounded-xl ${isDark ? 'bg-zinc-700/50' : 'bg-gray-50'}`}
                  style={{ borderLeft: '3px solid #ef4444' }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Activity size={12} className="text-red-500" />
                    <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                      BMR
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {latestReading.bmr}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      kcal
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      <div className={`p-4 rounded-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'} shadow-lg`}>
        {/* Time Range Selector */}
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('trends') || 'Trends'}
          </h3>
          <div className="flex gap-1">
            {(['week', 'month', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 text-xs rounded-lg transition ${
                  timeRange === range
                    ? 'bg-blue-500 text-white'
                    : isDark
                    ? 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {range === 'week'
                  ? t('week')
                  : range === 'month'
                  ? t('month')
                  : t('total') || 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {METRICS.map((metric) => (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedMetrics.includes(metric.key)
                  ? 'text-white'
                  : isDark
                  ? 'bg-zinc-700/50 text-zinc-400'
                  : 'bg-gray-100 text-gray-500'
              }`}
              style={
                selectedMetrics.includes(metric.key)
                  ? { backgroundColor: metric.color }
                  : undefined
              }
            >
              {metric.icon}
              {metric.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis
                dataKey="date"
                stroke={colors.text}
                fontSize={10}
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }}
              />
              <YAxis stroke={colors.text} fontSize={10} />
              <Tooltip content={<CustomTooltip selectedMetrics={selectedMetrics} />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px' }}
              />

              {selectedMetrics.map((metricKey) => {
                const metric = METRICS.find((m) => m.key === metricKey);
                if (!metric) return null;

                return (
                  <Line
                    key={metric.key}
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={{ fill: metric.color, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    name={metric.label}
                    connectNulls
                  />
                );
              })}

              {/* BMI reference lines */}
              {selectedMetrics.includes('bmi') && (
                <>
                  <ReferenceLine
                    y={18.5}
                    stroke="#fbbf24"
                    strokeDasharray="3 3"
                    label={{
                      position: 'right',
                      value: 'Underweight',
                      fill: '#fbbf24',
                      fontSize: 9,
                    }}
                  />
                  <ReferenceLine
                    y={25}
                    stroke="#fbbf24"
                    strokeDasharray="3 3"
                    label={{
                      position: 'right',
                      value: 'Overweight',
                      fill: '#fbbf24',
                      fontSize: 9,
                    }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
