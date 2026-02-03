import { useState } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme, SettingsPanel, t } from '@fitstream/shared';
import { Dumbbell, Play, BarChart3, Settings, Trophy } from 'lucide-react';

function AICoachApp() {
  const { settings } = useAuth();
  const { theme } = useTheme();
  const [view, setView] = useState<'workout' | 'history' | 'settings'>('workout');

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Dumbbell className="text-purple-400" size={24} />
          AI Coach
        </h1>
        <p className="text-sm text-gray-400 mt-1">Pose Detection Personal Trainer</p>
      </header>

      <main className="px-4 pb-24">
        {view === 'workout' && (
          <div className="space-y-4">
            <button className="w-full p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-2 border-dashed border-purple-500/30 flex flex-col items-center gap-3">
              <Play size={48} className="text-purple-400" />
              <span className="text-lg font-medium">{t('startWorkout') || 'Start Workout'}</span>
              <span className="text-sm text-gray-400">AI tracks your form with camera</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <Trophy size={24} className="text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">{settings.streak || 0}</div>
                <div className="text-xs text-gray-400">{t('streak') || 'Day Streak'}</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 text-center">
                <Dumbbell size={24} className="text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-gray-400">This Week</div>
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 size={20} />
              Workout History
            </h2>
            <p className="text-gray-400">No workouts yet. Start training!</p>
          </div>
        )}

        {view === 'settings' && <SettingsPanel appName="AI Coach" />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-white/10 px-6 py-3 flex justify-around">
        <button onClick={() => setView('workout')} className={`flex flex-col items-center gap-1 ${view === 'workout' ? 'text-purple-400' : 'text-gray-500'}`}>
          <Dumbbell size={20} />
          <span className="text-xs">Workout</span>
        </button>
        <button onClick={() => setView('history')} className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-purple-400' : 'text-gray-500'}`}>
          <BarChart3 size={20} />
          <span className="text-xs">History</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-purple-400' : 'text-gray-500'}`}>
          <Settings size={20} />
          <span className="text-xs">Settings</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider initialTheme="dark">
        <AICoachApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
