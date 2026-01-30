import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = "AIzaSyAF1MbCqcLIaOboSnHS0YU-qEmLYYOCGaQ";

async function generateIcon(prompt, filename) {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    console.log(`\n🎨 Generating: ${filename}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

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
        console.error("❌ Error:", error.message || error);
        return false;
    }
}

async function main() {
    console.log("🚀 Generating Icons v2 - Dark theme compatible\n");

    // Icon 1: Refrigerator - flat design, dark background friendly
    await generateIcon(
        "Minimal flat vector icon of a modern refrigerator, soft cyan and blue gradient colors, simple geometric shapes, no background, isolated object, app icon style, clean design, no shadows, no text, centered",
        "kitchen-v2.png"
    );

    // Icon 2: Cooking pot on stove - flat design
    await generateIcon(
        "Minimal flat vector icon of a cooking pot with steam on a gas stove flame, warm orange red gradient colors, simple geometric shapes, no background, isolated object, app icon style, clean design, no shadows, no text, centered",
        "cooking-v2.png"
    );

    console.log("\n✨ Done!");
}

main();
