import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <g fill="white" transform="translate(96, 140)">
    <rect x="0" y="80" width="40" height="72" rx="8"/>
    <rect x="280" y="80" width="40" height="72" rx="8"/>
    <rect x="40" y="56" width="32" height="120" rx="6"/>
    <rect x="248" y="56" width="32" height="120" rx="6"/>
    <rect x="72" y="96" width="176" height="40" rx="4"/>
    <path d="M100 200 L140 200 L160 160 L180 240 L200 180 L220 200 L260 200"
          stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  </g>
</svg>`;

// Maskable icon has more padding (safe zone)
const svgMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6"/>
      <stop offset="100%" style="stop-color:#1d4ed8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g fill="white" transform="translate(128, 172) scale(0.5)">
    <rect x="0" y="80" width="40" height="72" rx="8"/>
    <rect x="280" y="80" width="40" height="72" rx="8"/>
    <rect x="40" y="56" width="32" height="120" rx="6"/>
    <rect x="248" y="56" width="32" height="120" rx="6"/>
    <rect x="72" y="96" width="176" height="40" rx="4"/>
    <path d="M100 200 L140 200 L160 160 L180 240 L200 180 L220 200 L260 200"
          stroke="white" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>
  </g>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  await mkdir(iconsDir, { recursive: true });

  // Generate regular icons
  for (const size of sizes) {
    const buffer = Buffer.from(svgIcon);
    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Generate maskable icons
  for (const size of [192, 512]) {
    const buffer = Buffer.from(svgMaskable);
    await sharp(buffer)
      .resize(size, size)
      .png()
      .toFile(join(iconsDir, `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }

  // Generate apple touch icon (180x180)
  const buffer = Buffer.from(svgIcon);
  await sharp(buffer)
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Save SVG as well
  await writeFile(join(iconsDir, 'icon.svg'), svgIcon);
  console.log('Saved icon.svg');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
