import { NextRequest, NextResponse } from 'next/server';
import { getMediaItems, createMediaItem, getMediaItemsByCondominiumId } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const condominiumId = searchParams.get('condominiumId');

    if (condominiumId) {
      const mediaItems = getMediaItemsByCondominiumId(condominiumId);
      return NextResponse.json(mediaItems);
    }

    const mediaItems = getMediaItems();
    return NextResponse.json(mediaItems);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, sourceUrl, durationSeconds, isActive, order, condominiumId } = body;

    if (!title || !type || !sourceUrl || !condominiumId) {
      return NextResponse.json(
        { error: 'Title, type, sourceUrl, and condominiumId are required' },
        { status: 400 }
      );
    }

    const mediaItem = createMediaItem({
      title,
      description,
      type,
      sourceUrl,
      durationSeconds,
      isActive: isActive ?? true,
      order: order ?? 0,
      condominiumId,
    });

    return NextResponse.json(mediaItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    );
  }
}
