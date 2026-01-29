

export interface ExerciseLog {
  id: string;
  date: string;
  timestamp: number;
  exerciseName: string;
  reps: number;
  feedback: string;
}

export interface BodyComposition {
  bodyFat?: number;        // Body fat percentage
  muscleMass?: number;     // Muscle mass in kg
  boneMass?: number;       // Bone mass in kg
  waterPercent?: number;   // Body water percentage
  visceralFat?: number;    // Visceral fat level (1-59)
  bmi?: number;            // Body Mass Index
  bmr?: number;            // Basal Metabolic Rate (kcal)
  metabolicAge?: number;   // Metabolic age in years
  proteinPercent?: number; // Protein percentage
  lbm?: number;            // Lean Body Mass in kg
  impedance?: number;      // Raw impedance value from scale
}

export interface WeightLog {
  id: string;
  date: string;
  timestamp: number;
  weight: number;
  photoUrl?: string;
  photoId?: string; // Reference to IndexedDB stored photo
  pendingAiAnalysis?: boolean; // Needs AI processing when online
  manualEntry?: boolean; // Was entered manually
  source?: 'manual' | 'ai_scan' | 'smart_scale'; // How the weight was recorded
  bodyComposition?: BodyComposition; // Body composition from smart scale
}

export interface SmartScaleDevice {
  id: string;
  name: string;
  type: 'xiaomi_v1' | 'xiaomi_v2' | 'unknown';
  connected: boolean;
  lastSeen?: number;
}

export interface NutritionLog {
    id: string;
    date: string;
    timestamp: number;
    type: 'FOOD' | 'WATER';
    name: string; // "Apple", "Glass of Water"
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    amount?: number; // volume in ml for water
    photoId?: string; // Reference to IndexedDB stored photo
    pendingAiAnalysis?: boolean; // Needs AI processing when online
    manualEntry?: boolean; // Was entered manually
}

// Pending item for sync queue
export interface PendingItem {
    id: string;
    type: 'NUTRITION' | 'WEIGHT' | 'EXERCISE';
    data: NutritionLog | WeightLog | ExerciseLog;
    photoId?: string;
    createdAt: number;
    retryCount: number;
    needsAiAnalysis: boolean;
}

export type GoalType = 'STEPS' | 'PUSHUPS' | 'SQUATS' | 'SITUPS' | 'JUMPING_JACKS' | 'LUNGES' | 'BURPEES' | 'DIPS' | 'PULLUPS';

export interface DailyGoal {
  type: GoalType;
  target: number;
  current: number;
  isEnabled: boolean;
  unit: string;
  color: string;
}

export interface ConnectedPlatforms {
  googleFit: boolean;
  appleHealth: boolean;
  lastSync: string | null;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE';

export interface UserSettings {
  name: string;
  email?: string; // Added for Google Auth
  googleId?: string; // Added for Google Auth
  telegramId?: number; // Added for Telegram Mini App
  avatar: string;
  age: number;
  height: number; // in cm
  gender: Gender;
  activityLevel: ActivityLevel;
  installDate: string; // For tracking free trial
  referenceObject: string; // e.g., "AirPods Case", "Credit Card"
  referenceDimensions?: string; // e.g., "8.5 x 5.4 cm"
  phoneModel: string;
  phoneWeight?: number; // Weight of the phone in kg
  goals: DailyGoal[];
  targetWeight: number;
  streak: number;
  lastActiveDate: string;
  theme: 'light' | 'dark';
  connectedPlatforms: ConnectedPlatforms;
  isPro: boolean;
  backendUrl?: string;
  coachVoice: string; // 'Fenrir' | 'Kore' etc.
}

export interface Friend {
  id: string;
  name: string;
  score: number;
  avatar: string;
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  WORKOUT = 'WORKOUT',
  NUTRITION = 'NUTRITION',
  WEIGHT = 'WEIGHT',
  SOCIAL = 'SOCIAL',
  SETTINGS = 'SETTINGS'
}