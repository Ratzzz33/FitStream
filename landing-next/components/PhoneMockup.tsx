"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface Goal {
  id: string;
  cur: number;
  max: number;
  color: string;
  label: string;
}

interface PhoneMockupProps {
  theme?: "light" | "dark";
}

export function PhoneMockup({ theme: initialTheme = "dark" }: PhoneMockupProps) {
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  const [tab, setTab] = useState<"dashboard" | "nutrition" | "workout" | "social" | "settings">("dashboard");
  const [goals, setGoals] = useState<Goal[]>([
    { id: "steps", cur: 6500, max: 10000, color: "#3b82f6", label: "Steps" },
    { id: "pushups", cur: 25, max: 50, color: "#8b5cf6", label: "Push-ups" },
    { id: "squats", cur: 35, max: 50, color: "#10b981", label: "Squats" },
    { id: "situps", cur: 15, max: 30, color: "#f97316", label: "Sit-ups" },
  ]);
  const [water, setWater] = useState(5);
  const [streak] = useState(7);
  const [cals] = useState(1850);

  const dk = theme === "dark";

  const addProgress = (id: string) => {
    setGoals(prev => prev.map(g =>
      g.id === id
        ? { ...g, cur: Math.min(g.cur + (id === "steps" ? 500 : 5), g.max) }
        : g
    ));
  };

  const leaders = [
    { name: "Alex", score: 2450 },
    { name: "Maria", score: 2100 },
    { name: "John", score: 1800 },
  ];

  const tabs = [
    { id: "dashboard", icon: "📊", label: "Home" },
    { id: "nutrition", icon: "🍎", label: "Food" },
    { id: "workout", icon: "💪", label: "Workout" },
    { id: "social", icon: "👥", label: "Social" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ] as const;

  return (
    <div
      className={`relative rounded-[2rem] overflow-hidden shadow-2xl transition-colors duration-300 ${
        dk ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
      }`}
      style={{ width: 280, height: 560 }}
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />

      {/* Content */}
      <div className="p-4 pt-8 h-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              FitStream
            </p>
            <p className={`text-[10px] ${dk ? "text-slate-500" : "text-slate-400"}`}>
              AI Fitness Tracking
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-orange-500 font-bold">Streak</p>
            <p className="text-sm font-bold">{streak} 🔥</p>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-[360px] overflow-y-auto"
          >
            {tab === "dashboard" && (
              <DashboardTab
                dk={dk}
                goals={goals}
                onAddProgress={addProgress}
              />
            )}
            {tab === "nutrition" && (
              <NutritionTab dk={dk} water={water} cals={cals} onWaterAdd={() => setWater(w => Math.min(w + 1, 8))} />
            )}
            {tab === "workout" && (
              <WorkoutTab dk={dk} />
            )}
            {tab === "social" && (
              <SocialTab dk={dk} leaders={leaders} />
            )}
            {tab === "settings" && (
              <SettingsTab dk={dk} theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className={`absolute bottom-2 left-2 right-2 ${dk ? "bg-slate-900/95" : "bg-white/95"} backdrop-blur rounded-2xl p-2 flex justify-between`}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center flex-1 py-1 transition-colors ${
              tab === t.id
                ? "text-blue-500"
                : dk ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[8px] mt-0.5">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Progress Ring Component
function ProgressRing({ goal, size = 44, onClick }: { goal: Goal; size?: number; onClick?: () => void }) {
  const progress = Math.min(goal.cur / goal.max, 1);
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      className="cursor-pointer hover:scale-105 transition-transform"
      onClick={onClick}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={18}
        fill="none"
        stroke="currentColor"
        strokeWidth={5}
        className="text-slate-700"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={18}
        fill="none"
        stroke={goal.color}
        strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dy="0.35em"
        className="text-[10px] font-bold fill-current"
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

// Dashboard Tab
function DashboardTab({ dk, goals, onAddProgress }: { dk: boolean; goals: Goal[]; onAddProgress: (id: string) => void }) {
  return (
    <>
      {/* Motivation Card */}
      <div className={`p-3 rounded-xl mb-3 ${
        dk
          ? "bg-gradient-to-r from-indigo-900/50 to-slate-900 border border-indigo-500/20"
          : "bg-gradient-to-r from-indigo-100 to-white border border-indigo-200"
      }`}>
        <p className={`text-[11px] italic ${dk ? "text-indigo-200" : "text-indigo-700"}`}>
          "Every rep counts. Keep pushing!" 💪
        </p>
      </div>

      {/* Goals Grid */}
      <p className={`text-[11px] font-bold mb-2 ${dk ? "text-slate-300" : "text-slate-600"}`}>
        Daily Goals
      </p>
      <div className="grid grid-cols-2 gap-2">
        {goals.map(g => (
          <motion.div
            key={g.id}
            whileTap={{ scale: 0.95 }}
            className={`rounded-xl p-3 text-center border ${
              dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
            }`}
            onClick={() => onAddProgress(g.id)}
          >
            <ProgressRing goal={g} size={48} />
            <p className={`text-[10px] mt-1 ${dk ? "text-slate-400" : "text-slate-500"}`}>
              {g.label}
            </p>
            <p className={`text-[9px] ${dk ? "text-slate-500" : "text-slate-400"}`}>
              {g.cur.toLocaleString()} / {g.max.toLocaleString()}
            </p>
          </motion.div>
        ))}
      </div>
      <p className={`text-center text-[9px] mt-2 ${dk ? "text-slate-600" : "text-slate-400"}`}>
        Tap rings to add progress!
      </p>
    </>
  );
}

// Nutrition Tab
function NutritionTab({ dk, water, cals, onWaterAdd }: { dk: boolean; water: number; cals: number; onWaterAdd: () => void }) {
  return (
    <>
      <p className={`text-[11px] font-bold mb-2 ${dk ? "text-slate-300" : "text-slate-600"}`}>
        Water Intake
      </p>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`rounded-xl p-3 mb-3 border cursor-pointer ${
          dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
        }`}
        onClick={onWaterAdd}
      >
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`w-4 h-6 rounded-full ${
                i <= water ? "bg-blue-500" : dk ? "bg-slate-700" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <p className={`text-[10px] text-right mt-2 ${dk ? "text-slate-400" : "text-slate-500"}`}>
          {water} / 8 glasses 💧
        </p>
      </motion.div>

      <p className={`text-[11px] font-bold mb-2 ${dk ? "text-slate-300" : "text-slate-600"}`}>
        Calories Today
      </p>
      <div className={`rounded-xl p-3 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <p className="text-2xl font-bold text-orange-500">
          {cals} <span className="text-[11px] font-normal">kcal</span>
        </p>
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <div className="h-1 bg-blue-500 rounded-full w-3/4" />
            <p className={`text-[9px] mt-1 ${dk ? "text-slate-500" : "text-slate-400"}`}>Protein 45g</p>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-orange-500 rounded-full w-1/2" />
            <p className={`text-[9px] mt-1 ${dk ? "text-slate-500" : "text-slate-400"}`}>Carbs 120g</p>
          </div>
          <div className="flex-1">
            <div className="h-1 bg-purple-500 rounded-full w-2/3" />
            <p className={`text-[9px] mt-1 ${dk ? "text-slate-500" : "text-slate-400"}`}>Fat 35g</p>
          </div>
        </div>
      </div>
    </>
  );
}

// Workout Tab
function WorkoutTab({ dk }: { dk: boolean }) {
  return (
    <>
      <p className={`text-[11px] font-bold mb-2 ${dk ? "text-slate-300" : "text-slate-600"}`}>
        Quick Workout
      </p>
      <div className={`rounded-xl p-3 mb-2 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
            💪
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold">Push-up Challenge</p>
            <p className={`text-[9px] ${dk ? "text-slate-500" : "text-slate-400"}`}>50 reps · AI tracking</p>
          </div>
          <div className="text-blue-500 text-xl">▶</div>
        </div>
      </div>
      <div className={`rounded-xl p-3 mb-2 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">
            🏃
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold">Squat Series</p>
            <p className={`text-[9px] ${dk ? "text-slate-500" : "text-slate-400"}`}>30 reps · Form check</p>
          </div>
          <div className="text-blue-500 text-xl">▶</div>
        </div>
      </div>
      <div className={`rounded-xl p-3 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
            🔥
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold">HIIT Burpees</p>
            <p className={`text-[9px] ${dk ? "text-slate-500" : "text-slate-400"}`}>20 reps · High intensity</p>
          </div>
          <div className="text-blue-500 text-xl">▶</div>
        </div>
      </div>
    </>
  );
}

// Social Tab
function SocialTab({ dk, leaders }: { dk: boolean; leaders: { name: string; score: number }[] }) {
  return (
    <>
      <p className={`text-[11px] font-bold mb-2 ${dk ? "text-slate-300" : "text-slate-600"}`}>
        Leaderboard
      </p>

      {/* You */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`rounded-xl p-3 mb-2 border-2 ${
          dk ? "bg-blue-900/30 border-blue-500/30" : "bg-blue-50 border-blue-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-500 text-[10px] font-bold">YOU</span>
          <span>👤</span>
          <span className="flex-1 text-[11px] font-bold">You</span>
          <span className="text-[11px] font-bold">2,200</span>
        </div>
      </motion.div>

      {/* Others */}
      {leaders.map((u, i) => (
        <motion.div
          key={u.name}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: (i + 1) * 0.1 }}
          className={`rounded-xl p-3 mb-2 border ${
            dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-[10px] ${dk ? "text-slate-500" : "text-slate-400"}`}>#{i + 1}</span>
            <span>🏃</span>
            <span className="flex-1 text-[11px]">{u.name}</span>
            <span className="text-[11px] font-bold">{u.score.toLocaleString()}</span>
          </div>
        </motion.div>
      ))}
    </>
  );
}

// Settings Tab
function SettingsTab({ dk, theme, onToggleTheme }: { dk: boolean; theme: string; onToggleTheme: () => void }) {
  return (
    <>
      <p className={`text-[11px] font-bold mb-2 ${dk ? "text-slate-300" : "text-slate-600"}`}>
        Settings
      </p>

      <div className={`rounded-xl p-3 mb-2 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex justify-between items-center">
          <span className="text-[11px]">Theme</span>
          <button
            onClick={onToggleTheme}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
              dk ? "bg-purple-600 hover:bg-purple-500" : "bg-orange-100 text-orange-600 hover:bg-orange-200"
            }`}
          >
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      <div className={`rounded-xl p-3 mb-2 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <p className="text-[11px] mb-2">Language</p>
        <div className="flex flex-wrap gap-1">
          {["🇺🇸", "🇷🇺", "🇪🇸", "🇫🇷", "🇩🇪", "🇨🇳"].map((flag, i) => (
            <button
              key={flag}
              className={`w-8 h-8 rounded-lg text-sm ${
                i === 0
                  ? "bg-blue-600"
                  : dk ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-200 hover:bg-slate-300"
              }`}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-xl p-3 border ${dk ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px]">Notifications</span>
          <div className="w-10 h-5 bg-blue-500 rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px]">Voice Coach</span>
          <div className={`w-10 h-5 ${dk ? "bg-slate-700" : "bg-slate-300"} rounded-full relative`}>
            <div className={`absolute left-0.5 top-0.5 w-4 h-4 ${dk ? "bg-slate-500" : "bg-white"} rounded-full`} />
          </div>
        </div>
      </div>
    </>
  );
}
