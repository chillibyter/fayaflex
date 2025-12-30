import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function convertImage(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    console.log(`Converting: ${path.basename(inputPath)} (${metadata.width}x${metadata.height})`);
    
    await sharp(inputPath)
      .webp({ quality: 90 })
      .toFile(outputPath);
    
    const inputStats = fs.statSync(inputPath);
    const outputStats = fs.statSync(outputPath);
    const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
    console.log(`  ${(inputStats.size / 1024).toFixed(0)}KB -> ${(outputStats.size / 1024).toFixed(0)}KB (${reduction}% reduction)`);
  } catch (error) {
    console.error(`Error converting ${inputPath}:`, error.message);
  }
}

async function main() {
  const publicDir = path.join(__dirname, '../client/public');
  
  await convertImage(
    path.join(publicDir, 'fayaflex-logo.png'),
    path.join(publicDir, 'fayaflex-logo.webp')
  );
  
  await convertImage(
    path.join(publicDir, 'icon-192.png'),
    path.join(publicDir, 'icon-192.webp')
  );
  
  await convertImage(
    path.join(publicDir, 'icon-512.png'),
    path.join(publicDir, 'icon-512.webp')
  );
  
  console.log('\nDone! Now update references in code to use .webp files.');
}

main();
