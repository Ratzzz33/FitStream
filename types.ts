
export interface ExerciseLog {
  id: string;
  date: string;
  timestamp: number;
  exerciseName: string;
  reps: number;
  feedback: string;
}

export interface WeightLog {
  id: string;
  date: string;
  timestamp: number;
  weight: number;
  photoUrl?: string;
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
}

export type GoalType = 'STEPS' | 'PUSHUPS' | 'SQUATS' | 'SITUPS' | 'JUMPING_JACKS' | 'LUNGES' | 'BURPEES';

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