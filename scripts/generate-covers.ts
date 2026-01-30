/**
 * Generate cover images for landing page feature modals using Imagen 3 API
 * Run with: npx tsx scripts/generate-covers.ts
 */
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

// Load API key from .env file
const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = process.env.GEMINI_API_KEY || (envMatch ? envMatch[1].trim() : '');

if (!API_KEY) {
    console.error('Error: GEMINI_API_KEY not found');
    process.exit(1);
}

console.log('API Key found:', API_KEY.substring(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Feature definitions with image prompts
const features = [
    {
        id: 'pose',
        prompt: 'Minimalist flat vector illustration, person doing yoga pose with glowing neon points on joints, purple and violet gradient background, modern fitness app style, no text, clean simple geometric shapes, digital art'
    },
    {
        id: 'kitchen',
        prompt: 'Minimalist flat vector illustration, smart refrigerator with organized colorful food compartments, warm amber and orange gradient background, modern kitchen scene, no text, clean geometric design'
    },
    {
        id: 'cooking',
        prompt: 'Minimalist flat vector illustration, cooking pot with steam swirls and floating timer icon, rose pink gradient background, recipe visualization, no text, modern app style, clean shapes'
    },
    {
        id: 'coach',
        prompt: 'Minimalist flat vector illustration, friendly AI robot coach avatar with sound waves and stopwatch, blue gradient background, fitness training theme, no text, modern app design'
    },
    {
        id: 'scale',
        prompt: 'Minimalist flat vector illustration, bathroom scale with camera lens scanning beam above it, emerald green gradient background, weight tracking theme, no text, clean modern style'
    },
    {
        id: 'food',
        prompt: 'Minimalist flat vector illustration, plate of colorful food with camera frame overlay and floating nutrition numbers, orange gradient background, no text, clean design'
    },
    {
        id: 'receipt',
        prompt: 'Minimalist flat vector illustration, grocery receipt paper with laser scanning line and product icons floating out, teal gradient background, no text, modern app style'
    },
    {
        id: 'finance',
        prompt: 'Minimalist flat vector illustration, coins stack and vegetables with pie chart diagram, lime green gradient background, budget tracking theme, no text, clean modern design'
    },
    {
        id: 'health',
        prompt: 'Minimalist flat vector illustration, heart icon connected to health device icons with sync arrows, red gradient background, health sync theme, no text, modern style'
    },
    {
        id: 'goals',
        prompt: 'Minimalist flat vector illustration, target bullseye with achievement rings and trophy, purple gradient background, fitness goals theme, no text, modern app design'
    },
    {
        id: 'charts',
        prompt: 'Minimalist flat vector illustration, line graphs and bar charts showing upward progress, cyan gradient background, data visualization theme, no text, clean modern style'
    },
    {
        id: 'offline',
        prompt: 'Minimalist flat vector illustration, cloud icon with sync arrows and smartphone, slate gray gradient background, offline functionality theme, no text, modern app design'
    }
];

const OUTPUT_DIR = path.join(__dirname, '../public/land/covers');

async function generateCover(feature: typeof features[0]) {
    console.log(`\nGenerating cover for: ${feature.id}...`);
    console.log(`Prompt: ${feature.prompt.substring(0, 60)}...`);

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: feature.prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '16:9',
                includeRaiReason: true
            }
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];

            if (img.raiFilteredReason) {
                console.log(`  ⚠ Filtered: ${img.raiFilteredReason}`);
                return null;
            }

            if (img.image?.imageBytes) {
                const buffer = Buffer.from(img.image.imageBytes, 'base64');
                const filename = `${feature.id}.png`;
                const filepath = path.join(OUTPUT_DIR, filename);

                fs.writeFileSync(filepath, buffer);
                console.log(`  ✓ Saved: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
                return filepath;
            }
        }

        console.log(`  ✗ No image generated for ${feature.id}`);
        return null;
    } catch (error: any) {
        console.error(`  ✗ Error: ${error.message}`);
        if (error.message.includes('not found') || error.message.includes('404')) {
            console.error('    Model may not be available. Try enabling Imagen API in Google Cloud Console.');
        }
        return null;
    }
}

async function main() {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`Created directory: ${OUTPUT_DIR}`);
    }

    console.log('='.repeat(50));
    console.log('Starting cover image generation with Imagen 3');
    console.log('='.repeat(50));

    const results: { id: string; path: string | null }[] = [];

    for (const feature of features) {
        const result = await generateCover(feature);
        results.push({ id: feature.id, path: result });

        // Delay between requests to avoid rate limiting
        if (feature !== features[features.length - 1]) {
            console.log('  Waiting 2s before next request...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log('Generation Complete');
    console.log('='.repeat(50));

    const successful = results.filter(r => r.path);
    const failed = results.filter(r => !r.path);

    console.log(`✓ Success: ${successful.length}/${features.length}`);
    if (failed.length > 0) {
        console.log(`✗ Failed: ${failed.map(f => f.id).join(', ')}`);
    }
    console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
