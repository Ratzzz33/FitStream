// List available models
import { GoogleGenAI } from "@google/genai";
import * as fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const envMatch = envContent.match(/GEMINI_API_KEY=([^\n\r]+)/);
const API_KEY = envMatch ? envMatch[1].trim() : '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function listModels() {
    try {
        const pager = await ai.models.list();

        console.log('Available models:\n');

        for await (const model of pager) {
            // Filter for image-related models
            const name = model.name || '';
            const methods = model.supportedGenerationMethods || [];

            if (name.includes('image') || name.includes('imagen') || methods.includes('generateImages')) {
                console.log(`Name: ${name}`);
                console.log(`  Methods: ${methods.join(', ')}`);
                console.log('');
            }
        }

        console.log('\n--- All models with generateContent ---\n');

        const pager2 = await ai.models.list();
        for await (const model of pager2) {
            const name = model.name || '';
            const methods = model.supportedGenerationMethods || [];

            if (methods.includes('generateContent')) {
                console.log(`${name}: ${methods.join(', ')}`);
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
