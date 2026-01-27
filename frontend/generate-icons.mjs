import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const svgPath = './public/icons/icon.svg';
const outputDir = './public/icons';

const svgContent = fs.readFileSync(svgPath, 'utf8');

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Created: icon-${size}x${size}.png`);
  }
}

generateIcons().catch(console.error);
