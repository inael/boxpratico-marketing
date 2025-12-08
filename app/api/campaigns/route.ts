import { NextRequest, NextResponse } from 'next/server';
import { getCampaigns, getCampaignsByCondominiumId, createCampaign } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const condominiumId = searchParams.get('condominiumId');

    let campaigns;
    if (condominiumId) {
      campaigns = await getCampaignsByCondominiumId(condominiumId);
    } else {
      campaigns = await getCampaigns();
    }

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Failed to read campaigns:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { condominiumId, name, monitorId, startDate, endDate, isActive, showNews, newsEveryNMedia, newsDurationSeconds } = body;

    // Validate minimum news duration
    const validNewsDuration = newsDurationSeconds !== undefined && newsDurationSeconds !== null
      ? Math.max(5, newsDurationSeconds)
      : undefined;

    const campaign = await createCampaign({
      condominiumId,
      name,
      monitorId,
      startDate,
      endDate,
      isActive: isActive ?? false,
      showNews,
      newsEveryNMedia,
      newsDurationSeconds: validNewsDuration,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
