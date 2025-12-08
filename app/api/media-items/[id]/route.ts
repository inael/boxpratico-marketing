import { NextRequest, NextResponse } from 'next/server';
import { getMediaItemById, updateMediaItem, deleteMediaItem } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaItem = await getMediaItemById(id);

    if (!mediaItem) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mediaItem);
  } catch (error) {
    console.error('Failed to fetch media item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const mediaItem = await updateMediaItem(id, body);

    if (!mediaItem) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mediaItem);
  } catch (error) {
    console.error('Failed to update media item:', error);
    return NextResponse.json(
      { error: 'Failed to update media item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteMediaItem(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Media item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete media item:', error);
    return NextResponse.json(
      { error: 'Failed to delete media item' },
      { status: 500 }
    );
  }
}
