import React from 'react';

interface RingProps {
  radius: number;
  stroke: number;
  progress: number;
  color: string;
  total: number;
  label?: string;
}

export const AchievementRing: React.FC<RingProps> = ({ radius, stroke, progress, color, total, label }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Cap progress for the visual ring (so it doesn't loop weirdly) but keep actual number
  const visualProgress = Math.min(progress, total);
  const strokeDashoffset = circumference - (visualProgress / total) * circumference;

  const isCompleted = total > 0 && progress >= total;

  return (
    <div className={`flex flex-col items-center justify-center relative transition-transform duration-500 ease-out ${isCompleted ? 'scale-105' : ''}`}>
      <svg
        height={radius * 2}
        width={radius * 2}
        className="rotate-[-90deg] transition-all duration-500"
        style={{ 
            filter: isCompleted ? `drop-shadow(0 0 8px ${color})` : 'none'
        }}
      >
        <circle
          stroke={color}
          strokeWidth={stroke}
          strokeOpacity="0.2"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-in-out' }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      {label && (
        <div className="absolute flex flex-col items-center justify-center text-center">
             {isCompleted && (
                 <div className="absolute -top-8 animate-bounce">
                     <span className="text-xl">⭐</span>
                 </div>
             )}
             <span className={`text-xl font-bold transition-colors duration-300 ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                {progress}
             </span>
             <span className="text-xs text-gray-400">/ {total}</span>
             <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1">{label}</span>
        </div>
      )}
    </div>
  );
};