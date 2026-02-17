const fs = require('fs');
const path = require('path');
const imagesDir = path.join(__dirname, '..', 'images');
const outFile = path.join(imagesDir, 'manifest.json');

if (!fs.existsSync(imagesDir)) {
  console.error('images/ directory not found');
  process.exit(1);
}

function walk(dir) {
  const entries = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) entries.push(...walk(full));
    else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(name)) entries.push(full);
  }
  return entries;
}

const files = walk(imagesDir).map(f => path.posix.join('images', path.relative(imagesDir, f).split(path.sep).join('/')));
fs.writeFileSync(outFile, JSON.stringify(files, null, 2) + '\n');
console.log('Wrote', outFile, 'with', files.length, 'entries');
