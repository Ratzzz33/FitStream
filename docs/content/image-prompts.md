# Image Generation Prompts for FitStream Landing

## Инструкция по генерации

### Gemini Imagen 3 API
```javascript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generateImage(prompt) {
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      aspectRatio: '16:9', // для covers
      // aspectRatio: '1:1', // для tiles
    },
  });
  return response.generatedImages[0].image.imageBytes;
}
```

---

## Cover Images (16:9)

### poseTracking
```
Minimalist 3D illustration of a smartphone showing AI pose detection overlay on a person doing squats. Glowing blue skeleton wireframe on the body. Purple-violet gradient background. Modern fitness app aesthetic. Soft ambient lighting. No text.
```

### exercises
```
Minimalist 3D illustration showing 6 floating exercise icons: dumbbell, squatting figure, push-up figure, plank pose, lunges, jumping jacks. Clean white and blue gradient background. Modern fitness app style. Soft shadows. No text.
```

### smartKitchen
```
Minimalist 3D illustration of an open refrigerator with AI scanning beam analyzing products inside. Floating product icons with checkmarks. Warm amber and orange gradient background. Modern smart home aesthetic. No text.
```

### cookingMode
```
Minimalist 3D illustration of a smartphone showing step-by-step recipe with timer. Steam rising from a pot. Floating ingredient icons. Warm rose-red gradient background. Cozy cooking atmosphere. No text.
```

### nutritionScanner
```
Minimalist 3D illustration of a smartphone camera scanning a plate of food. Floating calorie and macro numbers. Credit card as reference object nearby. Orange gradient background. Modern health app style. No text.
```

### smartScale
```
Minimalist 3D illustration of a smart bathroom scale with holographic body composition data floating above. Weight, body fat percentage, muscle mass icons. Emerald green gradient background. Futuristic health tech aesthetic. No text.
```

### healthIntegrations
```
Minimalist 3D illustration showing three connected health app logos (heart, activity ring, fitness icon) with data streams flowing between them. Red and pink gradient background. Health ecosystem visualization. No text.
```

### offlineFirst
```
Minimalist 3D illustration of a smartphone with a cloud icon and checkmark, showing offline sync. Mountains and airplane in background suggesting remote locations. Slate gray gradient background. Reliable tech aesthetic. No text.
```

### multiLanguage
```
Minimalist 3D illustration of a globe with 6 national flags floating around it (US, Russia, Spain, France, Germany, China). Language bubbles. Blue gradient background. Global communication aesthetic. No text.
```

### multiPlatform
```
Minimalist 3D illustration showing iPhone, Android phone, laptop, and Telegram icon all connected with sync lines. Same fitness app interface on each. Blue-green gradient background. Cross-platform harmony. No text.
```

### aiCoach
```
Minimalist 3D illustration of a friendly AI coach avatar (abstract humanoid) with speech bubble containing motivational sparkles. Two voice waveforms (male/female). Purple-blue gradient background. Supportive AI aesthetic. No text.
```

### smartShopping
```
Minimalist 3D illustration of a shopping cart with AI scanner beam checking products. Floating shopping list with checkmarks. Store shelf in background. Pink-magenta gradient background. Smart shopping aesthetic. No text.
```

### foodFinance
```
Minimalist 3D illustration of a piggy bank with food items (groceries) and money coins. Chart showing savings trend. Lime-green gradient background. Financial wellness aesthetic. No text.
```

### receiptScanning
```
Minimalist 3D illustration of a smartphone camera scanning a paper receipt. Extracted product items floating out with prices. Teal gradient background. OCR technology aesthetic. No text.
```

### gamification
```
Minimalist 3D illustration of a trophy with achievement badges, streak fire icon, and leaderboard podium. Confetti particles. Gold and amber gradient background. Celebration and competition aesthetic. No text.
```

### charts
```
Minimalist 3D illustration of floating analytics charts: line graph trending up, bar chart, pie chart for body composition. Cyan-blue gradient background. Data visualization aesthetic. No text.
```

---

## Tile Images (1:1) — по 4 на каждую функцию

### poseTracking tiles
```
1. realtime: Minimalist icon of an eye with AI circuit pattern. Violet background. "Real-time detection" concept.
2. exercises: Minimalist icon of a grid showing 15 exercise pose silhouettes. Violet background.
3. feedback: Minimalist icon of a checkmark with body pose outline. Green accent on violet.
4. counting: Minimalist icon of numbers 1-2-3 with circular progress. Violet background.
```

### smartKitchen tiles
```
1. scan: Minimalist icon of camera viewfinder scanning a product. Amber background.
2. expiry: Minimalist icon of calendar with warning triangle. Amber background.
3. recipes: Minimalist icon of a chef hat with sparkle. Amber background.
4. shopping: Minimalist icon of shopping basket with plus sign. Amber background.
```

### cookingMode tiles
```
1. steps: Minimalist icon of numbered list 1-2-3 with arrow. Rose background.
2. timers: Minimalist icon of stopwatch/timer with play button. Rose background.
3. reminders: Minimalist icon of bell with spoon/spatula. Rose background.
4. calories: Minimalist icon of flame with number. Rose background.
```

### nutritionScanner tiles
```
1. photo: Minimalist icon of camera with food plate. Orange background.
2. reference: Minimalist icon of credit card with ruler marks. Orange background.
3. macros: Minimalist icon of pie chart with P/F/C sections. Orange background.
4. history: Minimalist icon of calendar with food entries. Orange background.
```

### smartScale tiles
```
1. bluetooth: Minimalist icon of Bluetooth symbol with scale. Emerald background.
2. metrics: Minimalist icon of body silhouette with data points. Emerald background.
3. charts: Minimalist icon of trending line graph. Emerald background.
4. sync: Minimalist icon of circular arrows with cloud. Emerald background.
```

### healthIntegrations tiles
```
1. googlefit: Minimalist icon resembling Google Fit activity rings. Red background.
2. applehealth: Minimalist icon resembling Apple Health heart. Red background.
3. samsung: Minimalist icon resembling Samsung Health flower. Red background.
4. metrics: Minimalist icon of heart rate pulse with data. Red background.
```

### offlineFirst tiles
```
1. offline: Minimalist icon of cloud with X mark, device with checkmark. Slate background.
2. storage: Minimalist icon of device with database layers. Slate background.
3. sync: Minimalist icon of cloud with bidirectional arrows. Slate background.
4. reliable: Minimalist icon of shield with checkmark. Slate background.
```

### multiLanguage tiles
```
1. auto: Minimalist icon of globe with magic wand/auto sparkle. Blue background.
2. switch: Minimalist icon of toggle switch with language codes. Blue background.
3. interface: Minimalist icon of app screen with translated text lines. Blue background.
4. content: Minimalist icon of document with multiple language flags. Blue background.
```

### multiPlatform tiles
```
1. ios: Minimalist icon of iPhone silhouette. Blue-cyan background.
2. android: Minimalist icon of Android phone silhouette. Blue-cyan background.
3. web: Minimalist icon of browser window. Blue-cyan background.
4. telegram: Minimalist icon of Telegram paper plane. Blue-cyan background.
```

### aiCoach tiles
```
1. motivation: Minimalist icon of speech bubble with star/sparkle. Purple background.
2. voice: Minimalist icon of sound waves from speaker. Purple background.
3. personas: Minimalist icon of two abstract face silhouettes (M/F). Purple background.
4. adaptive: Minimalist icon of brain with progress arrow. Purple background.
```

### smartShopping tiles
```
1. planning: Minimalist icon of calendar with meal icons. Pink background.
2. lists: Minimalist icon of checklist with groceries. Pink background.
3. verify: Minimalist icon of camera with checkmark on product. Pink background.
4. scan: Minimalist icon of store shelf with scan beam. Pink background.
```

### foodFinance tiles
```
1. expenses: Minimalist icon of wallet with receipt. Lime background.
2. compare: Minimalist icon of house vs restaurant fork. Lime background.
3. reports: Minimalist icon of document with chart. Lime background.
4. savings: Minimalist icon of piggy bank with upward arrow. Lime background.
```

### receiptScanning tiles
```
1. scan: Minimalist icon of receipt with camera viewfinder. Teal background.
2. extract: Minimalist icon of receipt with items floating out. Teal background.
3. prices: Minimalist icon of price tag with currency symbol. Teal background.
4. history: Minimalist icon of folder with receipts. Teal background.
```

### gamification tiles
```
1. achievements: Minimalist icon of badge/medal with star. Gold background.
2. streaks: Minimalist icon of fire with number. Gold background.
3. leaderboard: Minimalist icon of podium with 1-2-3. Gold background.
4. challenges: Minimalist icon of target with lightning bolt. Gold background.
```

### charts tiles
```
1. weight: Minimalist icon of line graph trending down with scale. Cyan background.
2. calories: Minimalist icon of bar chart with flame. Cyan background.
3. workouts: Minimalist icon of activity rings/donut chart. Cyan background.
4. export: Minimalist icon of document with arrow out. Cyan background.
```

---

## Генерация скриптом

Создай скрипт `scripts/generate-feature-images.ts` который:
1. Читает промпты из этого файла
2. Генерирует через Gemini Imagen 3
3. Сохраняет в `landing/covers/` и `landing/covers/tiles/`

