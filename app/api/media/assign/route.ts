import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { MediaItem } from '@/types';

const mediaFilePath = path.join(process.cwd(), 'data', 'media-items.json');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mediaId, campaignId } = body;

    if (!mediaId) {
      return NextResponse.json(
        { error: 'mediaId is required' },
        { status: 400 }
      );
    }

    const data = await fs.readFile(mediaFilePath, 'utf-8');
    let mediaItems: MediaItem[] = JSON.parse(data);

    const index = mediaItems.findIndex(m => m.id === mediaId);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // If campaignId is null or undefined, we're removing the assignment
    mediaItems[index] = {
      ...mediaItems[index],
      campaignId: campaignId || undefined,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(mediaFilePath, JSON.stringify(mediaItems, null, 2));

    return NextResponse.json(mediaItems[index]);
  } catch (error) {
    console.error('Failed to assign media:', error);
    return NextResponse.json(
      { error: 'Failed to assign media' },
      { status: 500 }
    );
  }
}
