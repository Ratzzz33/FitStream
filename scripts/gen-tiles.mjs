/**
 * Generate tile images for feature modal using Imagen 4
 */
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load API key
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = process.env.GEMINI_API_KEY || (envMatch ? envMatch[1].trim() : '');

if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY not found');
    process.exit(1);
}

console.log('API Key:', API_KEY.substring(0, 15) + '...');

const ai = new GoogleGenAI({ apiKey: API_KEY });
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'land', 'covers', 'tiles');

// Feature sub-tiles - simplified prompts
const featureTiles = {
    pose: [
        { id: 'realtime', prompt: 'minimalist icon human silhouette glowing joint points purple neon dark background' },
        { id: 'exercises', prompt: 'grid 4 exercise icons squat pushup plank lunge minimalist purple gradient' },
        { id: 'feedback', prompt: 'checkmark sparkles green glow minimalist icon dark background' },
        { id: 'counting', prompt: 'digital counter number 15 circular progress purple minimalist' },
    ],
    kitchen: [
        { id: 'storage', prompt: 'three storage icons fridge pantry freezer minimalist amber gradient' },
        { id: 'ai-scan', prompt: 'camera scanning groceries AI sparkles amber orange minimalist' },
        { id: 'expiry', prompt: 'calendar warning icon food freshness amber tones minimalist' },
        { id: 'shopping', prompt: 'shopping list checkboxes cart icon amber gradient minimalist' },
    ],
    cooking: [
        { id: 'steps', prompt: 'numbered steps 1 2 3 arrows recipe flow rose pink minimalist' },
        { id: 'timer', prompt: 'cooking timer steam countdown rose pink minimalist icon' },
        { id: 'voice', prompt: 'sound waves chef hat voice assistant rose gradient minimalist' },
        { id: 'tips', prompt: 'lightbulb utensils cooking tips rose pink minimalist' },
    ],
    coach: [
        { id: 'voice-guide', prompt: 'sound waves dumbbell blue gradient voice coaching icon' },
        { id: 'rep-count', prompt: 'digital rep counter plus sign workout blue minimalist' },
        { id: 'form-tips', prompt: 'human figure correction arrows posture feedback blue gradient' },
        { id: 'history', prompt: 'calendar progress graph workout history blue minimalist' },
    ],
    scale: [
        { id: 'camera', prompt: 'camera icon pointing at scale scanning beam emerald green minimalist' },
        { id: 'auto-read', prompt: 'digital display showing 72kg automatic reading emerald gradient' },
        { id: 'any-scale', prompt: 'different scale types digital analog compatibility emerald minimalist' },
        { id: 'trend', prompt: 'weight trend graph going down progress tracking emerald green' },
    ],
    food: [
        { id: 'calories', prompt: 'flame icon with number calorie counter orange gradient minimalist' },
        { id: 'macros', prompt: 'three pie chart segments protein carbs fat colorful orange bg' },
        { id: 'reference', prompt: 'credit card next to apple size reference measurement orange minimalist' },
        { id: 'log', prompt: 'food diary meal entries logging icon orange gradient' },
    ],
    receipt: [
        { id: 'scan', prompt: 'receipt paper scanning beam OCR reading teal gradient minimalist' },
        { id: 'extract', prompt: 'receipt transforming into product list data extraction teal' },
        { id: 'prices', prompt: 'price tags currency symbol price tracking teal gradient' },
        { id: 'budget', prompt: 'pie chart money icon budget insights teal minimalist' },
    ],
    finance: [
        { id: 'spending', prompt: 'wallet with food items spending tracker lime green minimalist' },
        { id: 'cooking-vs-out', prompt: 'home icon vs restaurant icon comparison savings lime gradient' },
        { id: 'reports', prompt: 'bar chart calendar monthly reports lime green minimalist' },
        { id: 'savings', prompt: 'piggy bank growing coins savings calculator lime gradient' },
    ],
    health: [
        { id: 'google-fit', prompt: 'heart with activity ring red minimalist health icon' },
        { id: 'apple-health', prompt: 'apple health style heart icon red gradient sync arrows' },
        { id: 'steps', prompt: 'footsteps progress bar step counter red minimalist' },
        { id: 'sync', prompt: 'cloud sync arrows data synchronization red gradient' },
    ],
    goals: [
        { id: 'custom', prompt: 'target bullseye pencil custom goals purple gradient minimalist' },
        { id: 'exercises', prompt: 'four exercise icons grid multiple goal types purple minimalist' },
        { id: 'streak', prompt: 'fire flame number streak counter purple orange' },
        { id: 'progress', prompt: 'circular progress rings filling up goal progress purple gradient' },
    ],
    charts: [
        { id: 'weight', prompt: 'line graph trending down weight chart cyan gradient minimalist' },
        { id: 'workouts', prompt: 'bar chart dumbbell icon workout history cyan minimalist' },
        { id: 'body', prompt: 'human figure silhouette measurement arrows body composition cyan' },
        { id: 'export', prompt: 'document download arrow CSV export cyan gradient' },
    ],
    offline: [
        { id: 'offline-mode', prompt: 'cloud with X mark offline indicator slate gray minimalist' },
        { id: 'auto-sync', prompt: 'cloud sync arrows automatic sync slate gradient' },
        { id: 'local', prompt: 'phone database icon local storage slate gray minimalist' },
        { id: 'anywhere', prompt: 'globe checkmark works anywhere slate gradient' },
    ],
};

async function generateTile(featureKey, tile) {
    const filename = `${featureKey}-${tile.id}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filepath)) {
        console.log(`  ⏭ Skip: ${filename}`);
        return filepath;
    }

    console.log(`  🎨 Generating: ${filename}`);

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${tile.prompt}, icon style, clean simple, no text`,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1'
            }
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
            const buffer = Buffer.from(response.generatedImages[0].image.imageBytes, 'base64');
            fs.writeFileSync(filepath, buffer);
            console.log(`    ✓ Saved (${Math.round(buffer.length / 1024)}KB)`);
            return filepath;
        }

        console.log(`    ✗ No image`);
        return null;
    } catch (error) {
        console.error(`    ✗ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created: ${OUTPUT_DIR}`);
    }

    console.log('='.repeat(50));
    console.log('Generating feature tiles');
    console.log('='.repeat(50));

    for (const [featureKey, tiles] of Object.entries(featureTiles)) {
        console.log(`\n📦 ${featureKey.toUpperCase()}`);

        for (const tile of tiles) {
            await generateTile(featureKey, tile);
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log('\n✅ Done!');
}

main().catch(console.error);
