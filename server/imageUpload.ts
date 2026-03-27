import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { promises as fs } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'evidence');
const PROFILE_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'profiles');
const FEED_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'feed');
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// Ensure upload directory exists
export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

// Ensure profile upload directory exists
export async function ensureProfileUploadDir() {
  try {
    await fs.access(PROFILE_UPLOAD_DIR);
  } catch {
    await fs.mkdir(PROFILE_UPLOAD_DIR, { recursive: true });
  }
}

// Ensure feed upload directory exists (never cleaned up — feed images are permanent)
export async function ensureFeedUploadDir() {
  try {
    await fs.access(FEED_UPLOAD_DIR);
  } catch {
    await fs.mkdir(FEED_UPLOAD_DIR, { recursive: true });
  }
}

// Multer configuration for handling multipart/form-data
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Compress and save image
export async function compressAndSaveImage(buffer: Buffer, originalName: string): Promise<string> {
  await ensureUploadDir();

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const filename = `${timestamp}_${randomString}.webp`;
  const filepath = path.join(UPLOAD_DIR, filename);

  // Compress image to WebP format with quality optimization
  // .rotate() auto-corrects image orientation based on EXIF data
  // .withMetadata({ orientation: undefined }) strips EXIF orientation to prevent double-rotation
  await sharp(buffer)
    .rotate()
    .resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .withMetadata({ orientation: undefined })
    .webp({
      quality: 80,
      effort: 6,
    })
    .toFile(filepath);

  // Return relative path for storage
  return `/uploads/evidence/${filename}`;
}

// Compress profile image and return as base64 data URL (stored in DB — survives redeploys)
export async function compressAndSaveProfileImage(buffer: Buffer, userId: string): Promise<string> {
  // Compress and resize profile image to 500x500 WebP
  // .rotate() auto-corrects image orientation based on EXIF data
  // .withMetadata({ orientation: undefined }) strips EXIF orientation to prevent double-rotation
  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize(500, 500, {
      fit: 'cover',
      position: 'center',
    })
    .withMetadata({ orientation: undefined })
    .webp({
      quality: 85,
      effort: 6,
    })
    .toBuffer();

  // Return as base64 data URL — stored directly in the database so it never disappears
  return `data:image/webp;base64,${webpBuffer.toString('base64')}`;
}

// Compress and save feed post image (saved to /uploads/feed/ — never auto-deleted)
export async function compressAndSaveFeedImage(buffer: Buffer, originalName: string): Promise<string> {
  await ensureFeedUploadDir();

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(7);
  const filename = `${timestamp}_${randomString}.webp`;
  const filepath = path.join(FEED_UPLOAD_DIR, filename);

  await sharp(buffer)
    .rotate()
    .resize(1920, 1920, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .withMetadata({ orientation: undefined })
    .webp({
      quality: 80,
      effort: 6,
    })
    .toFile(filepath);

  return `/uploads/feed/${filename}`;
}

// Delete old evidence files (older than 24 hours)
export async function cleanupOldEvidence() {
  try {
    await ensureUploadDir();
    const files = await fs.readdir(UPLOAD_DIR);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    console.log(`[Cleanup] Checking ${files.length} evidence files for cleanup...`);
    let deletedCount = 0;

    for (const file of files) {
      const filepath = path.join(UPLOAD_DIR, file);
      const stats = await fs.stat(filepath);
      const ageHours = (now - stats.mtime.getTime()) / (60 * 60 * 1000);
      
      if (now - stats.mtime.getTime() > twentyFourHours) {
        await fs.unlink(filepath);
        deletedCount++;
        console.log(`[Cleanup] Deleted old evidence: ${file} (age: ${ageHours.toFixed(1)} hours)`);
      }
    }
    
    if (deletedCount === 0) {
      console.log('[Cleanup] No files older than 24 hours found');
    } else {
      console.log(`[Cleanup] Cleanup complete: deleted ${deletedCount} file(s)`);
    }
  } catch (error) {
    console.error('[Cleanup] Error cleaning up old evidence:', error);
  }
}

// Get file age in hours
export async function getFileAgeHours(filepath: string): Promise<number> {
  try {
    const stats = await fs.stat(filepath);
    const now = Date.now();
    return (now - stats.mtime.getTime()) / (60 * 60 * 1000);
  } catch {
    return 0;
  }
}
