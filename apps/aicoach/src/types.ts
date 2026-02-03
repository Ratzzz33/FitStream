// AI Coach-specific types
export type { ExerciseLog, GoalType, DailyGoal } from '@fitstream/shared';

export interface WorkoutProgram {
  id: string;
  name: string;
  exercises: ProgramExercise[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
}

export interface ProgramExercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
}
