/**
 * Generate tile images for feature modal using Imagen 4
 * Run with: npx tsx scripts/generate-feature-tiles.ts
 */
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

// Load API key
const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = process.env.GEMINI_API_KEY || (envMatch ? envMatch[1].trim() : '');

if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY not found');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const OUTPUT_DIR = path.join(__dirname, '../public/land/covers/tiles');

// Feature sub-tiles definitions
const featureTiles: Record<string, { id: string; prompt: string }[]> = {
    pose: [
        { id: 'realtime', prompt: 'Minimalist icon of human silhouette with glowing joint points, purple neon, dark background, fitness app style' },
        { id: 'exercises', prompt: 'Grid of 4 exercise icons (squat, pushup, plank, lunge), minimalist white on purple gradient' },
        { id: 'feedback', prompt: 'Checkmark with sparkles, green glow, minimalist feedback icon, dark background' },
        { id: 'counting', prompt: 'Digital counter showing number 15 with circular progress, purple accent, minimalist' },
    ],
    kitchen: [
        { id: 'storage', prompt: 'Three storage icons (fridge, pantry shelf, freezer), minimalist line art, amber gradient background' },
        { id: 'ai-scan', prompt: 'Camera viewfinder scanning groceries, AI sparkles, amber and orange, minimalist' },
        { id: 'expiry', prompt: 'Calendar with warning icon, food freshness tracker, amber tones, minimalist icon' },
        { id: 'shopping', prompt: 'Shopping list with checkboxes, cart icon, minimalist amber gradient' },
    ],
    cooking: [
        { id: 'steps', prompt: 'Numbered steps 1-2-3 with arrows, recipe flow, rose pink gradient, minimalist' },
        { id: 'timer', prompt: 'Cooking timer with steam, countdown display, rose pink, minimalist icon' },
        { id: 'voice', prompt: 'Sound waves with chef hat, voice assistant, rose gradient, minimalist' },
        { id: 'tips', prompt: 'Lightbulb with utensils, cooking tips icon, rose pink, minimalist' },
    ],
    coach: [
        { id: 'voice-guide', prompt: 'Sound waves emanating from dumbbell, blue gradient, voice coaching icon' },
        { id: 'rep-count', prompt: 'Digital rep counter with plus sign, workout tracking, blue minimalist' },
        { id: 'form-tips', prompt: 'Human figure with correction arrows, posture feedback, blue gradient' },
        { id: 'history', prompt: 'Calendar with progress graph, workout history, blue minimalist icon' },
    ],
    scale: [
        { id: 'camera', prompt: 'Camera icon pointing at scale, scanning beam, emerald green minimalist' },
        { id: 'auto-read', prompt: 'Digital display showing 72.5kg, automatic reading, emerald gradient' },
        { id: 'any-scale', prompt: 'Different scale types (digital, analog), compatibility icon, green minimalist' },
        { id: 'trend', prompt: 'Weight trend graph going down, progress tracking, emerald green minimalist' },
    ],
    food: [
        { id: 'calories', prompt: 'Flame icon with number, calorie counter, orange gradient minimalist' },
        { id: 'macros', prompt: 'Three pie chart segments (protein, carbs, fat), colorful macros, orange bg' },
        { id: 'reference', prompt: 'Credit card next to apple for size reference, measurement, orange minimalist' },
        { id: 'log', prompt: 'Food diary with meal entries, logging icon, orange gradient minimalist' },
    ],
    receipt: [
        { id: 'scan', prompt: 'Receipt paper with scanning beam, OCR reading, teal gradient minimalist' },
        { id: 'extract', prompt: 'Receipt transforming into product list, data extraction, teal minimalist' },
        { id: 'prices', prompt: 'Price tags with currency symbol, price tracking, teal gradient icon' },
        { id: 'budget', prompt: 'Pie chart with money icon, budget insights, teal minimalist' },
    ],
    finance: [
        { id: 'spending', prompt: 'Wallet with food items, spending tracker, lime green minimalist' },
        { id: 'cooking-vs-out', prompt: 'Home icon vs restaurant icon comparison, savings, lime gradient' },
        { id: 'reports', prompt: 'Bar chart with calendar, monthly reports, lime green minimalist' },
        { id: 'savings', prompt: 'Piggy bank with growing coins, savings calculator, lime gradient icon' },
    ],
    health: [
        { id: 'google-fit', prompt: 'Google Fit style heart with activity ring, red minimalist icon' },
        { id: 'apple-health', prompt: 'Apple Health style heart icon, red gradient, sync arrows' },
        { id: 'steps', prompt: 'Footsteps with progress bar, step counter, red minimalist icon' },
        { id: 'sync', prompt: 'Cloud with sync arrows, data synchronization, red gradient minimalist' },
    ],
    goals: [
        { id: 'custom', prompt: 'Target bullseye with pencil, custom goals, purple gradient minimalist' },
        { id: 'exercises', prompt: 'Four exercise icons in grid, multiple goal types, purple minimalist' },
        { id: 'streak', prompt: 'Fire flame with number streak, streak counter, purple and orange' },
        { id: 'progress', prompt: 'Circular progress rings filling up, goal progress, purple gradient' },
    ],
    charts: [
        { id: 'weight', prompt: 'Line graph trending down, weight chart, cyan gradient minimalist' },
        { id: 'workouts', prompt: 'Bar chart with dumbbell icon, workout history, cyan minimalist' },
        { id: 'body', prompt: 'Human figure silhouette with measurement arrows, body composition, cyan' },
        { id: 'export', prompt: 'Document with download arrow, CSV export, cyan gradient icon' },
    ],
    offline: [
        { id: 'offline-mode', prompt: 'Cloud with X mark, offline indicator, slate gray minimalist' },
        { id: 'auto-sync', prompt: 'Cloud with sync arrows, automatic sync, slate gradient icon' },
        { id: 'local', prompt: 'Phone with database icon, local storage, slate gray minimalist' },
        { id: 'anywhere', prompt: 'Globe with checkmark, works anywhere, slate gradient minimalist' },
    ],
};

async function generateTile(featureKey: string, tile: { id: string; prompt: string }) {
    const filename = `${featureKey}-${tile.id}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    // Skip if already exists
    if (fs.existsSync(filepath)) {
        console.log(`  ⏭ Skip (exists): ${filename}`);
        return filepath;
    }

    console.log(`  🎨 Generating: ${filename}`);

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${tile.prompt}, icon style, clean simple design, no text, no labels`,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1',
                includeRaiReason: true
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];

            if (img.raiFilteredReason) {
                console.log(`    ⚠ Filtered: ${img.raiFilteredReason}`);
                return null;
            }

            if (img.image?.imageBytes) {
                const buffer = Buffer.from(img.image.imageBytes, 'base64');
                fs.writeFileSync(filepath, buffer);
                console.log(`    ✓ Saved (${Math.round(buffer.length / 1024)}KB)`);
                return filepath;
            }
        }

        console.log(`    ✗ No image generated`);
        return null;
    } catch (error: any) {
        console.error(`    ✗ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created: ${OUTPUT_DIR}`);
    }

    console.log('='.repeat(50));
    console.log('Generating feature tile images');
    console.log('='.repeat(50));

    let total = 0;
    let success = 0;

    for (const [featureKey, tiles] of Object.entries(featureTiles)) {
        console.log(`\n📦 ${featureKey.toUpperCase()}`);

        for (const tile of tiles) {
            total++;
            const result = await generateTile(featureKey, tile);
            if (result) success++;

            // Rate limit delay
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Complete: ${success}/${total} tiles generated`);
    console.log(`Output: ${OUTPUT_DIR}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
