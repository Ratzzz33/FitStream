const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Simple SVG icons as base64-encoded data URIs aren't needed
// We'll just copy the SVG for now and rely on the browser to handle it
// The PWA manifest will reference the SVG icon

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

// Ensure directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Save SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon);
console.log('Saved icon.svg');

console.log('');
console.log('Note: PNG icons need to be generated manually or using an online tool.');
console.log('You can use https://realfavicongenerator.net/ or similar service');
console.log('to generate the following icons from the SVG:');
console.log('- icon-192.png');
console.log('- icon-512.png');
console.log('- icon-maskable-192.png');
console.log('- icon-maskable-512.png');
console.log('- apple-touch-icon.png');
