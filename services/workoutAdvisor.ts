/**
 * WorkoutAdvisor - Smart workout recommendation system
 *
 * Designed for office workers and people with sedentary lifestyle.
 * Learns from user's workout history and provides balanced recommendations.
 */

import { TrackableExercise } from './poseTracker';

// Muscle groups for balanced training
export type MuscleGroup =
  | 'shoulders'    // Плечи
  | 'chest'        // Грудь
  | 'back'         // Спина
  | 'arms'         // Руки
  | 'core'         // Пресс/кор
  | 'legs'         // Ноги
  | 'glutes'       // Ягодицы
  | 'cardio'       // Кардио
  | 'flexibility'; // Гибкость/растяжка

// Simple office exercises (no camera tracking, just text instructions)
export type SimpleExercise =
  | 'NECK_ROLLS'           // Вращение шеей
  | 'SHOULDER_ROLLS'       // Вращение плечами
  | 'WRIST_CIRCLES'        // Круги запястьями
  | 'SEATED_TWIST'         // Повороты корпуса сидя
  | 'ARM_STRETCHES'        // Потягивание рук вверх
  | 'ANKLE_CIRCLES'        // Круги стопами
  | 'SHOULDER_SHRUGS'      // Подъём плеч
  | 'CHIN_TUCKS'           // Втягивание подбородка
  | 'DESK_PUSHUPS'         // Отжимания от стола
  | 'SEATED_LEG_RAISES'    // Подъём ног сидя
  | 'STANDING_STRETCH';    // Потягивание стоя

// Simple exercise definitions with instructions
export const SIMPLE_EXERCISE_INFO: Record<SimpleExercise, {
  name: string;
  instruction: string;
  duration: number; // seconds
  muscleGroups: MuscleGroup[];
}> = {
  NECK_ROLLS: {
    name: 'Вращение шеей',
    instruction: 'Медленно вращай головой по кругу: 5 раз в каждую сторону',
    duration: 30,
    muscleGroups: ['flexibility']
  },
  SHOULDER_ROLLS: {
    name: 'Вращение плечами',
    instruction: 'Подними плечи к ушам и вращай назад, затем вперёд',
    duration: 20,
    muscleGroups: ['shoulders', 'flexibility']
  },
  WRIST_CIRCLES: {
    name: 'Разминка запястий',
    instruction: 'Вращай запястьями в обе стороны, затем потряси кистями',
    duration: 20,
    muscleGroups: ['arms', 'flexibility']
  },
  SEATED_TWIST: {
    name: 'Повороты корпуса',
    instruction: 'Сидя, поверни корпус влево, задержись, затем вправо',
    duration: 30,
    muscleGroups: ['core', 'back', 'flexibility']
  },
  ARM_STRETCHES: {
    name: 'Потягивание рук',
    instruction: 'Сцепи руки и потянись вверх, затем в стороны',
    duration: 20,
    muscleGroups: ['shoulders', 'arms', 'flexibility']
  },
  ANKLE_CIRCLES: {
    name: 'Разминка стоп',
    instruction: 'Приподними ногу и вращай стопой в обе стороны',
    duration: 20,
    muscleGroups: ['legs', 'flexibility']
  },
  SHOULDER_SHRUGS: {
    name: 'Подъём плеч',
    instruction: 'Подними плечи к ушам, задержи на 3 сек, резко опусти',
    duration: 20,
    muscleGroups: ['shoulders']
  },
  CHIN_TUCKS: {
    name: 'Втягивание подбородка',
    instruction: 'Втяни подбородок назад, создавая "двойной подбородок", задержи',
    duration: 20,
    muscleGroups: ['flexibility']
  },
  DESK_PUSHUPS: {
    name: 'Отжимания от стола',
    instruction: 'Упрись руками в край стола и сделай отжимания',
    duration: 30,
    muscleGroups: ['chest', 'arms', 'shoulders']
  },
  SEATED_LEG_RAISES: {
    name: 'Подъём ног сидя',
    instruction: 'Сидя на стуле, выпрями ногу параллельно полу, задержи',
    duration: 30,
    muscleGroups: ['legs', 'core']
  },
  STANDING_STRETCH: {
    name: 'Потягивание стоя',
    instruction: 'Встань, потянись руками вверх, затем наклонись к носкам',
    duration: 20,
    muscleGroups: ['flexibility', 'back']
  }
};

// Session types
export type SessionType =
  | 'morning_warmup'    // Утренняя разминка (5-7 мин)
  | 'office_break'      // Офисная пауза (3-5 мин)
  | 'full_workout'      // Полная тренировка (15-20 мин)
  | 'evening_stretch'   // Вечерняя растяжка (5-10 мин)
  | 'quick_energy';     // Быстрый заряд энергии (5 мин)

// Difficulty feedback
export type DifficultyFeedback = 'easy' | 'normal' | 'hard';

// Exercise record in history
export interface ExerciseRecord {
  exercise: TrackableExercise;
  reps: number;
  duration: number; // seconds
  formScore: number;
  difficulty: DifficultyFeedback;
  timestamp: number;
}

// Daily workout summary
export interface DailyWorkout {
  date: string; // YYYY-MM-DD
  exercises: ExerciseRecord[];
  totalTime: number;
  muscleGroupsWorked: MuscleGroup[];
  includesWarmup: boolean;
  includesStretch: boolean;
  overallDifficulty?: DifficultyFeedback;
}

// User fitness profile (learned over time)
export interface FitnessProfile {
  baseReps: Partial<Record<TrackableExercise, number>>;
  level: 'beginner' | 'developing' | 'consistent';
  daysSinceStretch: number;
  daysSinceCardio: number;
  daysSinceUpperBody: number;
  daysSinceLowerBody: number;
  daysSinceCore: number;
  totalWorkouts: number;
  currentStreak: number;
  longestStreak: number;
}

// Workout recommendation
export interface WorkoutRecommendation {
  sessionType: SessionType;
  title: string;
  description: string;
  duration: number;
  exercises: RecommendedExercise[];
  includeWarmup: boolean;
  includeStretch: boolean;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RecommendedExercise {
  exercise: TrackableExercise;
  reps: number;
  duration?: number;
  note?: string;
}

// Office exercise can be either camera-tracked or simple text instruction
export interface OfficeExercise {
  type: 'simple';
  exercise: SimpleExercise;
  note?: string;
}

export type OfficeBreakExercise = RecommendedExercise | OfficeExercise;

// Extended recommendation for office breaks
export interface OfficeBreakRecommendation extends Omit<WorkoutRecommendation, 'exercises'> {
  exercises: OfficeBreakExercise[];
}

// Mapping exercises to muscle groups
const EXERCISE_MUSCLE_GROUPS: Record<TrackableExercise, MuscleGroup[]> = {
  SQUATS: ['legs', 'glutes', 'core'],
  PUSHUPS: ['chest', 'shoulders', 'arms', 'core'],
  SITUPS: ['core'],
  JUMPING_JACKS: ['cardio', 'shoulders', 'legs'],
  LUNGES: ['legs', 'glutes', 'core'],
  PLANK: ['core', 'shoulders'],
  BURPEES: ['cardio', 'chest', 'legs', 'core'],
  HIGH_KNEES: ['cardio', 'legs', 'core'],
  MOUNTAIN_CLIMBERS: ['cardio', 'core', 'shoulders'],
  LEG_RAISES: ['core', 'legs'],
  GLUTE_BRIDGES: ['glutes', 'core', 'back'],
  CALF_RAISES: ['legs'],
  WALL_SIT: ['legs', 'core'],
  SIDE_LUNGES: ['legs', 'glutes'],
  TRICEP_DIPS: ['arms', 'shoulders']
};

// Truly discreet office exercises - can do at desk without drawing attention
const DESK_EXERCISES: SimpleExercise[] = [
  'NECK_ROLLS', 'SHOULDER_ROLLS', 'WRIST_CIRCLES',
  'SEATED_TWIST', 'SHOULDER_SHRUGS', 'CHIN_TUCKS',
  'ANKLE_CIRCLES', 'SEATED_LEG_RAISES'
];

// Standing office exercises - need to stand but still discreet
const STANDING_OFFICE_EXERCISES: SimpleExercise[] = [
  'ARM_STRETCHES', 'STANDING_STRETCH', 'DESK_PUSHUPS'
];

// Camera-tracked exercises that ARE actually quiet (no floor, no jumping)
const QUIET_TRACKABLE: TrackableExercise[] = [
  'CALF_RAISES', 'SQUATS'
];

// Warmup exercises
const WARMUP_EXERCISES: TrackableExercise[] = [
  'JUMPING_JACKS', 'HIGH_KNEES', 'SQUATS'
];

// Stretch/flexibility exercises
const STRETCH_EXERCISES: TrackableExercise[] = [
  'LUNGES', 'GLUTE_BRIDGES', 'SIDE_LUNGES'
];

// Default base reps for beginners
const DEFAULT_BASE_REPS: Record<TrackableExercise, number> = {
  SQUATS: 10,
  PUSHUPS: 5,
  SITUPS: 10,
  JUMPING_JACKS: 15,
  LUNGES: 8,
  PLANK: 20,
  BURPEES: 5,
  HIGH_KNEES: 20,
  MOUNTAIN_CLIMBERS: 10,
  LEG_RAISES: 8,
  GLUTE_BRIDGES: 10,
  CALF_RAISES: 15,
  WALL_SIT: 20,
  SIDE_LUNGES: 8,
  TRICEP_DIPS: 8
};

// Russian names for session types
export const SESSION_TYPE_NAMES: Record<SessionType, string> = {
  morning_warmup: 'Утренняя разминка',
  office_break: 'Офисная пауза',
  full_workout: 'Полная тренировка',
  evening_stretch: 'Вечерняя растяжка',
  quick_energy: 'Быстрый заряд'
};

const STORAGE_KEY = 'fitstream_workout_history';
const PROFILE_KEY = 'fitstream_fitness_profile';

export class WorkoutAdvisor {
  private history: DailyWorkout[] = [];
  private profile: FitnessProfile;

  constructor() {
    this.loadHistory();
    this.profile = this.loadProfile();
    this.updateProfileStats();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load workout history:', e);
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.error('Failed to save workout history:', e);
    }
  }

  private loadProfile(): FitnessProfile {
    try {
      const stored = localStorage.getItem(PROFILE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load fitness profile:', e);
    }

    return {
      baseReps: { ...DEFAULT_BASE_REPS },
      level: 'beginner',
      daysSinceStretch: 999,
      daysSinceCardio: 999,
      daysSinceUpperBody: 999,
      daysSinceLowerBody: 999,
      daysSinceCore: 999,
      totalWorkouts: 0,
      currentStreak: 0,
      longestStreak: 0
    };
  }

  private saveProfile(): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.error('Failed to save fitness profile:', e);
    }
  }

  recordExercise(record: ExerciseRecord): void {
    const today = this.getToday();
    let todayWorkout = this.history.find(w => w.date === today);

    if (!todayWorkout) {
      todayWorkout = {
        date: today,
        exercises: [],
        totalTime: 0,
        muscleGroupsWorked: [],
        includesWarmup: false,
        includesStretch: false
      };
      this.history.push(todayWorkout);
    }

    todayWorkout.exercises.push(record);
    todayWorkout.totalTime += record.duration;

    const muscleGroups = EXERCISE_MUSCLE_GROUPS[record.exercise] || [];
    for (const mg of muscleGroups) {
      if (!todayWorkout.muscleGroupsWorked.includes(mg)) {
        todayWorkout.muscleGroupsWorked.push(mg);
      }
    }

    if (WARMUP_EXERCISES.includes(record.exercise)) {
      todayWorkout.includesWarmup = true;
    }
    if (STRETCH_EXERCISES.includes(record.exercise)) {
      todayWorkout.includesStretch = true;
    }

    this.adjustBaseReps(record.exercise, record.difficulty);
    this.saveHistory();
    this.updateProfileStats();
  }

  recordWorkoutDifficulty(difficulty: DifficultyFeedback): void {
    const today = this.getToday();
    const todayWorkout = this.history.find(w => w.date === today);
    if (todayWorkout) {
      todayWorkout.overallDifficulty = difficulty;
      this.saveHistory();
    }
  }

  private adjustBaseReps(exercise: TrackableExercise, difficulty: DifficultyFeedback): void {
    const current = this.profile.baseReps[exercise] || DEFAULT_BASE_REPS[exercise];

    let newReps = current;
    switch (difficulty) {
      case 'easy':
        newReps = Math.round(current * 1.15);
        break;
      case 'hard':
        newReps = Math.max(3, Math.round(current * 0.85));
        break;
    }

    this.profile.baseReps[exercise] = newReps;
    this.saveProfile();
  }

  private updateProfileStats(): void {
    this.profile.daysSinceStretch = this.daysSinceActivity('flexibility');
    this.profile.daysSinceCardio = this.daysSinceActivity('cardio');
    this.profile.daysSinceUpperBody = this.daysSinceActivity('chest', 'shoulders', 'arms');
    this.profile.daysSinceLowerBody = this.daysSinceActivity('legs', 'glutes');
    this.profile.daysSinceCore = this.daysSinceActivity('core');
    this.profile.currentStreak = this.calculateStreak();

    if (this.profile.currentStreak > this.profile.longestStreak) {
      this.profile.longestStreak = this.profile.currentStreak;
    }

    this.profile.totalWorkouts = this.history.filter(w => w.exercises.length > 0).length;

    if (this.profile.totalWorkouts >= 20 && this.profile.currentStreak >= 5) {
      this.profile.level = 'consistent';
    } else if (this.profile.totalWorkouts >= 5) {
      this.profile.level = 'developing';
    } else {
      this.profile.level = 'beginner';
    }

    this.saveProfile();
  }

  private daysSinceActivity(...muscleGroups: MuscleGroup[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDate(date);

      const workout = this.history.find(w => w.date === dateStr);
      if (workout) {
        const hasActivity = muscleGroups.some(mg =>
          workout.muscleGroupsWorked.includes(mg)
        );
        if (hasActivity) return i;
      }
    }
    return 999;
  }

  private calculateStreak(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = this.formatDate(date);

      const workout = this.history.find(w => w.date === dateStr);
      if (workout && workout.exercises.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }

  getRecommendations(): WorkoutRecommendation[] {
    const recommendations: WorkoutRecommendation[] = [];
    const hour = new Date().getHours();
    const todayWorkout = this.getTodayWorkout();
    const needsWarmup = !todayWorkout?.includesWarmup;
    const needsStretch = this.profile.daysSinceStretch > 2;

    if (hour >= 6 && hour < 10) {
      recommendations.push(this.createMorningWarmup(needsWarmup));
    }

    if (hour >= 10 && hour < 14) {
      recommendations.push(this.createOfficeBreak());
    }

    if (hour >= 14 && hour < 18) {
      recommendations.push(this.createFullWorkout());
      recommendations.push(this.createQuickEnergy());
    }

    if (hour >= 18 && hour < 22) {
      if (needsStretch) {
        recommendations.push(this.createEveningStretch());
      }
      recommendations.push(this.createFullWorkout());
    }

    if (hour >= 22 || hour < 6) {
      recommendations.push(this.createEveningStretch());
    }

    const balancedWorkout = this.createBalancedWorkout();
    if (balancedWorkout) {
      recommendations.push(balancedWorkout);
    }

    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations.slice(0, 3);
  }

  private createMorningWarmup(needsWarmup: boolean): WorkoutRecommendation {
    return {
      sessionType: 'morning_warmup',
      title: 'Утренняя разминка',
      description: 'Разбуди тело и зарядись энергией на день',
      duration: 5,
      exercises: [
        { exercise: 'JUMPING_JACKS', reps: this.getReps('JUMPING_JACKS'), note: 'Разогрев' },
        { exercise: 'SQUATS', reps: this.getReps('SQUATS'), note: 'Пробуждаем ноги' },
        { exercise: 'HIGH_KNEES', reps: this.getReps('HIGH_KNEES'), note: 'Кардио' }
      ],
      includeWarmup: false,
      includeStretch: false,
      reason: needsWarmup ? 'Ты ещё не разминался сегодня' : 'Отличное начало дня',
      priority: needsWarmup ? 'high' : 'medium'
    };
  }

  private createOfficeBreak(): OfficeBreakRecommendation {
    // Pick 3-4 random desk exercises
    const deskExercises = this.pickSimpleExercises(DESK_EXERCISES, 3);
    // Maybe add one standing exercise
    const standingExercise = Math.random() > 0.5
      ? this.pickSimpleExercises(STANDING_OFFICE_EXERCISES, 1)[0]
      : null;

    const exercises: OfficeBreakExercise[] = deskExercises.map(e => ({
      type: 'simple' as const,
      exercise: e,
      note: SIMPLE_EXERCISE_INFO[e].instruction
    }));

    if (standingExercise) {
      exercises.push({
        type: 'simple' as const,
        exercise: standingExercise,
        note: SIMPLE_EXERCISE_INFO[standingExercise].instruction
      });
    }

    // Calculate total duration
    const totalDuration = exercises.reduce((sum, e) => {
      if (e.type === 'simple') {
        return sum + SIMPLE_EXERCISE_INFO[e.exercise].duration;
      }
      return sum + 30;
    }, 0);

    return {
      sessionType: 'office_break',
      title: 'Офисная пауза',
      description: 'Разомнись прямо за рабочим столом',
      duration: Math.ceil(totalDuration / 60),
      exercises,
      includeWarmup: false,
      includeStretch: false,
      reason: 'Пора размяться после сидения',
      priority: 'medium'
    };
  }

  private pickSimpleExercises(from: SimpleExercise[], count: number): SimpleExercise[] {
    const shuffled = [...from].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Get office break with simple exercises (public method)
  getOfficeBreak(): OfficeBreakRecommendation {
    return this.createOfficeBreak();
  }

  private createFullWorkout(): WorkoutRecommendation {
    const exercises: RecommendedExercise[] = [
      { exercise: 'JUMPING_JACKS', reps: this.getReps('JUMPING_JACKS'), note: 'Разминка' },
      { exercise: 'PUSHUPS', reps: this.getReps('PUSHUPS'), note: 'Грудь и руки' },
      { exercise: 'PLANK', duration: this.getReps('PLANK'), reps: 1, note: 'Держим корпус' },
      { exercise: 'SQUATS', reps: this.getReps('SQUATS'), note: 'Ноги и ягодицы' },
      { exercise: 'LUNGES', reps: this.getReps('LUNGES'), note: 'Баланс и ноги' },
      { exercise: 'BURPEES', reps: this.getReps('BURPEES'), note: 'Финальный рывок' }
    ];

    return {
      sessionType: 'full_workout',
      title: 'Полная тренировка',
      description: 'Проработай всё тело за 15 минут',
      duration: 15,
      exercises,
      includeWarmup: true,
      includeStretch: true,
      reason: 'Сбалансированная нагрузка на всё тело',
      priority: 'medium'
    };
  }

  private createEveningStretch(): WorkoutRecommendation {
    return {
      sessionType: 'evening_stretch',
      title: 'Вечерняя растяжка',
      description: 'Расслабь мышцы и подготовься ко сну',
      duration: 7,
      exercises: [
        { exercise: 'LUNGES', reps: 6, note: 'Растяжка бёдер' },
        { exercise: 'GLUTE_BRIDGES', reps: 10, note: 'Расслабляем поясницу' },
        { exercise: 'SIDE_LUNGES', reps: 6, note: 'Внутренняя поверхность бедра' },
        { exercise: 'PLANK', duration: 20, reps: 1, note: 'Укрепляем кор' }
      ],
      includeWarmup: false,
      includeStretch: false,
      reason: this.profile.daysSinceStretch > 2
        ? `Растяжки не было ${this.profile.daysSinceStretch} дней`
        : 'Отличный способ завершить день',
      priority: this.profile.daysSinceStretch > 2 ? 'high' : 'low'
    };
  }

  private createQuickEnergy(): WorkoutRecommendation {
    return {
      sessionType: 'quick_energy',
      title: 'Быстрый заряд',
      description: 'Всплеск энергии за 5 минут',
      duration: 5,
      exercises: [
        { exercise: 'JUMPING_JACKS', reps: 20, note: 'Разгоняем кровь' },
        { exercise: 'HIGH_KNEES', reps: 20, note: 'Поднимаем пульс' },
        { exercise: 'BURPEES', reps: 5, note: 'Максимум энергии' }
      ],
      includeWarmup: false,
      includeStretch: false,
      reason: 'Когда нужна энергия прямо сейчас',
      priority: 'low'
    };
  }

  private createBalancedWorkout(): WorkoutRecommendation | null {
    const neglected: { group: string; days: number; exercises: TrackableExercise[] }[] = [
      { group: 'верха тела', days: this.profile.daysSinceUpperBody, exercises: ['PUSHUPS', 'TRICEP_DIPS'] },
      { group: 'ног', days: this.profile.daysSinceLowerBody, exercises: ['SQUATS', 'LUNGES', 'CALF_RAISES'] },
      { group: 'кора', days: this.profile.daysSinceCore, exercises: ['SITUPS', 'PLANK', 'LEG_RAISES'] },
      { group: 'кардио', days: this.profile.daysSinceCardio, exercises: ['JUMPING_JACKS', 'HIGH_KNEES', 'BURPEES'] }
    ];

    const mostNeglected = neglected
      .filter(n => n.days > 3)
      .sort((a, b) => b.days - a.days)[0];

    if (!mostNeglected) return null;

    const exercises = mostNeglected.exercises.map(e => ({
      exercise: e,
      reps: this.getReps(e)
    }));

    return {
      sessionType: 'full_workout',
      title: `Фокус: ${mostNeglected.group}`,
      description: `Давно не тренировал эту группу мышц`,
      duration: 10,
      exercises,
      includeWarmup: true,
      includeStretch: false,
      reason: `${mostNeglected.group} не тренировались ${mostNeglected.days} дней`,
      priority: mostNeglected.days > 5 ? 'high' : 'medium'
    };
  }

  private getReps(exercise: TrackableExercise): number {
    return this.profile.baseReps[exercise] || DEFAULT_BASE_REPS[exercise];
  }

  private pickExercises(from: TrackableExercise[], count: number): TrackableExercise[] {
    const shuffled = [...from].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private getToday(): string {
    return this.formatDate(new Date());
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getTodayWorkout(): DailyWorkout | undefined {
    return this.history.find(w => w.date === this.getToday());
  }

  getProfile(): FitnessProfile {
    return { ...this.profile };
  }

  getHistory(): DailyWorkout[] {
    return [...this.history];
  }

  getMotivation(): string {
    const { currentStreak, totalWorkouts } = this.profile;
    const hour = new Date().getHours();

    if (currentStreak >= 7) return `🔥 ${currentStreak} дней подряд! Ты в ударе!`;
    if (currentStreak >= 3) return `💪 Серия ${currentStreak} дня! Продолжай!`;
    if (totalWorkouts === 0) return 'Начни с малого — всего 5 минут изменят твой день!';
    if (hour < 10) return 'Утренняя разминка зарядит энергией на весь день';
    if (hour >= 14 && hour < 17) return 'После обеда тело просит движения';
    if (hour >= 20) return 'Вечерняя растяжка улучшит сон';

    const messages = [
      'Любое движение лучше, чем сидение',
      'Твоё тело скажет спасибо',
      '5 минут — это всего 0.3% твоего дня',
      'Офисная разминка — секрет продуктивности'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  needsWarmup(): boolean {
    const today = this.getTodayWorkout();
    return !today?.includesWarmup;
  }

  getWarmupExercises(): RecommendedExercise[] {
    return [
      { exercise: 'JUMPING_JACKS', reps: 15, note: 'Разогрев всего тела' },
      { exercise: 'HIGH_KNEES', reps: 20, note: 'Поднимаем пульс' }
    ];
  }
}

let advisorInstance: WorkoutAdvisor | null = null;

export function getWorkoutAdvisor(): WorkoutAdvisor {
  if (!advisorInstance) {
    advisorInstance = new WorkoutAdvisor();
  }
  return advisorInstance;
}

export default WorkoutAdvisor;
