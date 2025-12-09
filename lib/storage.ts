import { put, del } from '@vercel/blob';
import { createHash } from 'crypto';
import { getMediaByHash, setMediaHash, isRedisConfigured } from './redis';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

// Environment variable name from Vercel Blob integration
const BLOB_TOKEN = process.env.BLOB_BOXPRATICO_MARKETING_READ_WRITE_TOKEN;

// Check if Vercel Blob is configured
export function isBlobConfigured(): boolean {
  return !!BLOB_TOKEN;
}

// Calculate SHA-256 hash of a buffer
export function calculateHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

interface UploadResult {
  url: string;
  hash: string;
  isDuplicate: boolean;
}

// Upload file with deduplication
export async function uploadFile(
  file: File,
  options?: { folder?: string }
): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const hash = calculateHash(buffer);

  // Check for duplicate using hash (only if Redis is configured)
  if (isRedisConfigured()) {
    const existingUrl = await getMediaByHash(hash);
    if (existingUrl) {
      return {
        url: existingUrl,
        hash,
        isDuplicate: true,
      };
    }
  }

  let url: string;

  // Use Vercel Blob if configured, otherwise fallback to local storage
  if (isBlobConfigured()) {
    // Generate filename with hash prefix for organization
    const ext = path.extname(file.name);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = options?.folder
      ? `${options.folder}/${hash.substring(0, 8)}-${sanitizedName}`
      : `${hash.substring(0, 8)}-${sanitizedName}`;

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: file.type,
      token: BLOB_TOKEN,
    });

    url = blob.url;
  } else {
    // Fallback to local storage
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${hash.substring(0, 8)}-${timestamp}-${sanitizedName}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    url = `/uploads/${filename}`;
  }

  // Store hash mapping (only if Redis is configured)
  if (isRedisConfigured()) {
    await setMediaHash(hash, url);
  }

  return {
    url,
    hash,
    isDuplicate: false,
  };
}

// Delete file from storage
export async function deleteFile(url: string): Promise<void> {
  if (isBlobConfigured() && url.includes('blob.vercel-storage.com')) {
    await del(url, { token: BLOB_TOKEN });
  } else if (url.startsWith('/uploads/')) {
    // Local file deletion
    const filepath = path.join(process.cwd(), 'public', url);
    try {
      await unlink(filepath);
    } catch (error) {
      console.error('Failed to delete local file:', error);
    }
  }
}

// Get file info from URL
export function getFileInfo(url: string): { isBlob: boolean; isLocal: boolean } {
  return {
    isBlob: url.includes('blob.vercel-storage.com'),
    isLocal: url.startsWith('/uploads/'),
  };
}
