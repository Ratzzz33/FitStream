
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Dumbbell, Weight, Users, Settings, Settings2, ChevronDown, ChevronUp, Footprints, Activity, ArrowDown, Move, Camera, Check, Loader2, Moon, Sun, Lock, Crown, Server, Globe, Wifi, WifiOff, RefreshCw, Terminal, AlertTriangle, CheckCircle2, XCircle, Utensils, Ruler } from 'lucide-react';
import { AppTab, UserSettings, DailyGoal, GoalType, WeightLog, Gender, ActivityLevel } from './types';
import { StorageService } from './services/storageService';
import { ApiService } from './services/api';
import { getMotivation } from './services/geminiService';
import { AchievementRing } from './components/AchievementRings';
import { WorkoutSession } from './components/WorkoutSession';
import { WeightTracker } from './components/WeightTracker';
import { NutritionTracker } from './components/NutritionTracker';
import { StatsCharts } from './components/Charts';
import { GoalSettings } from './components/GoalSettings';
import { AvatarSelector } from './components/AvatarSelector';
import { HealthConnect } from './components/HealthConnect';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { useStepCounter } from './hooks/useStepCounter';
import { t } from './services/i18n';

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [motivation, setMotivation] = useState("");
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Diagnostics State
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Local state for auto-save fields
  const [nameInput, setNameInput] = useState(settings.name);
  const [ageInput, setAgeInput] = useState(settings.age.toString());
  const [heightInput, setHeightInput] = useState(settings.height.toString());
  const [refObjectInput, setRefObjectInput] = useState(settings.referenceObject);
  const [targetWeightInput, setTargetWeightInput] = useState(settings.targetWeight.toString());
  const [currentWeightInput, setCurrentWeightInput] = useState<string>(StorageService.getLastWeight().toString());
  const [backendUrlInput, setBackendUrlInput] = useState(settings.backendUrl || '');

  // Saving states
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  
  // Background Step Counter
  const sessionSteps = useStepCounter();

  useEffect(() => {
    if (!process.env.API_KEY) {
        setApiKeyMissing(true);
    }
  }, []);

  // Function to check connection status (Quick Check)
  const checkServerConnection = async (customUrl?: string) => {
      setServerStatus('checking');
      const userId = StorageService.getUserId();
      const currentSettings = StorageService.getSettings();
      const urlToCheck = customUrl || currentSettings.backendUrl;
      
      try {
          // Try to sync with cache buster
          const result = await ApiService.syncUser(userId, currentSettings, urlToCheck);
          
          if (result) {
              setServerStatus('online');
              // Update local status based on server truth
              if (currentSettings.isPro !== result.isPro) {
                  currentSettings.isPro = result.isPro;
                  StorageService.saveSettings(currentSettings);
                  refreshData();
              }
          } else {
              setServerStatus('offline');
          }
      } catch (e) {
          setServerStatus('offline');
      }
  };

  // Detailed Diagnostics Tool
  const runDiagnostics = async () => {
      setIsDiagnosing(true);
      setShowDiagnostics(true);
      setDiagnosticLogs(["Starting diagnostics v4 (Manual CORS)...", "--------------------------------"]);
      
      const addLog = (msg: string) => setDiagnosticLogs(prev => [...prev, msg]);
      
      const userId = StorageService.getUserId();
      let url = backendUrlInput.trim();
      
      // 1. URL Format Check
      addLog(`[1] Checking URL format: ${url}`);
      if (!url) {
          addLog("❌ Error: URL is empty.");
          setIsDiagnosing(false);
          return;
      }
      if (!url.startsWith('http')) {
          addLog("⚠️ Warning: URL should start with http:// or https://");
      }
      
      // Normalize URL for checks
      // Remove trailing slash
      if (url.endsWith('/')) url = url.slice(0, -1);
      
      // Base URL (without /api if present, for root check)
      const baseUrl = url.endsWith('/api') ? url.slice(0, -4) : url;
      // API URL (ensure /api is present for sync check)
      const apiUrl = url.endsWith('/api') ? url : `${url}/api`;
      
      addLog(`ℹ️ Base Root: ${baseUrl}`);
      addLog(`ℹ️ API Endpoint: ${apiUrl}`);

      // 2. Network Check (Simple GET - No Preflight)
      addLog(`[2] Pinging Server (Simple Request)...`);
      const start = Date.now();
      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); 
          
          // No custom headers = No Preflight (Simple Request)
          const res = await fetch(`${baseUrl}?t=${Date.now()}`, { 
              method: 'GET', 
              signal: controller.signal,
              mode: 'cors'
          });
          clearTimeout(timeoutId);
          
          const latency = Date.now() - start;
          addLog(`${res.ok ? '✅' : '❌'} Status: ${res.status} ${res.statusText}`);
          addLog(`⏱️ Latency: ${latency}ms`);
          
          if (latency > 2000) addLog("⚠️ High latency (Cold Start?)");
          
          const text = await res.text();
          addLog(`📄 Response: "${text.substring(0, 50)}..."`);
          
      } catch (e: any) {
          addLog(`❌ Simple Connection Failed: ${e.name}: ${e.message}`);
          // Probe opaque
          try {
             await fetch(`${baseUrl}?t=${Date.now()}`, { method: 'GET', mode: 'no-cors' });
             addLog("⚠️ DIAGNOSIS: Server reachable via no-cors. Likely strict CORS blocking Simple Requests.");
          } catch(probeErr) {
             addLog("❌ DIAGNOSIS: Server Unreachable/Down.");
          }
      }

      // 3. API Route Check (Preflighted POST)
      addLog(`[3] Testing API Route (Preflighted)...`);
      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); 

          const res = await fetch(`${apiUrl}/user/sync`, {
              method: 'POST',
              // These headers trigger OPTIONS preflight
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, settings: { ...settings, diagnostic: true } }),
              signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (res.ok) {
              const json = await res.json();
              addLog(`✅ API Success! Is Pro: ${json.isPro}`);
              setServerStatus('online');
          } else {
              addLog(`❌ API Error: ${res.status}`);
          }
      } catch (e: any) {
          addLog(`❌ API Call Failed: ${e.message}`);
      }
      
      addLog("--------------------------------");
      addLog("Diagnostics Complete.");
      setIsDiagnosing(false);
  };

  // Sync with Backend on Load
  useEffect(() => {
      const sync = async () => {
          // Check if we just returned from Stripe
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('pro_status') === 'success') {
              window.history.replaceState({}, document.title, window.location.pathname);
              alert("Welcome to Pro! Your subscription is active.");
          }
          checkServerConnection();
      };
      sync();
  }, []);

  // Theme effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Fetch Motivation (Expensive AI call) - Only run on mount or significant events
  const fetchMotivation = useCallback(async () => {
    if (!process.env.API_KEY) {
        setMotivation(t('defaultMotivation'));
        return;
    }
    try {
        const s = StorageService.getSettings();
        const exercises = StorageService.getExercises();
        const today = new Date().toISOString().split('T')[0];
        const repsToday = exercises
            .filter(e => e.date === today)
            .reduce((sum, e) => sum + e.reps, 0);
        
        const quote = await getMotivation(s.streak, repsToday);
        setMotivation(quote);
    } catch (e) {
        setMotivation(t('defaultMotivation'));
    }
  }, []);

  // Refresh Data (Cheap local storage sync) - Runs often
  const refreshData = () => {
    const s = StorageService.getSettings();
    setSettings(s);
    // Only update inputs if they are not being edited (simple check: if active element isn't an input)
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        setNameInput(s.name);
        setAgeInput(s.age.toString());
        setHeightInput(s.height.toString());
        setRefObjectInput(s.referenceObject);
        setTargetWeightInput(s.targetWeight.toString());
        setCurrentWeightInput(StorageService.getLastWeight().toString() || '0');
        setBackendUrlInput(s.backendUrl || '');
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, showGoalSettings, isWorkoutActive, sessionSteps]); // Refresh on steps or workout end

  // Initial Motivation Load
  useEffect(() => {
     fetchMotivation();
  }, [fetchMotivation]);

  // Debounce logic for Settings
  useEffect(() => {
      const timer = setTimeout(() => {
          if (nameInput !== settings.name || 
              parseInt(ageInput) !== settings.age || 
              parseInt(heightInput) !== settings.height ||
              refObjectInput !== settings.referenceObject ||
              parseFloat(targetWeightInput) !== settings.targetWeight ||
              backendUrlInput !== (settings.backendUrl || '')) {
              
              setIsSavingSettings(true);
              const newSettings = { 
                  ...settings, 
                  name: nameInput,
                  age: parseInt(ageInput) || 0,
                  height: parseInt(heightInput) || 170,
                  referenceObject: refObjectInput,
                  targetWeight: parseFloat(targetWeightInput) || 0,
                  backendUrl: backendUrlInput
              };
              StorageService.saveSettings(newSettings);
              setSettings(newSettings);
              
              // Trigger a sync check if URL changed
              if (backendUrlInput !== settings.backendUrl) {
                  checkServerConnection(backendUrlInput);
              }
              
              // Fake delay for visual feedback
              setTimeout(() => setIsSavingSettings(false), 800);
          }
      }, 1500); // 1.5s debounce

      return () => clearTimeout(timer);
  }, [nameInput, ageInput, heightInput, refObjectInput, targetWeightInput, backendUrlInput, settings]);

  const updateGender = (g: Gender) => {
      const newSettings = { ...settings, gender: g };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
  };

  const updateActivity = (a: ActivityLevel) => {
      const newSettings = { ...settings, activityLevel: a };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
  };

  // Debounce logic for Current Weight (Logs to history)
  useEffect(() => {
      const timer = setTimeout(() => {
          const w = parseFloat(currentWeightInput);
          const lastStored = StorageService.getLastWeight();
          
          if (!isNaN(w) && w > 0 && w !== lastStored) {
              setIsSavingWeight(true);
              
              const log: WeightLog = {
                  id: Date.now().toString(),
                  date: new Date().toISOString().split('T')[0],
                  timestamp: Date.now(),
                  weight: w
              };
              StorageService.saveWeight(log);
              
              setTimeout(() => setIsSavingWeight(false), 800);
          }
      }, 1500);

      return () => clearTimeout(timer);
  }, [currentWeightInput]);


  const updateAvatar = (newAvatar: string) => {
      const newSettings = { ...settings, avatar: newAvatar };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
  };

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' = settings.theme === 'dark' ? 'light' : 'dark';
    const newSettings: UserSettings = { ...settings, theme: newTheme };
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const attemptStartWorkout = () => {
      if (settings.isPro) {
          setIsWorkoutActive(true);
          return;
      }

      const weeklyWorkouts = StorageService.getWeeklyWorkoutCount();
      const LIMIT = 3;

      if (weeklyWorkouts >= LIMIT) {
          setShowProModal(true);
      } else {
          setIsWorkoutActive(true);
      }
  };

  const handleMockUpgrade = () => {
      const newSettings = { ...settings, isPro: true };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
      setShowProModal(false);
  };

  const getIconForType = (type: GoalType) => {
      switch(type) {
          case 'STEPS': return <Footprints size={16} className="text-emerald-500"/>;
          case 'SQUATS': return <ArrowDown size={16} className="text-purple-500"/>;
          case 'PUSHUPS': return <Activity size={16} className="text-blue-500"/>;
          case 'SITUPS': return <Move size={16} className="text-orange-500"/>;
          default: return <Dumbbell size={16} className="text-gray-400"/>;
      }
  };

  const getLabelForType = (type: GoalType): string => {
    switch(type) {
        case 'STEPS': return t('steps');
        case 'PUSHUPS': return t('pushups');
        case 'SQUATS': return t('squats');
        case 'SITUPS': return t('situps');
        case 'JUMPING_JACKS': return t('jumpingJacks');
        case 'LUNGES': return t('lunges');
        case 'BURPEES': return t('burpees');
        default: return (type as string).replace('_', ' ');
    }
  };

  const SaveIndicator = ({ saving }: { saving: boolean }) => {
      if (saving) return <div className="flex items-center gap-1 text-xs text-blue-500"><Loader2 size={12} className="animate-spin"/> {t('saving')}</div>;
      return <div className="flex items-center gap-1 text-xs text-green-500 opacity-0 transition duration-1000"><Check size={12}/> {t('saved')}</div>; 
  };

  if (apiKeyMissing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 text-center">
              <div>
                  <h1 className="text-3xl font-bold text-red-500 mb-4">API Key Missing</h1>
                  <p>Please configure your <code>process.env.API_KEY</code> to use this application.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                    FitStream
                    {settings.isPro && <span className="bg-yellow-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5"><Crown size={10} fill="black"/> PRO</span>}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiTracking')}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-orange-500 font-bold tracking-wider uppercase">{t('streak')}</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{settings.streak} 🔥</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 overflow-hidden">
                    <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
                </div>
            </div>
        </div>
        
        {/* Motivation Banner */}
        {activeTab === AppTab.DASHBOARD && (
            <div className="bg-gradient-to-r from-indigo-100 to-white dark:from-indigo-900/50 dark:to-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-500/20 shadow-md dark:shadow-lg mb-4">
                <p className="text-sm italic text-indigo-800 dark:text-indigo-200">"{motivation}"</p>
            </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === AppTab.DASHBOARD && (
          <div className="px-4 space-y-8 pb-32">
            
            {/* Daily Goals Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('dailyGoals')}</h3>
                   <button 
                     onClick={() => setShowGoalSettings(true)}
                     className="bg-white dark:bg-gray-800 p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition shadow-sm border border-gray-100 dark:border-gray-700"
                   >
                       <Settings2 size={18} />
                   </button>
                </div>
                
                {/* Rings Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {settings.goals.filter(g => g.isEnabled).map((goal) => (
                        <div key={goal.type} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-lg">
                             <div className="absolute top-3 left-3">
                                 {getIconForType(goal.type)}
                             </div>
                             <AchievementRing 
                                radius={55} 
                                stroke={8} 
                                progress={goal.current} 
                                total={goal.target} 
                                color={goal.color} 
                                label={goal.unit === 'reps' ? t('reps') : t('steps')}
                            />
                            <div className="mt-2 text-center">
                                <span className="block text-sm font-bold text-gray-800 dark:text-white">{getLabelForType(goal.type)}</span>
                            </div>
                        </div>
                    ))}
                    {settings.goals.filter(g => g.isEnabled).length === 0 && (
                         <div className="col-span-2 text-center py-8 text-gray-500 bg-gray-100 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                             {t('noGoals')}
                         </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={attemptStartWorkout}
                    className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-5 rounded-2xl shadow-xl shadow-blue-500/20 dark:shadow-blue-900/20 flex flex-col items-center justify-center gap-2 transition transform active:scale-95"
                >
                    <Dumbbell size={28} />
                    <span className="font-bold">{t('startWorkout')}</span>
                    
                    {!settings.isPro && (
                        <div className="absolute top-2 right-2 bg-black/20 px-2 py-0.5 rounded text-[10px] font-mono">
                           {StorageService.getWeeklyWorkoutCount()}/3
                        </div>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.NUTRITION)}
                    className="bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white p-5 rounded-2xl shadow-xl shadow-orange-500/20 dark:shadow-orange-900/20 flex flex-col items-center justify-center gap-2 transition transform active:scale-95"
                >
                    <Utensils size={28} />
                    <span className="font-bold">{t('nutrition')}</span>
                </button>
            </div>
            
            {!settings.isPro && (
                <div 
                    onClick={() => setShowProModal(true)}
                    className="cursor-pointer bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-2 rounded-lg text-white">
                            <Crown size={20} fill="white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{t('upgradeToPro')}</p>
                            <p className="text-xs text-gray-500">{t('removeLimits')}</p>
                        </div>
                    </div>
                    <ArrowDown className="text-yellow-500 -rotate-90" size={20} />
                </div>
            )}

            {/* History Section (Collapsible) */}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <button 
                   onClick={() => setShowHistory(!showHistory)}
                   className="flex items-center justify-between w-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 px-2"
                >
                    <span className="font-bold text-sm uppercase tracking-wider">{t('detailedHistory')}</span>
                    {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                
                {showHistory && (
                    <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                        <StatsCharts 
                            exercises={StorageService.getExercises()} 
                            weights={StorageService.getWeights()}
                            targetWeight={settings.targetWeight}
                            isPro={settings.isPro}
                        />
                    </div>
                )}
            </div>
          </div>
        )}

        {activeTab === AppTab.WEIGHT && <WeightTracker />}
        {activeTab === AppTab.NUTRITION && <NutritionTracker />}

        {activeTab === AppTab.SOCIAL && (
           <div className="px-4 space-y-4 pb-24">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('leaderboard')}</h2>
               <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl flex items-center justify-between border border-blue-500/30 shadow-md mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-blue-500 font-mono font-bold">YOU</span>
                        <img src={settings.avatar} alt="You" className="w-12 h-12 rounded-full border-2 border-blue-500" />
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{settings.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{settings.streak} day streak</p>
                        </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-bold text-gray-900 dark:text-white">--</p>
                    </div>
               </div>
               
               {StorageService.getFriends().map((friend, idx) => (
                   <div key={friend.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl flex items-center justify-between border border-gray-200 dark:border-gray-700 shadow-sm">
                       <div className="flex items-center gap-4">
                           <span className="text-gray-500 font-mono font-bold">#{idx + 1}</span>
                           <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                           <div>
                               <p className="font-bold text-gray-900 dark:text-white">{friend.name}</p>
                               <p className="text-xs text-gray-500 dark:text-gray-400">{t('topAthlete')}</p>
                           </div>
                       </div>
                       <div className="text-right">
                           <p className="text-xl font-bold text-blue-500">{friend.score}</p>
                           <p className="text-[10px] text-gray-500 uppercase">{t('points')}</p>
                       </div>
                   </div>
               ))}
           </div>
        )}

        {activeTab === AppTab.SETTINGS && (
            <div className="px-4 space-y-6 pb-24">
                
                {/* Avatar Selection */}
                <div className="flex flex-col items-center py-6">
                    <div className="relative group cursor-pointer" onClick={() => setShowAvatarSelector(true)}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 group-hover:border-blue-500 transition shadow-xl">
                            <img src={settings.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full border-4 border-gray-100 dark:border-gray-900 text-white">
                            <Camera size={16} />
                        </div>
                    </div>
                    <button onClick={() => setShowAvatarSelector(true)} className="mt-3 text-sm text-blue-500 font-bold">
                        {t('changeAvatar')}
                    </button>
                </div>

                <div className="space-y-4">
                    
                    {/* Subscription Banner in Settings */}
                    {!settings.isPro && (
                        <div onClick={() => setShowProModal(true)} className="bg-gradient-to-r from-yellow-500 to-orange-600 p-4 rounded-xl text-white shadow-lg cursor-pointer transform transition hover:scale-[1.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 p-2 rounded-full">
                                        <Crown size={24} fill="white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">FitStream PRO</p>
                                        <p className="text-xs text-white/80">{t('unlockAllFeatures')}</p>
                                    </div>
                                </div>
                                <div className="bg-white text-orange-600 px-3 py-1 rounded-full text-xs font-bold">
                                    {t('upgrade')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bio Data Section */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                             <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                                <Users size={16} className="text-purple-500" />
                                Bio Data
                             </h4>
                             <SaveIndicator saving={isSavingSettings} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('yourName')}</span>
                                <input 
                                    type="text" 
                                    value={nameInput}
                                    onChange={(e) => setNameInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none"
                                />
                            </label>
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('age')}</span>
                                <input 
                                    type="number" 
                                    value={ageInput}
                                    onChange={(e) => setAgeInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none"
                                />
                            </label>
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('height')}</span>
                                <input 
                                    type="number" 
                                    value={heightInput}
                                    onChange={(e) => setHeightInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none"
                                />
                            </label>
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('gender')}</span>
                                <select 
                                    value={settings.gender}
                                    onChange={(e) => updateGender(e.target.value as Gender)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none"
                                >
                                    <option value="MALE">{t('male')}</option>
                                    <option value="FEMALE">{t('female')}</option>
                                    <option value="OTHER">{t('other')}</option>
                                </select>
                            </label>
                        </div>
                        
                        <label className="block mt-4">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('activityLevel')}</span>
                            <select 
                                value={settings.activityLevel}
                                onChange={(e) => updateActivity(e.target.value as ActivityLevel)}
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none"
                            >
                                <option value="SEDENTARY">{t('sedentary')}</option>
                                <option value="LIGHT">{t('light')}</option>
                                <option value="MODERATE">{t('moderate')}</option>
                                <option value="VERY_ACTIVE">{t('very_active')}</option>
                            </select>
                        </label>
                    </div>

                    {/* Weight & Reference Object */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h4 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                             <Ruler size={16} className="text-green-500" />
                             {t('nutrition')} & {t('weight')}
                        </h4>
                        
                        <label className="block mb-4">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('referenceObject')}</span>
                            <input 
                                type="text" 
                                value={refObjectInput}
                                onChange={(e) => setRefObjectInput(e.target.value)}
                                placeholder="e.g. Keys, Ring, AirPods Case"
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-green-500 outline-none"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">{t('referenceDesc')}</p>
                        </label>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('currentWeight')}</span>
                                <input 
                                    type="number" 
                                    value={currentWeightInput}
                                    onChange={(e) => setCurrentWeightInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-emerald-500 outline-none"
                                />
                            </label>
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('targetWeight')}</span>
                                <input 
                                    type="number" 
                                    value={targetWeightInput}
                                    onChange={(e) => setTargetWeightInput(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-purple-500 outline-none"
                                />
                            </label>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {settings.theme === 'dark' ? <Moon size={20} className="text-purple-400"/> : <Sun size={20} className="text-orange-500"/>}
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{t('theme')}</span>
                        </div>
                        <button 
                            onClick={toggleTheme}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${settings.theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-orange-100 text-orange-600 border border-orange-200'}`}
                        >
                            {settings.theme === 'dark' ? t('darkMode') : t('lightMode')}
                        </button>
                    </div>

                    {/* Health Integrations */}
                    <HealthConnect settings={settings} onUpdate={refreshData} />
                    
                    {/* Backend Configuration UI */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                         <div className="flex justify-between items-start mb-3">
                             <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                                <Server size={16} className="text-indigo-500" />
                                Backend
                             </h4>
                             <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold transition-all ${
                                 serverStatus === 'online' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800' :
                                 serverStatus === 'offline' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800' :
                                 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                             }`}>
                                 {serverStatus === 'checking' && <Loader2 size={10} className="animate-spin" />}
                                 {serverStatus === 'online' && <Wifi size={10} />}
                                 {serverStatus === 'offline' && <WifiOff size={10} />}
                                 
                                 <span>{serverStatus === 'online' ? 'Online' : serverStatus === 'offline' ? 'Offline' : 'Checking'}</span>
                             </div>
                         </div>
                         <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">URL</span>
                            <div className="flex items-center gap-2 mt-1">
                                <Globe size={16} className="text-gray-400" />
                                <input 
                                    type="text" 
                                    value={backendUrlInput}
                                    onChange={(e) => setBackendUrlInput(e.target.value)}
                                    placeholder="https://your-app.up.railway.app"
                                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition font-mono"
                                />
                                <button 
                                    onClick={runDiagnostics}
                                    disabled={isDiagnosing}
                                    className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg text-xs font-bold whitespace-nowrap text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition flex items-center gap-2"
                                >
                                    {isDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <Terminal size={14} />}
                                    Test
                                </button>
                            </div>
                         </label>
                         
                         {/* Diagnostic Console */}
                         {showDiagnostics && (
                             <div className="mt-3 bg-black rounded-lg p-3 font-mono text-[10px] text-green-400 overflow-hidden relative">
                                 <div className="absolute top-2 right-2">
                                     <button onClick={() => setShowDiagnostics(false)} className="text-gray-500 hover:text-white"><XCircle size={14}/></button>
                                 </div>
                                 <div className="space-y-1 max-h-40 overflow-y-auto">
                                     {diagnosticLogs.map((log, i) => (
                                         <div key={i} className={log.includes('❌') || log.includes('Error') ? "text-red-400" : log.includes('⚠️') ? "text-yellow-400" : ""}>
                                             {log}
                                         </div>
                                     ))}
                                     {isDiagnosing && <div className="animate-pulse">_</div>}
                                 </div>
                             </div>
                         )}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mt-2 shadow-sm">
                        <h4 className="text-gray-900 dark:text-white font-bold mb-2">{t('deviceSensor')}</h4>
                        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                             <span>{t('stepCounter')} (Beta)</span>
                             <span className={sessionSteps > 0 ? "text-green-500" : "text-gray-400 dark:text-gray-600"}>
                                 {sessionSteps > 0 ? t('active') : t('ready')}
                             </span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-t border-gray-200 dark:border-slate-900 px-2 py-3 flex justify-between items-end z-40 transition-colors duration-300">
        <button 
            onClick={() => setActiveTab(AppTab.DASHBOARD)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.DASHBOARD ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium">{t('dashboard')}</span>
        </button>
        <button 
            onClick={() => setActiveTab(AppTab.NUTRITION)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.NUTRITION ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
        >
            <Utensils size={20} />
            <span className="text-[10px] font-medium">{t('nutrition')}</span>
        </button>
        <button 
            onClick={() => setIsWorkoutActive(true)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.WORKOUT ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
            <div className="bg-blue-600 text-white p-3 rounded-full -mt-8 shadow-lg shadow-blue-500/30 dark:shadow-blue-900/50 hover:bg-blue-500 transition border-4 border-white dark:border-slate-950">
                <Dumbbell size={24} />
            </div>
            <span className="text-[10px] font-medium">{t('workout')}</span>
        </button>
        <button 
            onClick={() => setActiveTab(AppTab.SOCIAL)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.SOCIAL ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
            <Users size={20} />
            <span className="text-[10px] font-medium">{t('social')}</span>
        </button>
        <button 
            onClick={() => setActiveTab(AppTab.SETTINGS)}
            className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.SETTINGS ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
        >
            <Settings size={20} />
            <span className="text-[10px] font-medium">{t('settings')}</span>
        </button>
      </nav>

      {/* Full Screen Workout Overlay */}
      {isWorkoutActive && (
          <WorkoutSession onFinish={() => {
              setIsWorkoutActive(false);
              refreshData();
              fetchMotivation();
          }} />
      )}

      {/* Pro Upgrade Modal */}
      {showProModal && (
          <ProUpgradeModal 
             onClose={() => setShowProModal(false)}
             onUpgradeMock={handleMockUpgrade}
          />
      )}

      {/* Goal Settings Modal */}
      {showGoalSettings && (
          <GoalSettings 
            onClose={() => setShowGoalSettings(false)} 
            onUpdate={refreshData} 
          />
      )}

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
          <AvatarSelector 
            currentAvatar={settings.avatar}
            onClose={() => setShowAvatarSelector(false)}
            onSelect={updateAvatar}
          />
      )}
    </div>
  );
};

export default App;
