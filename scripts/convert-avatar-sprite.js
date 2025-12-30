import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function convertAvatarSprite() {
  const inputPath = path.join(__dirname, '../attached_assets/FayaFlex_Avatar_Set_Complete_1767126826141.png');
  const outputPath = path.join(__dirname, '../public/avatars-sprite.webp');
  
  try {
    const metadata = await sharp(inputPath).metadata();
    console.log('Original image:', metadata.width, 'x', metadata.height, 'format:', metadata.format);
    
    await sharp(inputPath)
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    const outputMetadata = await sharp(outputPath).metadata();
    console.log('Converted to WebP:', outputMetadata.width, 'x', outputMetadata.height);
    console.log('Saved to:', outputPath);
  } catch (error) {
    console.error('Error converting image:', error);
  }
}

convertAvatarSprite();
