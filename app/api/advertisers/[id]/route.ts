import { NextRequest, NextResponse } from 'next/server';
import { getAdvertiserById, updateAdvertiser, deleteAdvertiser } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advertiser = await getAdvertiserById(id);

    if (!advertiser) {
      return NextResponse.json(
        { error: 'Advertiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(advertiser);
  } catch (error) {
    console.error('Failed to fetch advertiser:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertiser' },
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

    const advertiser = await updateAdvertiser(id, body);

    if (!advertiser) {
      return NextResponse.json(
        { error: 'Advertiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(advertiser);
  } catch (error) {
    console.error('Failed to update advertiser:', error);
    return NextResponse.json(
      { error: 'Failed to update advertiser' },
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
    const success = await deleteAdvertiser(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Advertiser not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete advertiser:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertiser' },
      { status: 500 }
    );
  }
}
