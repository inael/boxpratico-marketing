import { NextRequest, NextResponse } from 'next/server';
import { getMediaItems, createMediaItem, getMediaItemsByCondominiumId, getMediaItemsByCampaignId } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const condominiumId = searchParams.get('condominiumId');
    const campaignId = searchParams.get('campaignId');

    if (condominiumId) {
      const mediaItems = await getMediaItemsByCondominiumId(condominiumId);
      return NextResponse.json(mediaItems);
    }

    if (campaignId) {
      const mediaItems = await getMediaItemsByCampaignId(campaignId);
      return NextResponse.json(mediaItems);
    }

    const mediaItems = await getMediaItems();
    return NextResponse.json(mediaItems);
  } catch (error) {
    console.error('Failed to fetch media items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, type, sourceUrl, durationSeconds, isActive, order, condominiumId, campaignId } = body;

    if (!title || !type || !sourceUrl || !condominiumId) {
      return NextResponse.json(
        { error: 'Title, type, sourceUrl, and condominiumId are required' },
        { status: 400 }
      );
    }

    const mediaItem = await createMediaItem({
      title,
      description,
      type,
      sourceUrl,
      durationSeconds,
      isActive: isActive ?? true,
      order: order ?? 0,
      condominiumId,
      campaignId,
    });

    return NextResponse.json(mediaItem, { status: 201 });
  } catch (error) {
    console.error('Failed to create media item:', error);
    return NextResponse.json(
      { error: 'Failed to create media item' },
      { status: 500 }
    );
  }
}
