const fs = require('fs');
const path = require('path');

// Simple SVG icon template
const createIcon = (size) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.2}"/>
  <rect x="${size * 0.15}" y="${size * 0.1}" width="${size * 0.7}" height="${size * 0.8}"
        fill="#fef08a" rx="${size * 0.05}" stroke="#374151" stroke-width="${size * 0.02}"/>
  <line x1="${size * 0.25}" y1="${size * 0.3}" x2="${size * 0.75}" y2="${size * 0.3}"
        stroke="#374151" stroke-width="${size * 0.02}" stroke-linecap="round"/>
  <line x1="${size * 0.25}" y1="${size * 0.45}" x2="${size * 0.75}" y2="${size * 0.45}"
        stroke="#374151" stroke-width="${size * 0.02}" stroke-linecap="round"/>
  <line x1="${size * 0.25}" y1="${size * 0.6}" x2="${size * 0.6}" y2="${size * 0.6}"
        stroke="#374151" stroke-width="${size * 0.02}" stroke-linecap="round"/>
</svg>`;
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir);
}

// Generate SVG files (these can be used directly in manifest v3)
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const svg = createIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg);
  console.log(`Created icon${size}.svg`);
});

console.log('\n✅ SVG icons generated!');
console.log('\nNote: For PNG icons, you can:');
console.log('1. Use an online SVG to PNG converter');
console.log('2. Use ImageMagick: convert icon.svg icon.png');
console.log('3. Open the SVG files in a browser and screenshot them');
console.log('\nOr simply update manifest.json to use .svg instead of .png');
