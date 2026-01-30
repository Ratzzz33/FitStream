import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const API_KEY = "AIzaSyAF1MbCqcLIaOboSnHS0YU-qEmLYYOCGaQ";

async function generateIcon(prompt: string, filename: string) {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    console.log(`\n🎨 Generating: ${filename}`);
    console.log(`📝 Prompt: ${prompt}`);

    try {
        const response = await ai.models.generateImages({
            model: "imagen-4.0-generate-001",
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: "image/png",
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const imageData = response.generatedImages[0].image?.imageBytes;
            if (imageData) {
                const outputDir = path.join(__dirname, "..", "public", "icons");
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }

                const outputPath = path.join(outputDir, filename);
                fs.writeFileSync(outputPath, Buffer.from(imageData, "base64"));
                console.log(`✅ Saved: ${outputPath}`);
                return true;
            }
        }
        console.log("❌ No image generated");
        return false;
    } catch (error) {
        console.error("❌ Error:", error);
        return false;
    }
}

async function main() {
    console.log("🚀 Generating Liquid Style Icons for FitStream\n");

    // Icon 1: Refrigerator for "Кухня" (Kitchen)
    await generateIcon(
        "A modern refrigerator icon in liquid glass morphism style, translucent glossy surface with soft gradient blue and white colors, minimalist design, app icon style, clean background, 3D render, smooth reflections, no text",
        "kitchen-fridge-liquid.png"
    );

    // Icon 2: Cooking scene for "Что готовим?"
    await generateIcon(
        "A cooking pot on a gas stove with steam rising, liquid glass morphism style, translucent glossy surface with warm orange and red gradient colors, minimalist app icon design, clean background, 3D render, smooth reflections, no text",
        "cooking-pot-liquid.png"
    );

    // Alternative: Cutting board with knife
    await generateIcon(
        "A wooden cutting board with a chef knife, liquid glass morphism style, translucent glossy surface with warm brown and orange gradient, minimalist app icon design, clean background, 3D render, smooth reflections, no text",
        "cooking-board-liquid.png"
    );

    console.log("\n✨ Done! Check public/icons/ folder");
}

main();
