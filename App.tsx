
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LayoutDashboard, Dumbbell, Weight, Users, Settings, Settings2, ChevronDown, ChevronUp, Footprints, Activity, ArrowDown, ArrowUp, Move, Camera, Check, Loader2, Moon, Sun, Crown, Utensils, Ruler, Smartphone, X, Mic, Volume2, LogOut, AlertTriangle, Wifi, WifiOff, Coins, ShoppingCart, MessageCircle, Send, Globe, Droplets, GlassWater, Coffee, Milk, Flame } from 'lucide-react';
import { AppTab, UserSettings, DailyGoal, GoalType, WeightLog, Gender, ActivityLevel, WeightGoal, NutritionLog } from './types';
import { StorageService } from './services/storageService';
import { ApiService } from './services/api';
import { getPhoneSpecs, scanScaleDisplay } from './services/geminiService';
import { AchievementRing } from './components/AchievementRings';
import { WorkoutSession } from './components/WorkoutSession';
import { WeightTracker } from './components/WeightTracker';
import { NutritionTracker } from './components/NutritionTracker';
import { StatsCharts } from './components/Charts';
import { GoalSettings } from './components/GoalSettings';
import { AvatarSelector } from './components/AvatarSelector';
import { HealthConnect } from './components/HealthConnect';
import { DeviceSettings } from './components/DeviceSettings';
// ProUpgradeModal removed - replaced with BillingBanner and TopUpModal
import { ReferenceObjectScanner } from './components/ReferenceObjectScanner';
import { GoalDetailsModal } from './components/GoalDetailsModal';
import { ShoppingAssistant } from './components/ShoppingAssistant';
import { useStepCounter } from './hooks/useStepCounter';
import { useAppLifecycle } from './hooks/useAppLifecycle';
import { t, getLanguageList, getSavedLanguage, setLanguage } from './services/i18n';
import { isTelegramWebApp, initTelegramApp, getTelegramUser, getTelegramUserId, getColorScheme, hapticFeedback, openTelegramLink } from './services/telegramService';
import TelegramLinkButton from './components/TelegramLinkButton';
import { googleAuthService } from './services/googleAuthService';
import { permissionsService } from './services/permissionsService';
import { getCurrencyList, CurrencyCode } from './services/currencyService';
import { APP_VERSION, BUILD_CODE, BUILD_DATE } from './version';
import { BUILD_CONFIG } from './buildConfig';
import { BillingProvider } from './contexts/BillingContext';
import { BalanceIndicator, TopUpModal, TrialBanner, BillingBanner, BalanceMini } from './components/Billing';
import { initTimerService } from './services/timerService';
import { UpdateBanner } from './components/UpdateBanner';

// Helper to decode Google JWT
function parseJwt (token: string) {
    try {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch(e) {
        return null;
    }
}

const App = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(StorageService.getSettings());
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // showProModal removed - replaced with billing system
  const [showRefScanner, setShowRefScanner] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  
  // Custom Icons State
  const [customIcons, setCustomIcons] = useState<Record<string, string>>({});
  
  // Goal Selection
  const [selectedGoal, setSelectedGoal] = useState<DailyGoal | null>(null);

  // Exercise Picker for Quick Start
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  // Food Photo from Dashboard
  const [openFoodCameraOnMount, setOpenFoodCameraOnMount] = useState(false);

  // Initial tool sheet for NutritionTracker (kitchen, recipes, finance)
  const [initialToolSheet, setInitialToolSheet] = useState<'kitchen' | 'recipes' | 'finance' | null>(null);

  // Water tracking
  const [todayWater, setTodayWater] = useState(0);

  // Telegram Mini App Detection
  const [isTelegramApp, setIsTelegramApp] = useState(false);
  
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

  // Local state for auto-save fields
  const [nameInput, setNameInput] = useState(settings.name);
  const [ageInput, setAgeInput] = useState(settings.age.toString());
  const [heightInput, setHeightInput] = useState(settings.height.toString());
  const [targetWeightInput, setTargetWeightInput] = useState(settings.targetWeight.toString());
  const [currentWeightInput, setCurrentWeightInput] = useState<string>(StorageService.getLastWeight().toString());
  
  // Google Client ID with fallback to the provided ID
  const [googleClientIdInput, setGoogleClientIdInput] = useState(process.env.GOOGLE_CLIENT_ID || '1025917117754-lm4epakgpqvotb36cm3ppcgpvrktnesj.apps.googleusercontent.com');

  // Saving states
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingWeight, setIsSavingWeight] = useState(false);
  
  // Background Step Counter
  const sessionSteps = useStepCounter();
  
  // Derived state for goals
  const enabledGoals = settings.goals.filter(g => g.isEnabled);

  // Reset initialToolSheet when leaving NUTRITION tab
  useEffect(() => {
      if (activeTab !== AppTab.NUTRITION) {
          setInitialToolSheet(null);
      }
  }, [activeTab]);

  // Fetch Custom Icons on Load
  useEffect(() => {
      const loadIcons = async () => {
          const icons = await ApiService.getCustomIcons(settings.backendUrl);
          setCustomIcons(icons);
      };
      loadIcons();
  }, [settings.backendUrl]);

  // Load today's water on mount
  useEffect(() => {
      const today = new Date().toISOString().split('T')[0];
      const nutrition = StorageService.getNutritionLogs();
      const todayWaterLogs = nutrition.filter((n: NutritionLog) => n.date === today && n.type === 'WATER');
      const totalWater = todayWaterLogs.reduce((sum: number, n: NutritionLog) => sum + (n.amount || 0), 0);
      setTodayWater(totalWater);
  }, []);

  // Initialize Telegram Mini App
  useEffect(() => {
      const isTgApp = isTelegramWebApp();
      setIsTelegramApp(isTgApp);

      if (isTgApp) {
          initTelegramApp();

          // Auto-login with Telegram user data
          const tgUser = getTelegramUser();
          if (tgUser && !settings.googleId) {
              const tgUserId = getTelegramUserId();
              if (tgUserId) {
                  const newSettings = {
                      ...settings,
                      name: `${tgUser.first_name}${tgUser.last_name ? ' ' + tgUser.last_name : ''}`,
                      avatar: tgUser.photo_url || settings.avatar,
                      telegramId: tgUser.id,
                      googleId: tgUserId, // Use telegramId as the primary identifier
                  };
                  setSettings(newSettings);
                  StorageService.saveSettings(newSettings);
                  setNameInput(newSettings.name);
              }
          }

          // Apply Telegram theme
          const tgTheme = getColorScheme();
          if (tgTheme !== settings.theme) {
              const newSettings = { ...settings, theme: tgTheme };
              setSettings(newSettings);
              StorageService.saveSettings(newSettings);
          }
      }
  }, []);

  // Request runtime permissions on app start (Android)
  useEffect(() => {
      const requestPermissions = async () => {
          try {
              const status = await permissionsService.requestAllPermissions();
              console.log('[App] Permissions status:', status);
          } catch (error) {
              console.error('[App] Failed to request permissions:', error);
          }
      };
      requestPermissions();
  }, []);

  // Initialize Google Auth when in Settings tab
  useEffect(() => {
      if (activeTab === AppTab.SETTINGS && !settings.email) {
          // Initialize native Google Auth on Android
          if (googleAuthService.isNative()) {
              googleAuthService.initialize();
          } else if ((window as any).google) {
              // Web-based Google Sign-In for browser/Telegram
              try {
                  if (googleClientIdInput) {
                      (window as any).google.accounts.id.initialize({
                          client_id: googleClientIdInput,
                          callback: handleGoogleLogin
                      });
                      // Render Google Button
                      const btnParent = document.getElementById("googleSignInBtn");
                      if (btnParent) {
                          (window as any).google.accounts.id.renderButton(
                              btnParent,
                              { theme: "outline", size: "large" }
                          );
                      }
                  }
              } catch(e) {
                  console.error("Google Auth Init Error", e);
              }
          }
      }
  }, [activeTab, settings.email, googleClientIdInput]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Native Google Sign-In (Android)
  const handleNativeGoogleSignIn = async () => {
      setIsLoggingIn(true);
      try {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Sign-in timeout')), 60000)
          );

          const user = await Promise.race([
              googleAuthService.signIn(),
              timeoutPromise
          ]);

          if (!user) {
              alert('Login cancelled or failed. Please try again.');
              return;
          }

          if (user) {
              const localUserId = StorageService.getUserId();

              // If we have an idToken, verify with backend
              if (user.idToken) {
                  const authResult = await ApiService.authenticateWithGoogle(
                      user.idToken,
                      localUserId,
                      settings.backendUrl
                  );

                  if (authResult && authResult.success) {
                      StorageService.setUserId(authResult.userId);
                      StorageService.mergeCloudData({
                          settings: authResult.settings,
                          exercises: authResult.exercises,
                          weights: authResult.weights,
                          nutrition: authResult.nutrition,
                          isPro: authResult.isPro
                      });

                      const newSettings: UserSettings = {
                          ...settings,
                          ...(authResult.settings || {}),
                          email: authResult.email,
                          name: authResult.name || settings.name,
                          avatar: authResult.picture || settings.avatar,
                          googleId: authResult.googleId,
                          isPro: authResult.isPro || settings.isPro
                      };

                      setSettings(newSettings);
                      StorageService.saveSettings(newSettings, false);
                      setNameInput(authResult.name || settings.name);
                      refreshData();
                      alert(t('welcomeBack') + `, ${authResult.name}!`);
                      return;
                  }
              }

              // Fallback: use native user data directly
              const newSettings = {
                  ...settings,
                  email: user.email,
                  name: user.name,
                  avatar: user.imageUrl || settings.avatar,
                  googleId: user.id
              };
              setSettings(newSettings);
              StorageService.saveSettings(newSettings);
              setNameInput(user.name);
              alert(`Welcome, ${user.name}!`);
          }
      } catch (error) {
          console.error("Native Google Sign-In Error:", error);
          alert("Login failed. Please try again.");
      } finally {
          setIsLoggingIn(false);
      }
  };

  // Web Google Sign-In callback (browser/Telegram)
  const handleGoogleLogin = async (response: any) => {
      setIsLoggingIn(true);

      try {
          const idToken = response.credential;
          const localUserId = StorageService.getUserId();

          // Verify token with backend and get/merge user data
          const authResult = await ApiService.authenticateWithGoogle(
              idToken,
              localUserId,
              settings.backendUrl
          );

          if (authResult && authResult.success) {
              // Update user ID to the cloud account ID
              StorageService.setUserId(authResult.userId);

              // Merge any cloud data with local data
              StorageService.mergeCloudData({
                  settings: authResult.settings,
                  exercises: authResult.exercises,
                  weights: authResult.weights,
                  nutrition: authResult.nutrition,
                  isPro: authResult.isPro
              });

              // Update settings with Google info
              const newSettings: UserSettings = {
                  ...settings,
                  ...(authResult.settings || {}),
                  email: authResult.email,
                  name: authResult.name || settings.name,
                  avatar: authResult.picture || settings.avatar,
                  googleId: authResult.googleId,
                  isPro: authResult.isPro || settings.isPro
              };

              setSettings(newSettings);
              StorageService.saveSettings(newSettings, false); // Don't push back immediately
              setNameInput(authResult.name || settings.name);

              // Refresh UI data
              refreshData();

              alert(t('welcomeBack') + `, ${authResult.name}!`);
          } else {
              // Fallback to client-only mode if backend fails
              const payload = parseJwt(idToken);
              if (payload) {
                  const newSettings = {
                      ...settings,
                      email: payload.email,
                      name: payload.name,
                      avatar: payload.picture,
                      googleId: payload.sub
                  };
                  setSettings(newSettings);
                  StorageService.saveSettings(newSettings);
                  setNameInput(payload.name);
                  alert(`Welcome, ${payload.name}! (Offline mode)`);
              }
          }
      } catch (e) {
          console.error("Google Login Error:", e);
          alert("Login failed. Please try again.");
      } finally {
          setIsLoggingIn(false);
      }
  };

  const handleGoogleLogout = async () => {
      StorageService.logout();
      const newSettings = StorageService.getSettings();
      setSettings(newSettings);

      // Sign out from Google
      await googleAuthService.signOut();

      alert(t('loggedOut'));
  };

  // Offline-First Initialization
  useEffect(() => {
      // 1. Load Local Data Immediately
      refreshData();

      // 2. Initialize Timer Service (for background notifications)
      initTimerService().catch(err => {
          console.warn('Timer service initialization failed:', err);
      });

      // 3. Start Background Sync
      const initBackground = async () => {
          try {
              // Check server health first
              const isHealthy = await ApiService.checkHealth(settings.backendUrl);
              setServerOnline(isHealthy);

              if (isHealthy) {
                  const hasUpdates = await StorageService.initializeFromBackend();
                  // If backend had new data, refresh the UI
                  if (hasUpdates) {
                      refreshData();
                  }
              }
          } catch(e) {
              console.error("Background sync error:", e);
              setServerOnline(false);
          }
      };

      initBackground();
  }, []);

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

  const refreshData = () => {
    const s = StorageService.getSettings();
    setSettings(s);
    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
        setNameInput(s.name);
        setAgeInput(s.age.toString());
        setHeightInput(s.height.toString());
        setTargetWeightInput(s.targetWeight.toString());
        setCurrentWeightInput(StorageService.getLastWeight().toString() || '0');
    }
  };

  // Handle app lifecycle (fixes WebView rendering issues on Android/iOS resume)
  useAppLifecycle({
    onResume: () => {
      console.log('[App] Resumed from background');
      refreshData();
    }
  });

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, showGoalSettings, isWorkoutActive]);
  // Note: sessionSteps removed - was causing input reset during typing

  // Debounce Settings Save
  useEffect(() => {
      const timer = setTimeout(() => {
          if (nameInput !== settings.name || 
              parseInt(ageInput) !== settings.age || 
              parseInt(heightInput) !== settings.height ||
              parseFloat(targetWeightInput) !== settings.targetWeight) {
              
              setIsSavingSettings(true);
              const newSettings = { 
                  ...settings, 
                  name: nameInput,
                  age: parseInt(ageInput) || 0,
                  height: parseInt(heightInput) || 170,
                  targetWeight: parseFloat(targetWeightInput) || 0,
              };
              StorageService.saveSettings(newSettings);
              setSettings(newSettings);
              
              setTimeout(() => setIsSavingSettings(false), 800);
          }
      }, 1500);

      return () => clearTimeout(timer);
  }, [nameInput, ageInput, heightInput, targetWeightInput, settings]);

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
      // Haptic feedback for Telegram Mini App
      if (isTelegramApp) {
          hapticFeedback('impact', 'medium');
      }
      // Show exercise picker instead of starting immediately
      setShowExercisePicker(true);
  };

  const startWorkoutWithExercise = (exerciseType: GoalType) => {
      if (isTelegramApp) {
          hapticFeedback('impact', 'light');
      }
      setShowExercisePicker(false);
      // Note: WorkoutSession has its own exercise selection UI,
      // so we don't need to pass the exercise type here.
      // Previously setSelectedGoal was called here which incorrectly
      // opened the statistics modal (GoalDetailsModal).
      setIsWorkoutActive(true);
  };

  const handlePhotoFoodClick = () => {
      if (isTelegramApp) {
          hapticFeedback('impact', 'medium');
      }
      setOpenFoodCameraOnMount(true);
      setActiveTab(AppTab.NUTRITION);
  };

  const handleKitchenClick = () => {
      if (isTelegramApp) {
          hapticFeedback('impact', 'medium');
      }
      setInitialToolSheet('kitchen');
      setActiveTab(AppTab.NUTRITION);
  };

  const handleCookingClick = () => {
      if (isTelegramApp) {
          hapticFeedback('impact', 'medium');
      }
      setInitialToolSheet('recipes');
      setActiveTab(AppTab.NUTRITION);
  };

  // handleMockUpgrade removed - using billing system instead

  const addWater = (amount: number) => {
      if (isTelegramApp) {
          hapticFeedback('impact', 'light');
      }
      const log: NutritionLog = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now(),
          type: 'WATER',
          name: `+${amount}ml`,
          calories: 0,
          amount: amount
      };
      StorageService.saveNutrition(log);
      setTodayWater(prev => prev + amount);
  };

  const getIconForType = (type: GoalType, size: number = 16) => {
      // Check for Custom Icon first
      if (customIcons[type]) {
          return <img src={customIcons[type]} alt={type} className="w-4 h-4 object-contain" />;
      }

      // Default Fallback
      switch(type) {
          case 'STEPS': return <Footprints size={size} className="text-emerald-500"/>;
          case 'CALORIES': return <Flame size={size} className="text-orange-500"/>;
          case 'WATER': return <Droplets size={size} className="text-sky-500"/>;
          case 'SQUATS': return <ArrowDown size={size} className="text-purple-500"/>;
          case 'PUSHUPS': return <Activity size={size} className="text-blue-500"/>;
          case 'SITUPS': return <Move size={size} className="text-orange-500"/>;
          case 'DIPS': return <ArrowDown size={size} className="text-cyan-500"/>;
          case 'PULLUPS': return <ArrowUp size={size} className="text-violet-500"/>;
          case 'PLANK': return <Activity size={size} className="text-amber-500"/>;
          case 'MOUNTAIN_CLIMBERS': return <ArrowUp size={size} className="text-red-500"/>;
          case 'CRUNCHES': return <Move size={size} className="text-pink-500"/>;
          case 'LEG_RAISES': return <ArrowUp size={size} className="text-indigo-500"/>;
          case 'BICYCLE_CRUNCHES': return <Activity size={size} className="text-teal-500"/>;
          case 'HIGH_KNEES': return <Footprints size={size} className="text-rose-500"/>;
          case 'JUMPING_JACKS': return <Activity size={size} className="text-yellow-500"/>;
          case 'LUNGES': return <ArrowDown size={size} className="text-lime-500"/>;
          case 'BURPEES': return <Dumbbell size={size} className="text-fuchsia-500"/>;
          default: return <Dumbbell size={size} className="text-gray-400"/>;
      }
  };

  const getLabelForType = (type: GoalType): string => {
    switch(type) {
        case 'STEPS': return t('steps');
        case 'CALORIES': return t('calories');
        case 'WATER': return t('water');
        case 'PUSHUPS': return t('pushups');
        case 'SQUATS': return t('squats');
        case 'SITUPS': return t('situps');
        case 'JUMPING_JACKS': return t('jumpingJacks');
        case 'LUNGES': return t('lunges');
        case 'BURPEES': return t('burpees');
        case 'DIPS': return t('dips');
        case 'PULLUPS': return t('pullups');
        case 'PLANK': return t('plank');
        case 'MOUNTAIN_CLIMBERS': return t('mountainClimbers');
        case 'CRUNCHES': return t('crunches');
        case 'LEG_RAISES': return t('legRaises');
        case 'BICYCLE_CRUNCHES': return t('bicycleCrunches');
        case 'HIGH_KNEES': return t('highKnees');
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

  return (
    <BillingProvider>
    <div className="h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <UpdateBanner />

      {/* Main Content Area - header scrolls with content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header - part of scrollable content */}
        <header className="px-6 pt-8 pb-4">
          <div className="flex justify-between items-center mb-4">
              <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                      FitStream
                      {settings.isPro && <span className="bg-yellow-500 text-black text-[9px] font-bold px-1 py-0.5 rounded uppercase flex items-center gap-0.5"><Crown size={8} fill="black"/> PRO</span>}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('aiTracking')}</p>
              </div>
              <BalanceMini onTopUp={() => setShowTopUpModal(true)} />
          </div>
        </header>
        {activeTab === AppTab.DASHBOARD && (
          <div className="px-4 space-y-8 pb-4">

            {/* Trial Banner */}
            <TrialBanner onTopUp={() => setShowTopUpModal(true)} />

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
                
                {/* Horizontal scrollable goals slider */}
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                    {enabledGoals.map((goal) => (
                        <div
                            key={goal.type}
                            onClick={() => setSelectedGoal(goal)}
                            className="flex-shrink-0 w-[100px] bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-2 flex flex-col items-center justify-center relative shadow-lg cursor-pointer hover:scale-[1.02] transition-transform snap-start"
                        >
                             <div className="absolute top-2 left-2">
                                 {getIconForType(goal.type)}
                             </div>
                             <AchievementRing
                                radius={32}
                                stroke={4}
                                progress={goal.current}
                                total={goal.target}
                                color={goal.color}
                                label=" "
                                compact={true}
                            />
                            <div className="mt-1 text-center">
                                <span className="block text-[10px] font-bold text-gray-800 dark:text-white truncate w-full">{getLabelForType(goal.type)}</span>
                                <span className="block text-[9px] text-gray-500 dark:text-gray-400">{goal.current}/{goal.target}</span>
                            </div>
                        </div>
                    ))}
                    {/* Add goal button */}
                    <div
                        onClick={() => setShowGoalSettings(true)}
                        className="flex-shrink-0 w-[100px] bg-gray-100 dark:bg-gray-900/30 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-2 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition snap-start"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                            <span className="text-2xl text-gray-400 dark:text-gray-500">+</span>
                        </div>
                        <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">{t('addGoal') || 'Добавить'}</span>
                    </div>
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
                    onClick={handlePhotoFoodClick}
                    className="bg-gradient-to-br from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white p-5 rounded-2xl shadow-xl shadow-orange-500/20 dark:shadow-orange-900/20 flex flex-col items-center justify-center gap-2 transition transform active:scale-95"
                >
                    <div className="flex items-center gap-2">
                        <Utensils size={24} />
                        <Camera size={24} />
                    </div>
                    <span className="font-bold">{t('photoFood')}</span>
                </button>
            </div>

            {/* Quick Water Buttons */}
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-2 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1.5 px-2">
                    <Droplets size={16} className="text-blue-500" />
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{todayWater}/2000</span>
                </div>
                <div className="flex-1 flex gap-1.5">
                    <button onClick={() => addWater(150)} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-1.5 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1">
                        <GlassWater size={12} />+150
                    </button>
                    <button onClick={() => addWater(250)} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-1.5 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1">
                        <Coffee size={12} />+250
                    </button>
                    <button onClick={() => addWater(500)} className="flex-1 bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold py-1.5 px-2 rounded-lg transition active:scale-95 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1">
                        <Milk size={12} />+500
                    </button>
                </div>
            </div>

            {/* Kitchen & Cooking Quick Access */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={handleKitchenClick}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-lg transition active:scale-[0.98]"
                >
                    <div className="w-14 h-14 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        {/* Refrigerator Icon */}
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600 dark:text-cyan-400">
                            <rect x="5" y="2" width="14" height="20" rx="2" />
                            <line x1="5" y1="9" x2="19" y2="9" />
                            <line x1="15" y1="5" x2="15" y2="7" />
                            <line x1="15" y1="12" x2="15" y2="16" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <span className="font-bold text-gray-900 dark:text-white">{t('kitchen')}</span>
                        <p className="text-xs text-gray-500">{t('inventory')}</p>
                    </div>
                </button>
                <button
                    onClick={handleCookingClick}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-3 shadow-sm hover:shadow-lg transition active:scale-[0.98]"
                >
                    <div className="w-14 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        {/* Pot and Pan Icon */}
                        <svg width="36" height="32" viewBox="0 0 36 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600 dark:text-orange-400">
                            {/* Pot */}
                            <path d="M4 10h10v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8z" />
                            <line x1="4" y1="10" x2="2" y2="10" />
                            <line x1="14" y1="10" x2="16" y2="10" />
                            <path d="M6 10V8a3 3 0 016 0v2" />
                            {/* Pan */}
                            <ellipse cx="25" cy="16" rx="6" ry="3" />
                            <line x1="31" y1="15" x2="36" y2="14" />
                        </svg>
                    </div>
                    <div className="text-center">
                        <span className="font-bold text-gray-900 dark:text-white">{t('whatToCook')}</span>
                        <p className="text-xs text-gray-500">{t('recipesAndTips')}</p>
                    </div>
                </button>
            </div>

            {/* Billing Status Banner */}
            <BillingBanner onTopUp={() => setShowTopUpModal(true)} variant="dashboard" />

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

        {activeTab === AppTab.NUTRITION && (
            <NutritionTracker
                onRequestPro={() => setShowTopUpModal(true)}
                openCameraOnMount={openFoodCameraOnMount}
                onCameraOpened={() => setOpenFoodCameraOnMount(false)}
                initialToolSheet={initialToolSheet}
            />
        )}

        {activeTab === AppTab.SHOPPING && <ShoppingAssistant onRequestPro={() => setShowTopUpModal(true)} />}

        {activeTab === AppTab.SOCIAL && (
            <div className="px-4 space-y-4 pb-4">
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
                            <img 
                                src={settings.avatar} 
                                alt="You" 
                                className={`w-12 h-12 rounded-full border-2 ${settings.isPro ? 'border-yellow-400' : 'border-blue-500'}`} 
                            />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">{settings.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{settings.streak} day streak</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-gray-900 dark:text-white">-</p>
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
            <div className="px-4 space-y-6 pb-4">
                
                {/* Avatar & Name */}
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

                {/* Billing Status Banner */}
                <BillingBanner onTopUp={() => setShowTopUpModal(true)} variant="settings" />

                {/* Account Section - Hide in Telegram Mini App */}
                {!isTelegramApp && (
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    {!settings.email && !settings.googleId ? (
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-gray-900 dark:text-white font-bold text-sm">{t('account')}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">{t('syncProgress')}</p>
                            </div>
                            <button
                                onClick={async () => {
                                    console.log('[Auth] Sign-in clicked, isNative:', googleAuthService.isNative());
                                    if (googleAuthService.isNative()) {
                                        handleNativeGoogleSignIn();
                                    } else if ((window as any).google?.accounts?.id) {
                                        (window as any).google.accounts.id.prompt();
                                    } else {
                                        // Fallback: try native anyway (WebView in APK)
                                        console.log('[Auth] Fallback to native sign-in');
                                        handleNativeGoogleSignIn();
                                    }
                                }}
                                disabled={isLoggingIn}
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                            >
                                {isLoggingIn ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    t('signIn')
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {settings.avatar ? (
                                    <img src={settings.avatar} className="w-12 h-12 rounded-xl object-cover ring-2 ring-green-500/50" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/25">
                                        {settings.name[0]}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{settings.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{settings.email || 'Google'}</p>
                            </div>
                            <button onClick={handleGoogleLogout} className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-lg transition">
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
                )}
                
                {/* Telegram Link */}
                {settings.googleId && (
                    <TelegramLinkButton
                        userId={settings.googleId}
                        backendUrl={settings.backendUrl}
                    />
                )}

                {/* Support / Feedback */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                <MessageCircle size={20} className="text-white" />
                            </div>
                            <div>
                                <h4 className="text-gray-900 dark:text-white font-bold text-sm">{t('support')}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">{t('supportDesc')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const botUrl = 'https://t.me/fitstreambot';
                                if (isTelegramWebApp()) {
                                    openTelegramLink(botUrl);
                                } else {
                                    window.open(botUrl, '_blank');
                                }
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                        >
                            <Send size={14} /> {t('contactUs')}
                        </button>
                    </div>
                </div>

                {/* Coach Settings */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                            <Volume2 size={16} className="text-blue-500" /> AI Coach
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

                {/* Bio Data */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                            <Users size={16} className="text-purple-500" /> {t('bioData')}
                        </h4>
                        <SaveIndicator saving={isSavingSettings} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('yourName')}</span>
                            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('age')}</span>
                            <input type="number" value={ageInput} onChange={(e) => setAgeInput(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('height')}</span>
                            <input type="number" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('gender')}</span>
                            <select value={settings.gender} onChange={(e) => updateGender(e.target.value as Gender)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none">
                                <option value="MALE">{t('male')}</option>
                                <option value="FEMALE">{t('female')}</option>
                                <option value="OTHER">{t('other')}</option>
                            </select>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mt-4">
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('activityLevel')}</span>
                            <select value={settings.activityLevel} onChange={(e) => updateActivity(e.target.value as ActivityLevel)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-blue-500 outline-none">
                                <option value="SEDENTARY">{t('sedentary')}</option>
                                <option value="LIGHT">{t('light')}</option>
                                <option value="MODERATE">{t('moderate')}</option>
                                <option value="VERY_ACTIVE">{t('very_active')}</option>
                            </select>
                        </label>
                    </div>
                </div>

                {/* Nutrition & Weight */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h4 className="text-gray-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                        <Ruler size={16} className="text-green-500" /> {t('nutrition')} & {t('weight')}
                    </h4>
                    
                    <div className="mb-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{t('referenceObject')}</span>
                        <div className="bg-gray-50 dark:bg-gray-950 p-3 rounded-lg mt-1 border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {settings.referenceObject || t('notSet')}
                                    </p>
                                    {settings.referenceDimensions && <p className="text-xs text-gray-500">{settings.referenceDimensions}</p>}
                                </div>
                                <button 
                                    onClick={() => setShowRefScanner(true)}
                                    className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                                >
                                    <Camera size={14} /> {settings.referenceObject ? t('update') : t('set')}
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{t('referenceDesc')}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('currentWeight')}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <input type="number" value={currentWeightInput} onChange={(e) => setCurrentWeightInput(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:border-emerald-500 outline-none" />
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
                            <input type="number" value={targetWeightInput} onChange={(e) => setTargetWeightInput(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mt-1 text-sm focus:border-purple-500 outline-none" />
                        </label>
                        <label className="block">
                            <span className="text-gray-500 dark:text-gray-400 text-xs">{t('weightGoal') || 'Цель'}</span>
                            <div className="flex gap-2 mt-1">
                                {(['LOSE', 'MAINTAIN', 'GAIN'] as WeightGoal[]).map((goal) => (
                                    <button
                                        key={goal}
                                        onClick={() => {
                                            const updated = { ...settings, weightGoal: goal };
                                            setSettings(updated);
                                            StorageService.saveSettings(updated);
                                        }}
                                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                                            settings.weightGoal === goal
                                                ? goal === 'LOSE' ? 'bg-red-500 text-white' : goal === 'GAIN' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {goal === 'LOSE' ? (t('goalLose') || 'Похудеть') : goal === 'GAIN' ? (t('goalGain') || 'Набрать') : (t('goalMaintain') || 'Поддержать')}
                                    </button>
                                ))}
                            </div>
                        </label>
                    </div>
                </div>

                {/* Theme */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {settings.theme === 'dark' ? <Moon size={20} className="text-purple-400" /> : <Sun size={20} className="text-orange-500" />}
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t('theme')}</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition ${settings.theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-orange-100 text-orange-600 border border-orange-200'}`}
                    >
                        {settings.theme === 'dark' ? t('darkMode') : t('lightMode')}
                    </button>
                </div>

                {/* Language Selection */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Globe size={20} className="text-blue-500" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{t('languageSelection')}</span>
                        </div>
                        <select
                            value={getSavedLanguage()}
                            onChange={(e) => {
                                setLanguage(e.target.value);
                                const updated = { ...settings, language: e.target.value };
                                setSettings(updated);
                                StorageService.saveSettings(updated);
                                window.location.reload();
                            }}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                            {getLanguageList().map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.flag} {t(lang.label)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Currency Selection */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Coins size={20} className="text-green-500" />
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{t('currency') || 'Валюта'}</span>
                        </div>
                        <select
                            value={settings.currency || 'RUB'}
                            onChange={(e) => {
                                const updated = { ...settings, currency: e.target.value as CurrencyCode };
                                setSettings(updated);
                                StorageService.saveSettings(updated);
                            }}
                            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none"
                        >
                            {getCurrencyList().map((curr) => (
                                <option key={curr.code} value={curr.code}>
                                    {curr.flag} {curr.symbol} {curr.code}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Device Connections (Scales, Health Connect, Watches) */}
                <DeviceSettings settings={settings} onUpdate={refreshData} />

                {/* App Version */}
                <div className="text-center py-4 text-gray-400 dark:text-gray-600 text-xs">
                    <p>FitStream v{APP_VERSION} {BUILD_CONFIG.isAdminBuild && <span className="text-yellow-500">(Admin)</span>}</p>
                    <p className="text-[10px] mt-1">build {BUILD_CODE} • {BUILD_DATE}</p>
                </div>
            </div>
        )}
      </main>

      {/* Bottom Navigation - part of flex layout, always at bottom */}
      <nav className="shrink-0 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-900 px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex justify-between items-end z-40 transition-colors duration-300">
        <button onClick={() => setActiveTab(AppTab.DASHBOARD)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.DASHBOARD ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-medium">{t('dashboard')}</span>
        </button>
        {/* Workout Button */}
        <button onClick={() => setIsWorkoutActive(true)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.WORKOUT ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <Dumbbell size={20} />
          <span className="text-[10px] font-medium">{t('workout')}</span>
        </button>

        {/* Main Nutrition Button - выделенная */}
        <button onClick={() => setActiveTab(AppTab.NUTRITION)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.NUTRITION ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}>
            <div className="bg-orange-500 text-white p-3 rounded-full -mt-8 shadow-lg shadow-orange-500/30 dark:shadow-orange-900/50 hover:bg-orange-400 transition border-4 border-white dark:border-slate-950">
                <Utensils size={24} />
            </div>
            <span className="text-[10px] font-medium">{t('nutrition')}</span>
        </button>

        {/* Shopping Button */}
        <button onClick={() => setActiveTab(AppTab.SHOPPING)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.SHOPPING ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
          <ShoppingCart size={20} />
          <span className="text-[10px] font-medium">{t('shopping')}</span>
        </button>

        <button onClick={() => setActiveTab(AppTab.SETTINGS)} className={`flex flex-col items-center gap-1 flex-1 ${activeTab === AppTab.SETTINGS ? 'text-blue-600' : 'text-gray-400 dark:text-gray-500'}`}>
          <Settings size={20} />
          <span className="text-[10px] font-medium">{t('settings')}</span>
        </button>
      </nav>

      {isWorkoutActive && (
        <WorkoutSession onFinish={() => {
            setIsWorkoutActive(false);
            refreshData();
        }} />
      )}

      {selectedGoal && (
          <GoalDetailsModal 
            goal={selectedGoal} 
            label={getLabelForType(selectedGoal.type)}
            onClose={() => setSelectedGoal(null)} 
          />
      )}

      {/* Phone Weight Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl animate-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Smartphone size={18} className="text-blue-500"/> {t('phoneModelPrompt')}
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

      {/* Quick Scan Overlay */}
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
                  <div className="w-full h-full flex items-center justify-center" ref={(el) => {
                      if (el && quickScanVideoRef) {
                          el.innerHTML = ''; // Clear previous
                          quickScanVideoRef.className = "w-full h-full object-cover";
                          el.appendChild(quickScanVideoRef);
                      }
                  }}></div>
                  <canvas ref={quickScanCanvasRef} className="hidden" />
                  
                  {/* HUD */}
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
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-32 border-2 border-emerald-500/50 border-dashed rounded-lg flex items-center justify-center">
                                <span className="bg-black/40 text-white text-xs px-2 py-1 rounded backdrop-blur">{t('scanScale')}</span>
                            </div>
                        </div>
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-auto">
                            <button 
                                onClick={captureQuickScan}
                                disabled={isQuickScanning}
                                className="bg-white text-black p-5 rounded-full shadow-lg hover:bg-gray-200 transition transform active:scale-95"
                            >
                                {isQuickScanning ? <Loader2 className="animate-spin"/> : <Camera size={28} />}
                            </button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      )}

      {showRefScanner && (
          <ReferenceObjectScanner 
            onClose={() => setShowRefScanner(false)}
            onSave={updateReferenceObject}
          />
      )}

      {/* ProUpgradeModal removed - using TopUpModal instead */}

      {showGoalSettings && (
          <GoalSettings 
            onClose={() => setShowGoalSettings(false)}
            onUpdate={refreshData}
          />
      )}

      {showAvatarSelector && (
          <AvatarSelector
            currentAvatar={settings.avatar}
            onClose={() => setShowAvatarSelector(false)}
            onSelect={updateAvatar}
          />
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('selectExercise')}</h2>
                      <button
                          onClick={() => setShowExercisePicker(false)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                      >
                          <X size={20} className="text-gray-500"/>
                      </button>
                  </div>

                  {/* Exercise Grid */}
                  <div className="p-4 overflow-y-auto max-h-[70vh]">
                      <div className="grid grid-cols-3 gap-3">
                          {(['PUSHUPS', 'SQUATS', 'SITUPS', 'PULLUPS', 'DIPS', 'LUNGES', 'BURPEES', 'JUMPING_JACKS', 'PLANK', 'CRUNCHES', 'LEG_RAISES', 'MOUNTAIN_CLIMBERS', 'BICYCLE_CRUNCHES', 'HIGH_KNEES', 'STEPS'] as GoalType[]).map((type) => (
                              <button
                                  key={type}
                                  onClick={() => startWorkoutWithExercise(type)}
                                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition transform active:scale-95 gap-2"
                              >
                                  <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow">
                                      {getIconForType(type, 20)}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                                      {getLabelForType(type)}
                                  </span>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Top Up Modal */}
      <TopUpModal isOpen={showTopUpModal} onClose={() => setShowTopUpModal(false)} />
    </div>
    </BillingProvider>
  );
};

export default App;
