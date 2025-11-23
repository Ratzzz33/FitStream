
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

export interface UserSettings {
  name: string;
  avatar: string;
  age: number;
  phoneModel: string;
  goals: DailyGoal[];
  targetWeight: number;
  streak: number;
  lastActiveDate: string;
  theme: 'light' | 'dark';
  connectedPlatforms: ConnectedPlatforms;
  isPro: boolean;
  backendUrl?: string; // New field for dynamic backend configuration
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
  WEIGHT = 'WEIGHT',
  SOCIAL = 'SOCIAL',
  SETTINGS = 'SETTINGS'
}
