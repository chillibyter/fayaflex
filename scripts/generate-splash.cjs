const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '..', 'attached_assets', 'FayaFlex_AppIcon_v2_Flame_1772396089031.png');
const GREEN_BG = { r: 16, g: 163, b: 127, alpha: 255 };

const androidSizes = {
  'drawable-port-mdpi': { w: 480, h: 800, logo: 200 },
  'drawable-port-hdpi': { w: 720, h: 1280, logo: 300 },
  'drawable-port-xhdpi': { w: 960, h: 1600, logo: 400 },
  'drawable-port-xxhdpi': { w: 1440, h: 2560, logo: 500 },
  'drawable-port-xxxhdpi': { w: 1920, h: 3200, logo: 600 },
  'drawable-land-mdpi': { w: 800, h: 480, logo: 200 },
  'drawable-land-hdpi': { w: 1280, h: 720, logo: 300 },
  'drawable-land-xhdpi': { w: 1600, h: 960, logo: 400 },
  'drawable-land-xxhdpi': { w: 2560, h: 1440, logo: 500 },
  'drawable-land-xxxhdpi': { w: 3200, h: 1920, logo: 600 },
};

async function generateSplash(width, height, logoSize, outputPath) {
  const logo = await sharp(SOURCE)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: GREEN_BG,
    }
  })
    .composite([{
      input: logo,
      gravity: 'centre',
    }])
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath} (${width}x${height})`);
}

async function main() {
  // Android splash screens
  for (const [dir, size] of Object.entries(androidSizes)) {
    const outDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', dir);
    fs.mkdirSync(outDir, { recursive: true });
    await generateSplash(size.w, size.h, size.logo, path.join(outDir, 'splash.png'));
  }

  // Android drawable (default)
  const drawableDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });
  await generateSplash(480, 800, 200, path.join(drawableDir, 'splash.png'));

  // iOS splash screens (2732x2732 for all scales)
  const iosDir = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'Splash.imageset');
  fs.mkdirSync(iosDir, { recursive: true });
  await generateSplash(2732, 2732, 800, path.join(iosDir, 'splash-2732x2732.png'));
  await generateSplash(2732, 2732, 800, path.join(iosDir, 'splash-2732x2732-1.png'));
  await generateSplash(2732, 2732, 800, path.join(iosDir, 'splash-2732x2732-2.png'));

  console.log('\nAll splash screens generated successfully!');
}

main().catch(console.error);
