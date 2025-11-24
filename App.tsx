import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Dumbbell, Weight, Users, Settings, Settings2, ChevronDown, ChevronUp, Footprints, Activity, ArrowDown, ArrowUp, Move, Camera, Check, Loader2, Moon, Sun, Lock, Crown, Server, Globe, Wifi, WifiOff, RefreshCw, Terminal, AlertTriangle, CheckCircle2, XCircle, Utensils, Ruler, Smartphone, X, Mic, Volume2 } from 'lucide-react';
import { AppTab, UserSettings, DailyGoal, GoalType, WeightLog, Gender, ActivityLevel } from './types';
import { StorageService } from './services/storageService';
import { ApiService } from './services/api';
import { getMotivation, getPhoneSpecs, scanScaleDisplay } from './services/geminiService';
import { AchievementRing } from './components/AchievementRings';
import { WorkoutSession } from './components/WorkoutSession';
import { WeightTracker } from './components/WeightTracker';
import { NutritionTracker } from './components/NutritionTracker';
import { StatsCharts } from './components/Charts';
import { GoalSettings } from './components/GoalSettings';
import { AvatarSelector } from './components/AvatarSelector';
import { HealthConnect } from './components/HealthConnect';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { ReferenceObjectScanner } from './components/ReferenceObjectScanner';
import { GoalDetailsModal } from './components/GoalDetailsModal';
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
  const [showRefScanner, setShowRefScanner] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  
  // Goal Selection
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);
  
  // Phone Weight Scan Logic
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showQuickScan, setShowQuickScan] = useState(false);
  const [phoneModelInput, setPhoneModelInput] = useState("");
  const [isCalculatingPhone, setIsCalculatingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [quickScanVideoRef, setQuickScanVideoRef] = useState<HTMLVideoElement | null>(null);
  const [quickScanResult, setQuickScanResult] = useState<{ raw: number, net: number } | null>(null);
  const [isQuickScanning, setIsQuickScanning] = useState(false);
  const quickScanCanvasRef = useRef<HTMLCanvasElement>(null);

  // Diagnostics State
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Local state for auto-save fields
  const [nameInput, setNameInput] = useState(settings.name);
  const [ageInput, setAgeInput] = useState(settings.age.toString());
  const [heightInput, setHeightInput] = useState(settings.height.toString());
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

  // Offline-First Initialization
  useEffect(() => {
      // 1. Load Local Data Immediately
      refreshData();
      
      // 2. Start Background Sync
      const initBackground = async () => {
          try {
              const hasUpdates = await StorageService.initializeFromBackend();
              // If backend had new data, refresh the UI
              if (hasUpdates) {
                  refreshData();
                  fetchMotivation();
              }
          } catch(e) {
              console.error("Background sync error:", e);
          } finally {
              checkServerConnection();
          }
      };
      
      initBackground();
  }, []);

  // Function to check connection status (Quick Check)
  const checkServerConnection = async (customUrl?: string) => {
      setServerStatus('checking');
      const userId = StorageService.getUserId();
      const currentSettings = StorageService.getSettings();
      const urlToCheck = customUrl || currentSettings.backendUrl;
      
      try {
          const result = await ApiService.syncUser(userId, currentSettings, urlToCheck);
          
          if (result) {
              setServerStatus('online');
              if (currentSettings.isPro !== result.isPro) {
                  currentSettings.isPro = result.isPro;
                  StorageService.saveSettings(currentSettings, false); // No push needed, we just pulled
                  refreshData();
              }
          } else {
              setServerStatus('offline');
          }
      } catch (e) {
          setServerStatus('offline');
      }
  };

  // Detailed Diagnostics Tool v6
  const runDiagnostics = async () => {
      setIsDiagnosing(true);
      setShowDiagnostics(true);
      setDiagnosticLogs(["Starting diagnostics v6 (Ultra Verbose)...", "--------------------------------"]);
      
      const addLog = (msg: string) => setDiagnosticLogs(prev => [...prev, msg]);
      
      // 0. Environment
      addLog(`[0] Environment:`);
      addLog(`   Origin: ${window.location.origin}`);
      addLog(`   Online: ${navigator.onLine ? '✅ Yes' : '❌ No'}`);
      
      const userId = StorageService.getUserId();
      let url = backendUrlInput.trim();
      
      if (!url) {
          addLog("❌ Error: URL is empty.");
          setIsDiagnosing(false);
          return;
      }

      // 1. URL Analysis
      addLog(`[1] Target URL: ${url}`);
      try {
          const parsed = new URL(url);
          addLog(`   Protocol: ${parsed.protocol}`);
          addLog(`   Hostname: ${parsed.hostname}`);
          if (parsed.protocol === 'http:' && window.location.protocol === 'https:') {
               addLog("⚠️ BLOCKER: Mixed Content (HTTP API on HTTPS Site)");
               addLog("   Browser will BLOCK this request.");
          }
      } catch(e) {
          addLog("❌ Invalid URL format");
          setIsDiagnosing(false);
          return;
      }
      
      if (url.endsWith('/')) url = url.slice(0, -1);
      const baseUrl = url.endsWith('/api') ? url.slice(0, -4) : url;
      const apiUrl = url.endsWith('/api') ? url : `${url}/api`;

      addLog(`   Base: ${baseUrl}`);
      addLog(`   API:  ${apiUrl}`);

      // 2. Reachability Probe (NO-CORS)
      // This helps distinguish between "Server Down/SSL Error" and "CORS Error"
      addLog(`[2] Reachability Probe (mode: no-cors)...`);
      let reachabilitySuccess = false;
      try {
          const start = Date.now();
          // We assume a GET to root exists
          const res = await fetch(`${baseUrl}/?t=${Date.now()}`, { 
              method: 'GET', 
              mode: 'no-cors' // IMPORTANT: This allows us to talk to the server even if CORS headers are missing
          });
          const latency = Date.now() - start;
          addLog(`✅ Server Reachable (${latency}ms)`);
          addLog(`   Response Type: ${res.type}`); // Should be 'opaque'
          addLog(`   Result: Network path is clear. Server exists.`);
          reachabilitySuccess = true;
      } catch (e: any) {
           addLog(`❌ Reachability Failed:`);
           addLog(`   ${e.toString()}`);
           addLog(`   Conclusion: DNS, SSL, or Server Down.`);
           addLog(`   Verify the URL and that the server is running.`);
           setIsDiagnosing(false);
           return; // No point continuing if we can't even touch the server
      }

      // 3. CORS Check (Standard Fetch)
      addLog(`[3] CORS Check (GET /)...`);
      try {
          const res = await fetch(`${baseUrl}/?t=${Date.now()}`, { 
              method: 'GET'
              // mode: cors is default
          });
          addLog(`${res.ok ? '✅' : '⚠️'} Status: ${res.status}`);
          if (res.ok) {
              addLog(`   CORS headers are CORRECT.`);
          } else {
              addLog(`   Server responded but with error status.`);
          }
      } catch (e: any) {
          addLog(`❌ CORS/Fetch Error:`);
          addLog(`   ${e.name}: ${e.message}`);
          if (e.message === 'Failed to fetch') {
               addLog(`   -> CRITICAL: Server reachable (see [2]), but browser blocked response.`);
               addLog(`   -> CAUSE: Missing 'Access-Control-Allow-Origin' header on server.`);
               if (reachabilitySuccess) {
                   addLog(`   💡 DIAGNOSIS: Server is ONLINE but refusing connections.`);
                   addLog(`   💡 ACTION: Redeploy backend with CORS enabled for *.`);
               }
          }
      }

      // 4. API Logic Check
      addLog(`[4] API Endpoint (POST /user/sync)...`);
      try {
          const res = await fetch(`${apiUrl}/user/sync`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, settings: { ...settings, diagnostic: true } })
          });

          if (res.ok) {
              const json = await res.json();
              addLog(`✅ API Success! Is Pro: ${json.isPro}`);
              setServerStatus('online');
          } else {
              addLog(`❌ API Status: ${res.status}`);
              try {
                  const text = await res.text();
                  addLog(`   Body: ${text.substring(0, 100)}`);
              } catch (err) {}
          }
      } catch (e: any) {
          addLog(`❌ API Failed: ${e.message}`);
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
              alert(t('welcomePro'));
          }
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

  const refreshData = () => {
    const s = StorageService.getSettings();
    setSettings(s);
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        setNameInput(s.name);
        setAgeInput(s.age.toString());
        setHeightInput(s.height.toString());
        setTargetWeightInput(s.targetWeight.toString());
        setCurrentWeightInput(StorageService.getLastWeight().toString() || '0');
        setBackendUrlInput(s.backendUrl || '');
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, showGoalSettings, isWorkoutActive, sessionSteps]);

  useEffect(() => {
     fetchMotivation();
  }, [fetchMotivation]);

  // Debounce Settings Save
  useEffect(() => {
      const timer = setTimeout(() => {
          if (nameInput !== settings.name || 
              parseInt(ageInput) !== settings.age || 
              parseInt(heightInput) !== settings.height ||
              parseFloat(targetWeightInput) !== settings.targetWeight ||
              backendUrlInput !== (settings.backendUrl || '')) {
              
              setIsSavingSettings(true);
              const newSettings = { 
                  ...settings, 
                  name: nameInput,
                  age: parseInt(ageInput) || 0,
                  height: parseInt(heightInput) || 170,
                  targetWeight: parseFloat(targetWeightInput) || 0,
                  backendUrl: backendUrlInput
              };
              StorageService.saveSettings(newSettings);
              setSettings(newSettings);
              
              if (backendUrlInput !== settings.backendUrl) {
                  checkServerConnection(backendUrlInput);
              }
              setTimeout(() => setIsSavingSettings(false), 800);
          }
      }, 1500);

      return () => clearTimeout(timer);
  }, [nameInput, ageInput, heightInput, targetWeightInput, backendUrlInput, settings]);

  const updateGender = (g: Gender) => {
      const newSettings = { ...settings, gender: g };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
  };
  
  const updateCoachVoice = (v: string) => {
      const newSettings = { ...settings, coachVoice: v };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
  };

  const updateActivity = (a: ActivityLevel) => {
      const newSettings = { ...settings, activityLevel: a };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
  };

  const updateReferenceObject = (name: string, dims: string) => {
      const newSettings = { ...settings, referenceObject: name, referenceDimensions: dims };
      setSettings(newSettings);
      StorageService.saveSettings(newSettings);
      setShowRefScanner(false);
  };

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
          case 'DIPS': return <ArrowDown size={16} className="text-cyan-500"/>;
          case 'PULLUPS': return <ArrowUp size={16} className="text-violet-500"/>;
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
        case 'DIPS': return t('dips');
        case 'PULLUPS': return t('pullups');
        default: return (type as string).replace('_', ' ');
    }
  };
  
  // --- Phone Scan Handlers ---
  const handleScanClick = () => {
      if (!settings.phoneModel || !settings.phoneWeight) {
          setShowPhoneModal(true);
          setPhoneModelInput("");
          setPhoneError(null);
      } else {
          startQuickScan();
      }
  };
  
  const calculatePhoneWeight = async () => {
      if (!phoneModelInput) return;
      setIsCalculatingPhone(true);
      setPhoneError(null);
      
      const result = await getPhoneSpecs(phoneModelInput);
      
      if (result && result.officialName && result.weightGrams) {
          const weightKg = result.weightGrams / 1000;
          const newSettings = {
              ...settings,
              phoneModel: result.officialName,
              phoneWeight: weightKg
          };
          setSettings(newSettings);
          StorageService.saveSettings(newSettings);
          setIsCalculatingPhone(false);
          setShowPhoneModal(false);
          startQuickScan();
      } else {
          setPhoneError(t('scanError') + " (Model not found)");
          setIsCalculatingPhone(false);
      }
  };

  const startQuickScan = async () => {
      setShowQuickScan(true);
      setQuickScanResult(null);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          const videoElement = document.createElement('video');
          videoElement.srcObject = stream;
          videoElement.play();
          setQuickScanVideoRef(videoElement);
      } catch(e) {
          console.error(e);
          alert(t('cameraDenied'));
          setShowQuickScan(false);
      }
  };
  
  const captureQuickScan = async () => {
      if (!quickScanVideoRef || !quickScanCanvasRef.current) return;
      setIsQuickScanning(true);
      
      const canvas = quickScanCanvasRef.current;
      canvas.width = quickScanVideoRef.videoWidth;
      canvas.height = quickScanVideoRef.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(quickScanVideoRef, 0, 0);
      
      const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
      
      quickScanVideoRef.pause();

      const result = await scanScaleDisplay(base64);
      
      if (result.weight) {
          const net = Math.max(0, result.weight - (settings.phoneWeight || 0));
          setQuickScanResult({ raw: result.weight, net: Number(net.toFixed(1)) });
      } else {
          alert(t('scanError'));
          quickScanVideoRef.play();
      }
      setIsQuickScanning(false);
  };
  
  const confirmQuickScan = () => {
      if (quickScanResult) {
          setCurrentWeightInput(quickScanResult.net.toString());
          closeQuickScan();
      }
  };
  
  const closeQuickScan = () => {
      if (quickScanVideoRef && quickScanVideoRef.srcObject) {
          const stream = quickScanVideoRef.srcObject as MediaStream;
          stream.getTracks().forEach(t => t.stop());
      }
      setShowQuickScan(false);
      setQuickScanResult(null);
      setQuickScanVideoRef(null);
  };

  const SaveIndicator = ({ saving }: { saving: boolean }) => {
      if (saving) return <div className="flex items-center gap-1 text-xs text-blue-500"><Loader2 size={12} className="animate-spin"/> {t('saving')}</div>;
      return <div className="flex items-center gap-1 text-xs text-green-500 opacity-0 transition duration-1000"><Check size={12}/> {t('saved')}</div>; 
  };

  const enabledGoals = settings.goals.filter(g => g.isEnabled);

  if (apiKeyMissing) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-6 text-center">
              <div>
                  <h1 className="text-3xl font-bold text-red-500 mb-4">{t('apiKeyMissing')}</h1>
                  <p>{t('apiKeyMissingDesc')}</p>
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
                    {settings.isPro && <span className="bg-yellow-500 text-black text-[9px] font-bold px-1 py-0.5 rounded uppercase flex items-center gap-0.5"><Crown size={8} fill="black"/> PRO</span>}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiTracking')}</p>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <span className="text-xs text-orange-500 font-bold tracking-wider uppercase">{t('streak')}</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">{settings.streak} 🔥</span>
                </div>
                <div className="relative">
                    {settings.isPro && (
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 transform -rotate-12">
                                <Crown size={14} className="text-yellow-400 fill-yellow-400 drop-shadow-sm filter" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }} />
                        </div>
                    )}
                    <div className={`w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border-2 overflow-hidden ${settings.isPro ? 'border-yellow-400 dark:border-yellow-500' : 'border-gray-300 dark:border-gray-700'}`}>
                        <img src={settings.avatar} alt="Profile" className="w-full h-full object-cover" />
                    </div>
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
                    {enabledGoals.map((goal, idx) => (
                        <div 
                            key={goal.type} 
                            onClick={() => setSelectedGoal(goal)}
                            className={`bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-lg cursor-pointer hover:scale-[1.02] transition-transform ${enabledGoals.length % 2 !== 0 && idx === enabledGoals.length - 1 ? 'col-span-2' : ''}`}
                        >
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
                    {enabledGoals.length === 0 && (
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
        {activeTab === AppTab.NUTRITION && <NutritionTracker onRequestPro={() => setShowProModal(true)} />}

        {activeTab === AppTab.SOCIAL && (
           <div className="px-4 space-y-4 pb-24">
               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('leaderboard')}</h2>
               <div className="bg-white dark:bg-gray-800/50 p-4 rounded-xl flex items-center justify-between border border-blue-500/30 shadow-md mb-6">
                    <div className="flex items-center gap-4">
                        <span className="text-blue-500 font-mono font-bold">YOU</span>
                        <div className="relative">
                            {settings.isPro && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 transform -rotate-12">
                                     <Crown size={16} className="text-yellow-400 fill-yellow-400 drop-shadow-sm" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }} />
                                </div>
                            )}
                            <img src={settings.avatar} alt="You" className={`w-12 h-12 rounded-full border-2 ${settings.isPro ? 'border-yellow-400' : 'border-blue-500'}`} />
                        </div>
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
                        {settings.isPro && (
                             <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 transform -rotate-6">
                                  <Crown size={32} className="text-yellow-400 fill-yellow-400 drop-shadow-md" style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.3))' }} />
                             </div>
                        )}
                        <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${settings.isPro ? 'border-yellow-400' : 'border-white dark:border-gray-800'} group-hover:border-blue-500 transition shadow-xl`}>
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

                    {/* AI Coach Settings (NEW POSITION) */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                             <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                                <Volume2 size={16} className="text-blue-500" />
                                AI Coach
                             </h4>
                        </div>
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('coachVoice')}</span>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-1 mt-1">
                                <button 
                                    onClick={() => updateCoachVoice('Fenrir')}
                                    className={`flex-1 text-xs py-2 rounded-md transition flex items-center justify-center gap-2 ${settings.coachVoice === 'Fenrir' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                >
                                    <Mic size={12} /> {t('voiceMale')}
                                </button>
                                <button 
                                    onClick={() => updateCoachVoice('Kore')}
                                    className={`flex-1 text-xs py-2 rounded-md transition flex items-center justify-center gap-2 ${settings.coachVoice === 'Kore' ? 'bg-white dark:bg-gray-800 shadow-sm text-purple-600 dark:text-purple-400 font-bold ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                >
                                    <Mic size={12} /> {t('voiceFemale')}
                                </button>
                            </div>
                        </label>
                    </div>

                    {/* Bio Data Section */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                             <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                                <Users size={16} className="text-purple-500" />
                                {t('bioData')}
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
                        
                        <div className="grid grid-cols-1 gap-4 mt-4">
                            <label className="block">
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
                    </div>

                    {/* Weight & Reference Object */}
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h4 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                             <Ruler size={16} className="text-green-500" />
                             {t('nutrition')} & {t('weight')}
                        </h4>
                        
                        <div className="mb-4">
                             <span className="text-gray-500 dark:text-gray-400 text-xs">{t('referenceObject')}</span>
                             <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg mt-1 border border-gray-200 dark:border-gray-700">
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <p className="text-sm font-bold text-gray-900 dark:text-white">{settings.referenceObject || t('notSet')}</p>
                                         {settings.referenceDimensions && (
                                             <p className="text-xs text-gray-500">{settings.referenceDimensions}</p>
                                         )}
                                     </div>
                                     <button 
                                         onClick={() => setShowRefScanner(true)}
                                         className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                     >
                                         <Camera size={14}/> {settings.referenceObject ? t('update') : t('set')}
                                     </button>
                                 </div>
                             </div>
                             <p className="text-[10px] text-gray-400 mt-1">{t('referenceDesc')}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{t('currentWeight')}</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <input 
                                        type="number" 
                                        value={currentWeightInput}
                                        onChange={(e) => setCurrentWeightInput(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleScanClick}
                                        className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800 transition shadow-sm border border-emerald-200 dark:border-emerald-800"
                                    >
                                        <Camera size={20} />
                                    </button>
                                </div>
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
                                 
                                 <span>{serverStatus === 'online' ? t('online') : serverStatus === 'offline' ? t('offline') : t('checking')}</span>
                             </div>
                         </div>
                         <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">{t('url')}</span>
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
                                    {t('test')}
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
                                         <div key={i} className={log.includes('❌') || log.includes('Error') || log.includes('CRITICAL') || log.includes('Failed') ? "text-red-400" : log.includes('⚠️') || log.includes('DIAGNOSIS') ? "text-yellow-400" : ""}>
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
      
      {/* Goal Details Modal */}
      {selectedGoal && (
          <GoalDetailsModal 
              goal={selectedGoal}
              label={getLabelForType(selectedGoal.type)}
              onClose={() => setSelectedGoal(null)}
          />
      )}
      
      {/* Phone Model Modal */}
      {showPhoneModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Smartphone size={18} className="text-blue-500"/>
                          {t('phoneModelPrompt')}
                      </h3>
                      <button onClick={() => setShowPhoneModal(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('phoneModelDesc')}</p>
                      <input 
                          type="text"
                          value={phoneModelInput}
                          onChange={(e) => setPhoneModelInput(e.target.value)}
                          placeholder={t('phonePlaceholder')}
                          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-3 outline-none focus:border-blue-500"
                      />
                      {phoneError && (
                          <div className="text-red-500 text-xs flex items-center gap-1">
                              <AlertTriangle size={12} /> {phoneError}
                          </div>
                      )}
                      <button 
                          onClick={calculatePhoneWeight}
                          disabled={!phoneModelInput || isCalculatingPhone}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                      >
                          {isCalculatingPhone ? <Loader2 className="animate-spin" /> : t('calcPhoneWeight')}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Quick Weight Scan Overlay */}
      {showQuickScan && (
          <div className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center">
             <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
                 <div className="flex items-center gap-2 text-white">
                     <Settings2 size={16} />
                     <span className="text-sm font-bold">{settings.phoneModel} ({settings.phoneWeight}{t('unitKg')})</span>
                 </div>
                 <button onClick={closeQuickScan} className="bg-white/20 p-2 rounded-full text-white backdrop-blur">
                     <X size={20} />
                 </button>
             </div>
             
             <div className="relative w-full h-full bg-black">
                 {/* Video container handled by DOM element logic, but we need a canvas for capture */}
                 <div className="w-full h-full flex items-center justify-center" ref={(el) => {
                     if (el && quickScanVideoRef) {
                         el.innerHTML = '';
                         quickScanVideoRef.className = "w-full h-full object-cover";
                         el.appendChild(quickScanVideoRef);
                     }
                 }}></div>
                 <canvas ref={quickScanCanvasRef} className="hidden" />

                 {/* Results Overlay */}
                 {quickScanResult ? (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                         <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-gray-700 shadow-2xl">
                             <h3 className="text-xl font-bold text-center mb-6 text-white">{t('confirmWeight')}</h3>
                             
                             <div className="space-y-4 mb-6">
                                 <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                     <span className="text-gray-400">{t('rawReading')}</span>
                                     <span className="font-mono text-xl">{quickScanResult.raw} {t('unitKg')}</span>
                                 </div>
                                 <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                     <span className="text-gray-400 flex items-center gap-1"><Smartphone size={14}/> {t('phoneDeduction')}</span>
                                     <span className="font-mono text-xl text-red-400">- {settings.phoneWeight} {t('unitKg')}</span>
                                 </div>
                                 <div className="flex justify-between items-center pt-2">
                                     <span className="text-white font-bold text-lg">{t('netWeight')}</span>
                                     <span className="font-mono text-4xl font-bold text-emerald-400">{quickScanResult.net} {t('unitKg')}</span>
                                 </div>
                             </div>
                             
                             <div className="flex gap-3">
                                 <button onClick={startQuickScan} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white">
                                     {t('retake')}
                                 </button>
                                 <button onClick={confirmQuickScan} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white">
                                     {t('useThis')}
                                 </button>
                             </div>
                         </div>
                     </div>
                 ) : (
                     <>
                        {/* Guide Box */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-32 border-2 border-emerald-500/50 border-dashed rounded-lg flex items-center justify-center">
                                <span className="bg-black/40 text-white text-xs px-2 py-1 rounded backdrop-blur">
                                    {t('scanScale')}
                                </span>
                            </div>
                        </div>

                        {/* Capture Trigger */}
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-auto">
                            <button 
                                onClick={captureQuickScan}
                                disabled={isQuickScanning}
                                className="bg-white text-black p-5 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95"
                            >
                                {isQuickScanning ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
                            </button>
                        </div>
                     </>
                 )}
             </div>
          </div>
      )}

      {/* Reference Object Scanner */}
      {showRefScanner && (
          <ReferenceObjectScanner 
             onClose={() => setShowRefScanner(false)}
             onSave={updateReferenceObject}
          />
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