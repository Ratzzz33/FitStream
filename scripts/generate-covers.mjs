/**
 * Generate cover images for landing page feature modals using Imagen 4.0 API
 */
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load API key from .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = envMatch ? envMatch[1].trim() : '';

if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY not found');
    process.exit(1);
}

console.log('API Key found:', API_KEY.substring(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Feature definitions with image prompts
const features = [
    { id: 'pose', prompt: 'Minimalist flat vector illustration, person doing yoga pose with glowing neon points on joints, purple and violet gradient background, modern fitness app style, no text, clean simple geometric shapes, digital art' },
    { id: 'kitchen', prompt: 'Minimalist flat vector illustration, smart refrigerator with organized colorful food compartments, warm amber and orange gradient background, modern kitchen scene, no text, clean geometric design' },
    { id: 'cooking', prompt: 'Minimalist flat vector illustration, cooking pot with steam swirls and floating timer icon, rose pink gradient background, recipe visualization, no text, modern app style, clean shapes' },
    { id: 'coach', prompt: 'Minimalist flat vector illustration, friendly AI robot coach avatar with sound waves and stopwatch, blue gradient background, fitness training theme, no text, modern app design' },
    { id: 'scale', prompt: 'Minimalist flat vector illustration, bathroom scale with camera lens scanning beam above it, emerald green gradient background, weight tracking theme, no text, clean modern style' },
    { id: 'food', prompt: 'Minimalist flat vector illustration, plate of colorful food with camera frame overlay and floating nutrition numbers, orange gradient background, no text, clean design' },
    { id: 'receipt', prompt: 'Minimalist flat vector illustration, grocery receipt paper with laser scanning line and product icons floating out, teal gradient background, no text, modern app style' },
    { id: 'finance', prompt: 'Minimalist flat vector illustration, coins stack and vegetables with pie chart diagram, lime green gradient background, budget tracking theme, no text, clean modern design' },
    { id: 'health', prompt: 'Minimalist flat vector illustration, heart icon connected to health device icons with sync arrows, red gradient background, health sync theme, no text, modern style' },
    { id: 'goals', prompt: 'Minimalist flat vector illustration, target bullseye with achievement rings and trophy, purple gradient background, fitness goals theme, no text, modern app design' },
    { id: 'charts', prompt: 'Minimalist flat vector illustration, line graphs and bar charts showing upward progress, cyan gradient background, data visualization theme, no text, clean modern style' },
    { id: 'offline', prompt: 'Minimalist flat vector illustration, cloud icon with sync arrows and smartphone, slate gray gradient background, offline functionality theme, no text, modern app design' }
];

const OUTPUT_DIR = path.join(__dirname, '../public/land/covers');

async function generateCover(feature) {
    console.log(`\nGenerating: ${feature.id}...`);
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: feature.prompt,
            config: { numberOfImages: 1, aspectRatio: '16:9' }
        });
        if (response.generatedImages?.[0]?.image?.imageBytes) {
            const buffer = Buffer.from(response.generatedImages[0].image.imageBytes, 'base64');
            const filepath = path.join(OUTPUT_DIR, `${feature.id}.png`);
            fs.writeFileSync(filepath, buffer);
            console.log(`  ✓ ${feature.id}.png (${Math.round(buffer.length / 1024)}KB)`);
            return filepath;
        }
        console.log(`  ✗ No image for ${feature.id}`);
        return null;
    } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
        return null;
    }
}

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('Generating covers with Imagen 4.0...\n');
    let success = 0;
    for (const feature of features) {
        if (await generateCover(feature)) success++;
        await new Promise(r => setTimeout(r, 1500));
    }
    console.log(`\nDone: ${success}/${features.length} images`);
}

main().catch(console.error);
