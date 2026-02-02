// Generate Telegram bot welcome image using Imagen 4.0
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';
import * as path from 'path';

console.log('🎨 Generating FitStream Telegram welcome image...');

// Read API key
const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = envMatch ? envMatch[1].trim() : '';

if (!API_KEY) {
    console.error('No GEMINI_API_KEY found in .env');
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const PROMPT = `
Square promotional image for fitness AI app, 4 large feature icons in 2x2 grid:

Icons (large, centered, filling the frame):
- Top-left: Camera with weight scale, neon blue glow
- Top-right: Shopping cart with checkmark, neon green glow
- Bottom-left: Menu card with heart, neon cyan glow
- Bottom-right: Refrigerator with fresh food, neon orange glow

Style:
- Deep space blue gradient background with subtle stars
- Large glassmorphism cards taking most of the space
- Bright neon glowing edges on each card
- Soft ambient particles
- No text, no labels, no numbers anywhere
- Icons should be big and clearly visible
- Modern tech aesthetic, premium quality

Square format, icons filling 80% of the image area.
`.trim();

async function generate() {
    try {
        console.log('📡 Calling Imagen 4.0...');
        console.log('Prompt:', PROMPT.substring(0, 100) + '...');

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: PROMPT,
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1'
            }
        });

        console.log('✅ Response received');

        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];

            if (img.image?.imageBytes) {
                const buffer = Buffer.from(img.image.imageBytes, 'base64');
                const outputPath = path.join('backend', 'assets', 'welcome-image-new.png');
                fs.writeFileSync(outputPath, buffer);
                console.log(`🖼️  Image saved to: ${outputPath}`);
                console.log('');
                console.log('To use this image:');
                console.log('  mv backend/assets/welcome-image-new.png backend/assets/welcome-image.png');
            } else if (img.raiFilteredReason) {
                console.log('⚠️  Image filtered:', img.raiFilteredReason);
            } else {
                console.log('❌ No image bytes in response');
                console.log('Response:', JSON.stringify(img, null, 2).substring(0, 500));
            }
        } else {
            console.log('❌ No generatedImages in response');
            console.log('Response:', JSON.stringify(response, null, 2).substring(0, 1000));
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('quota')) {
            console.log('💡 Tip: Imagen API has quota limits. Try again later.');
        }
    }
}

generate();
