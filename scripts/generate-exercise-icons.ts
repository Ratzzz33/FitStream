/**
 * Generate exercise SVG icons using Gemini
 * Run: npx tsx scripts/generate-exercise-icons.ts
 */

import { GoogleGenAI, Type } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXERCISES = [
  { id: 'squats', name: 'Приседания', prompt: 'person doing a squat, legs bent, arms forward' },
  { id: 'pushups', name: 'Отжимания', prompt: 'person in push-up position, arms extended, body horizontal' },
  { id: 'plank', name: 'Планка', prompt: 'person in plank position, body straight horizontal, on forearms' },
  { id: 'lunges', name: 'Выпады', prompt: 'person doing forward lunge, one knee down, other leg forward' },
  { id: 'situps', name: 'Пресс', prompt: 'person doing sit-up, lying with knees bent, torso raised' },
  { id: 'burpees', name: 'Бёрпи', prompt: 'person jumping with arms up, dynamic jumping pose' },
  { id: 'jumping_jacks', name: 'Джампинг Джек', prompt: 'person with arms up and legs spread wide, star pose' },
  { id: 'high_knees', name: 'Высокие колени', prompt: 'person running in place, one knee raised high' },
  { id: 'mountain_climbers', name: 'Скалолаз', prompt: 'person in plank with one knee tucked toward chest' },
  { id: 'leg_raises', name: 'Подъём ног', prompt: 'person lying flat, legs raised up straight' },
  { id: 'glute_bridges', name: 'Ягодичный мост', prompt: 'person lying with knees bent, hips raised up' },
  { id: 'calf_raises', name: 'Подъём на носки', prompt: 'person standing on tiptoes, calves engaged' },
  { id: 'wall_sit', name: 'Стульчик', prompt: 'person sitting against wall, thighs parallel to ground' },
  { id: 'side_lunges', name: 'Боковые выпады', prompt: 'person in side lunge, one leg extended to side' },
  { id: 'tricep_dips', name: 'Обратные отжимания', prompt: 'person doing tricep dip, hands behind on surface' },
];

async function generateIcons() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error('API_KEY not set');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const outputDir = path.join(__dirname, '../public/icons/exercises');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating exercise SVG icons...\n');

  for (const exercise of EXERCISES) {
    console.log(`Generating: ${exercise.name} (${exercise.id})`);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          parts: [{
            text: `Create a minimalist SVG icon for a fitness app showing: ${exercise.prompt}

Requirements:
- ViewBox: 0 0 64 64
- Single path element using only 'd' attribute
- White fill color (#FFFFFF)
- Simple geometric silhouette style
- No stroke, only fill
- Human figure should be recognizable but abstract
- Clean, minimal design suitable for app icon

Return ONLY the SVG code, nothing else. Format:
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="..."/></svg>`
          }]
        }],
        config: {
          temperature: 0.3,
        }
      });

      const text = response.text || '';
      const svgMatch = text.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);

      if (svgMatch) {
        const svg = svgMatch[0];
        const filePath = path.join(outputDir, `${exercise.id}.svg`);
        fs.writeFileSync(filePath, svg);
        console.log(`  ✓ Saved: ${filePath}`);
      } else {
        console.log(`  ✗ No valid SVG in response`);
      }
    } catch (error: any) {
      console.error(`  ✗ Error: ${error.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone! SVG icons saved to public/icons/exercises/');
  console.log('Update WorkoutSession.tsx to use these icons.');
}

generateIcons();
