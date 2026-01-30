// Simple test for Imagen API
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

console.log('Starting simple Imagen test...');

// Read API key
const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = envMatch ? envMatch[1].trim() : '';

if (!API_KEY) {
    console.error('No API key found');
    process.exit(1);
}

console.log('API Key:', API_KEY.substring(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function test() {
    try {
        console.log('Calling generateImages...');

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: 'A simple blue circle on white background',
            config: {
                numberOfImages: 1,
                aspectRatio: '1:1'
            }
        });

        console.log('Response received');
        console.log('Has generatedImages:', !!response.generatedImages);

        if (response.generatedImages && response.generatedImages.length > 0) {
            const img = response.generatedImages[0];
            console.log('Image object keys:', Object.keys(img));

            if (img.image?.imageBytes) {
                const buffer = Buffer.from(img.image.imageBytes, 'base64');
                fs.writeFileSync('test-imagen-output.png', buffer);
                console.log('SUCCESS! Image saved to test-imagen-output.png');
            } else if (img.raiFilteredReason) {
                console.log('Filtered:', img.raiFilteredReason);
            } else {
                console.log('No image bytes in response');
                console.log('Image object:', JSON.stringify(img, null, 2).substring(0, 500));
            }
        } else {
            console.log('No generatedImages in response');
            console.log('Full response:', JSON.stringify(response, null, 2).substring(0, 1000));
        }
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Error details:', error);
    }
}

test();
