import { NextRequest, NextResponse } from 'next/server';
import { getCampaignById, updateCampaign, deleteCampaign } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Failed to read campaign:', error);
    return NextResponse.json(
      { error: 'Failed to read campaign' },
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
    const { name, monitorId, startDate, endDate, isActive, showNews, newsEveryNMedia, newsDurationSeconds } = body;

    // Validate minimum news duration
    const validNewsDuration = newsDurationSeconds !== undefined && newsDurationSeconds !== null
      ? Math.max(5, newsDurationSeconds)
      : undefined;

    const campaign = await updateCampaign(id, {
      name,
      monitorId,
      startDate,
      endDate,
      isActive,
      showNews,
      newsEveryNMedia,
      newsDurationSeconds: validNewsDuration,
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
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
    const success = await deleteCampaign(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
