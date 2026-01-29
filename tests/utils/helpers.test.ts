import { describe, it, expect } from 'vitest';

// Test utility functions
describe('Utility Functions', () => {
  describe('parseJwt', () => {
    // Реализуем функцию для теста (она в App.tsx)
    function parseJwt(token: string) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    }

    it('parses a valid JWT token', () => {
      // Тестовый JWT (header.payload.signature)
      // Payload: {"sub":"1234567890","name":"Test User","iat":1516239022}
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3QgVXNlciIsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const result = parseJwt(token);
      expect(result).toEqual({
        sub: '1234567890',
        name: 'Test User',
        iat: 1516239022,
      });
    });

    it('returns null for invalid token', () => {
      const result = parseJwt('invalid-token');
      expect(result).toBeNull();
    });

    it('returns null for empty string', () => {
      const result = parseJwt('');
      expect(result).toBeNull();
    });
  });

  describe('Date Utilities', () => {
    it('formats date correctly', () => {
      const date = new Date('2025-01-29T12:00:00Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2025-01-29');
    });

    it('calculates day difference correctly', () => {
      const date1 = new Date('2025-01-29');
      const date2 = new Date('2025-01-27');

      const diffTime = Math.abs(date1.getTime() - date2.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(2);
    });
  });

  describe('ID Generation', () => {
    it('generates unique IDs', () => {
      const generateId = () => 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^id_[a-z0-9]+$/);
    });
  });

  describe('BMR Calculation', () => {
    // Формула Mifflin-St Jeor
    function calculateBMR(weight: number, height: number, age: number, gender: 'MALE' | 'FEMALE'): number {
      let bmr = 10 * weight + 6.25 * height - 5 * age;
      bmr += gender === 'MALE' ? 5 : -161;
      return bmr;
    }

    it('calculates BMR for male correctly', () => {
      // 80kg, 180cm, 30 years old, male
      const bmr = calculateBMR(80, 180, 30, 'MALE');
      // Expected: (10*80) + (6.25*180) - (5*30) + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(bmr).toBe(1780);
    });

    it('calculates BMR for female correctly', () => {
      // 60kg, 165cm, 25 years old, female
      const bmr = calculateBMR(60, 165, 25, 'FEMALE');
      // Expected: (10*60) + (6.25*165) - (5*25) - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
      expect(bmr).toBe(1345.25);
    });
  });

  describe('Water Calculation', () => {
    it('calculates daily water intake based on weight', () => {
      const weight = 70; // kg
      const waterMl = Math.round(weight * 35);
      expect(waterMl).toBe(2450); // ml
    });
  });

  describe('Activity Multipliers', () => {
    const activityMultipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      VERY_ACTIVE: 1.725,
    };

    it('applies correct multiplier for sedentary', () => {
      const bmr = 1800;
      const tdee = Math.round(bmr * activityMultipliers.SEDENTARY);
      expect(tdee).toBe(2160);
    });

    it('applies correct multiplier for very active', () => {
      const bmr = 1800;
      const tdee = Math.round(bmr * activityMultipliers.VERY_ACTIVE);
      expect(tdee).toBe(3105);
    });
  });
});

describe('Goal Type Validation', () => {
  const validGoalTypes = [
    'STEPS',
    'PUSHUPS',
    'SQUATS',
    'SITUPS',
    'JUMPING_JACKS',
    'LUNGES',
    'BURPEES',
    'DIPS',
    'PULLUPS',
  ];

  it('validates goal types', () => {
    const isValidGoalType = (type: string) => validGoalTypes.includes(type);

    expect(isValidGoalType('PUSHUPS')).toBe(true);
    expect(isValidGoalType('INVALID')).toBe(false);
  });

  it('normalizes exercise names to goal types', () => {
    const normalizeExerciseName = (name: string) =>
      name.toUpperCase().replace('-', '').replace('_', '').replace(' ', '_');

    expect(normalizeExerciseName('push-ups')).toBe('PUSHUPS');
    expect(normalizeExerciseName('Jumping Jacks')).toBe('JUMPING_JACKS');
  });
});

describe('Color Validation', () => {
  it('validates hex color format', () => {
    const isValidHexColor = (color: string) => /^#[0-9a-fA-F]{6}$/.test(color);

    expect(isValidHexColor('#10b981')).toBe(true);
    expect(isValidHexColor('#fff')).toBe(false);
    expect(isValidHexColor('red')).toBe(false);
    expect(isValidHexColor('#FFFFFF')).toBe(true);
  });
});
