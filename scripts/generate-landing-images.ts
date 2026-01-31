/**
 * Generate landing page images using Gemini Imagen 3
 *
 * Usage:
 *   npx tsx scripts/generate-landing-images.ts [--covers] [--tiles] [--feature=smartKitchen]
 *
 * Requires:
 *   - API_KEY environment variable with Gemini API key
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error('❌ API_KEY environment variable required');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Feature prompts for cover images (16:9)
const coverPrompts: Record<string, string> = {
  poseTracking: `Minimalist 3D illustration of a smartphone showing AI pose detection overlay on a person doing squats. Glowing blue skeleton wireframe on the body. Purple-violet gradient background. Modern fitness app aesthetic. Soft ambient lighting. No text.`,

  exercises: `Minimalist 3D illustration showing 6 floating exercise icons: dumbbell, squatting figure, push-up figure, plank pose, lunges, jumping jacks. Clean white and blue gradient background. Modern fitness app style. Soft shadows. No text.`,

  smartKitchen: `Minimalist 3D illustration of an open refrigerator with AI scanning beam analyzing products inside. Floating product icons with checkmarks. Warm amber and orange gradient background. Modern smart home aesthetic. No text.`,

  cookingMode: `Minimalist 3D illustration of a smartphone showing step-by-step recipe with timer. Steam rising from a pot. Floating ingredient icons. Warm rose-red gradient background. Cozy cooking atmosphere. No text.`,

  nutritionScanner: `Minimalist 3D illustration of a smartphone camera scanning a plate of food. Floating calorie and macro numbers. Credit card as reference object nearby. Orange gradient background. Modern health app style. No text.`,

  smartScale: `Minimalist 3D illustration of a smart bathroom scale with holographic body composition data floating above. Weight, body fat percentage, muscle mass icons. Emerald green gradient background. Futuristic health tech aesthetic. No text.`,

  healthIntegrations: `Minimalist 3D illustration showing three connected health app logos (heart, activity ring, fitness icon) with data streams flowing between them. Red and pink gradient background. Health ecosystem visualization. No text.`,

  offlineFirst: `Minimalist 3D illustration of a smartphone with a cloud icon and checkmark, showing offline sync. Mountains and airplane in background suggesting remote locations. Slate gray gradient background. Reliable tech aesthetic. No text.`,

  multiLanguage: `Minimalist 3D illustration of a globe with 6 national flags floating around it (US, Russia, Spain, France, Germany, China). Language bubbles. Blue gradient background. Global communication aesthetic. No text.`,

  multiPlatform: `Minimalist 3D illustration showing iPhone, Android phone, laptop, and Telegram icon all connected with sync lines. Same fitness app interface on each. Blue-green gradient background. Cross-platform harmony. No text.`,

  aiCoach: `Minimalist 3D illustration of a friendly AI coach avatar (abstract humanoid) with speech bubble containing motivational sparkles. Two voice waveforms (male/female). Purple-blue gradient background. Supportive AI aesthetic. No text.`,

  smartShopping: `Minimalist 3D illustration of a shopping cart with AI scanner beam checking products. Floating shopping list with checkmarks. Store shelf in background. Pink-magenta gradient background. Smart shopping aesthetic. No text.`,

  foodFinance: `Minimalist 3D illustration of a piggy bank with food items (groceries) and money coins. Chart showing savings trend. Lime-green gradient background. Financial wellness aesthetic. No text.`,

  receiptScanning: `Minimalist 3D illustration of a smartphone camera scanning a paper receipt. Extracted product items floating out with prices. Teal gradient background. OCR technology aesthetic. No text.`,

  gamification: `Minimalist 3D illustration of a trophy with achievement badges, streak fire icon, and leaderboard podium. Confetti particles. Gold and amber gradient background. Celebration and competition aesthetic. No text.`,

  charts: `Minimalist 3D illustration of floating analytics charts: line graph trending up, bar chart, pie chart for body composition. Cyan-blue gradient background. Data visualization aesthetic. No text.`,
};

// Tile prompts for each feature (1:1)
const tilePrompts: Record<string, Record<string, string>> = {
  poseTracking: {
    realtime: `Minimalist icon of an eye with AI circuit pattern. Violet gradient background. Clean vector style.`,
    exercises: `Minimalist icon of a 3x3 grid showing exercise pose silhouettes. Violet gradient background.`,
    feedback: `Minimalist icon of a checkmark overlaid on body pose outline. Green accent. Violet background.`,
    counting: `Minimalist icon of numbers 1-2-3 with circular progress ring. Violet gradient background.`,
  },
  smartKitchen: {
    scan: `Minimalist icon of camera viewfinder frame scanning a product box. Amber gradient background.`,
    expiry: `Minimalist icon of calendar page with warning triangle. Amber gradient background.`,
    recipes: `Minimalist icon of chef hat with sparkle star. Amber gradient background.`,
    shopping: `Minimalist icon of shopping basket with plus sign. Amber gradient background.`,
  },
  cookingMode: {
    steps: `Minimalist icon of numbered list 1-2-3 with arrow pointing right. Rose gradient background.`,
    timers: `Minimalist icon of stopwatch with play button. Rose gradient background.`,
    reminders: `Minimalist icon of bell with wooden spoon. Rose gradient background.`,
    calories: `Minimalist icon of flame with number inside. Rose gradient background.`,
  },
  nutritionScanner: {
    photo: `Minimalist icon of camera with food plate in viewfinder. Orange gradient background.`,
    reference: `Minimalist icon of credit card with ruler measurement marks. Orange gradient background.`,
    macros: `Minimalist icon of pie chart divided into P/F/C sections. Orange gradient background.`,
    history: `Minimalist icon of calendar with food entry dots. Orange gradient background.`,
  },
  smartScale: {
    bluetooth: `Minimalist icon of Bluetooth symbol connected to scale. Emerald gradient background.`,
    metrics: `Minimalist icon of body silhouette with floating data points. Emerald gradient background.`,
    charts: `Minimalist icon of line graph trending upward. Emerald gradient background.`,
    sync: `Minimalist icon of circular sync arrows with cloud. Emerald gradient background.`,
  },
  healthIntegrations: {
    googlefit: `Minimalist icon of three concentric activity rings (red, green, blue). Red gradient background.`,
    applehealth: `Minimalist icon of heart shape with pulse line. Red gradient background.`,
    samsung: `Minimalist icon of flower-like health symbol. Red gradient background.`,
    metrics: `Minimalist icon of heart rate pulse wave with data dots. Red gradient background.`,
  },
  offlineFirst: {
    offline: `Minimalist icon of cloud with X mark, device with checkmark below. Slate gradient background.`,
    storage: `Minimalist icon of device with stacked database layers inside. Slate gradient background.`,
    sync: `Minimalist icon of cloud with bidirectional arrows. Slate gradient background.`,
    reliable: `Minimalist icon of shield with checkmark. Slate gradient background.`,
  },
  multiLanguage: {
    auto: `Minimalist icon of globe with magic wand and sparkles. Blue gradient background.`,
    switch: `Minimalist icon of toggle switch with EN/RU labels. Blue gradient background.`,
    interface: `Minimalist icon of app screen with translated text lines. Blue gradient background.`,
    content: `Minimalist icon of document with multiple small flags. Blue gradient background.`,
  },
  multiPlatform: {
    ios: `Minimalist icon of iPhone silhouette with app screen. Cyan gradient background.`,
    android: `Minimalist icon of Android phone silhouette with app screen. Cyan gradient background.`,
    web: `Minimalist icon of browser window with app inside. Cyan gradient background.`,
    telegram: `Minimalist icon of Telegram paper plane. Cyan gradient background.`,
  },
  aiCoach: {
    motivation: `Minimalist icon of speech bubble with star sparkle inside. Purple gradient background.`,
    voice: `Minimalist icon of sound waves emanating from speaker. Purple gradient background.`,
    personas: `Minimalist icon of two abstract face profiles (male/female). Purple gradient background.`,
    adaptive: `Minimalist icon of brain with upward progress arrow. Purple gradient background.`,
  },
  smartShopping: {
    planning: `Minimalist icon of calendar grid with meal icons. Pink gradient background.`,
    lists: `Minimalist icon of checklist with grocery items. Pink gradient background.`,
    verify: `Minimalist icon of camera with checkmark on product. Pink gradient background.`,
    scan: `Minimalist icon of store shelf with scanning beam. Pink gradient background.`,
  },
  foodFinance: {
    expenses: `Minimalist icon of wallet with receipt sticking out. Lime gradient background.`,
    compare: `Minimalist icon of house versus restaurant fork, split view. Lime gradient background.`,
    reports: `Minimalist icon of document with bar chart. Lime gradient background.`,
    savings: `Minimalist icon of piggy bank with upward arrow. Lime gradient background.`,
  },
  receiptScanning: {
    scan: `Minimalist icon of receipt paper with camera viewfinder. Teal gradient background.`,
    extract: `Minimalist icon of receipt with items floating outward. Teal gradient background.`,
    prices: `Minimalist icon of price tag with currency symbol. Teal gradient background.`,
    history: `Minimalist icon of folder containing receipts. Teal gradient background.`,
  },
  gamification: {
    achievements: `Minimalist icon of badge medal with star center. Gold gradient background.`,
    streaks: `Minimalist icon of fire flame with number inside. Gold gradient background.`,
    leaderboard: `Minimalist icon of podium with 1-2-3 positions. Gold gradient background.`,
    challenges: `Minimalist icon of target bullseye with lightning bolt. Gold gradient background.`,
  },
  charts: {
    weight: `Minimalist icon of line graph trending down with scale icon. Cyan gradient background.`,
    calories: `Minimalist icon of bar chart with flame on top bar. Cyan gradient background.`,
    workouts: `Minimalist icon of donut/ring chart with activity colors. Cyan gradient background.`,
    export: `Minimalist icon of document with arrow pointing outward. Cyan gradient background.`,
  },
};

async function generateImage(prompt: string, aspectRatio: '16:9' | '1:1'): Promise<Buffer | null> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: {
        numberOfImages: 1,
        aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages[0]) {
      const base64 = response.generatedImages[0].image.imageBytes;
      return Buffer.from(base64, 'base64');
    }
    return null;
  } catch (error) {
    console.error(`❌ Generation failed: ${error}`);
    return null;
  }
}

async function generateCovers(features?: string[]) {
  const outputDir = path.join(__dirname, '../landing/covers');
  fs.mkdirSync(outputDir, { recursive: true });

  const featuresToGenerate = features || Object.keys(coverPrompts);

  for (const feature of featuresToGenerate) {
    const prompt = coverPrompts[feature];
    if (!prompt) {
      console.warn(`⚠️ No prompt for feature: ${feature}`);
      continue;
    }

    console.log(`🎨 Generating cover: ${feature}...`);
    const imageBuffer = await generateImage(prompt, '16:9');

    if (imageBuffer) {
      const outputPath = path.join(outputDir, `${feature}.png`);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`✅ Saved: ${outputPath}`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function generateTiles(features?: string[]) {
  const outputDir = path.join(__dirname, '../landing/covers/tiles');
  fs.mkdirSync(outputDir, { recursive: true });

  const featuresToGenerate = features || Object.keys(tilePrompts);

  for (const feature of featuresToGenerate) {
    const tiles = tilePrompts[feature];
    if (!tiles) {
      console.warn(`⚠️ No tile prompts for feature: ${feature}`);
      continue;
    }

    for (const [tileName, prompt] of Object.entries(tiles)) {
      console.log(`🎨 Generating tile: ${feature}-${tileName}...`);
      const imageBuffer = await generateImage(prompt, '1:1');

      if (imageBuffer) {
        const outputPath = path.join(outputDir, `${feature}-${tileName}.png`);
        fs.writeFileSync(outputPath, imageBuffer);
        console.log(`✅ Saved: ${outputPath}`);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const generateCoversFlag = args.includes('--covers') || args.length === 0;
  const generateTilesFlag = args.includes('--tiles') || args.length === 0;

  const featureArg = args.find(a => a.startsWith('--feature='));
  const specificFeature = featureArg ? [featureArg.split('=')[1]] : undefined;

  console.log('🚀 FitStream Landing Image Generator\n');

  if (generateCoversFlag) {
    console.log('📸 Generating cover images...\n');
    await generateCovers(specificFeature);
  }

  if (generateTilesFlag) {
    console.log('\n📸 Generating tile images...\n');
    await generateTiles(specificFeature);
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);
