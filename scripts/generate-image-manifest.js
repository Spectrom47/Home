const fs = require('fs');
const path = require('path');
const imagesDir = path.join(__dirname, '..', 'images');
const outFile = path.join(imagesDir, 'manifest.json');

if (!fs.existsSync(imagesDir)) {
  console.error('images/ directory not found');
  process.exit(1);
}

const files = fs.readdirSync(imagesDir).filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
const arr = files.map(f => path.posix.join('images', f));
fs.writeFileSync(outFile, JSON.stringify(arr, null, 2) + '\n');
console.log('Wrote', outFile, 'with', arr.length, 'entries');
