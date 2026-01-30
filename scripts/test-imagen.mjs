// Test Gemini Image Generation API
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

console.log('Starting Imagen test...');

// Read API key from .env
const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = envMatch ? envMatch[1].trim() : '';

if (!API_KEY) {
    console.error('Error: API Key not found');
    process.exit(1);
}

console.log('API Key found:', API_KEY.substring(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function testGenerate() {
    try {
        console.log('Attempting to generate image...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: ['A simple blue circle on white background, minimalist, no text'],
        });

        console.log('Response received:', JSON.stringify(response, null, 2).substring(0, 500));

        if (response.parts) {
            for (const part of response.parts) {
                if (part.inlineData) {
                    console.log('Image data received!');
                    const buffer = Buffer.from(part.inlineData.data, 'base64');
                    fs.writeFileSync('test-image.png', buffer);
                    console.log('Image saved to test-image.png');
                    return;
                }
            }
        }

        console.log('No image in response');
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
    }
}

testGenerate();
