import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Campaign } from '@/types';

const campaignsFilePath = path.join(process.cwd(), 'data', 'campaigns.json');

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const condominiumId = searchParams.get('condominiumId');

    const data = await fs.readFile(campaignsFilePath, 'utf-8');
    let campaigns: Campaign[] = JSON.parse(data);

    if (condominiumId) {
      campaigns = campaigns.filter(c => c.condominiumId === condominiumId);
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
    const { condominiumId, name, startDate, endDate, isActive, newsEveryNMedia, newsDurationSeconds } = body;

    // Validate minimum news duration
    const validNewsDuration = newsDurationSeconds !== undefined && newsDurationSeconds !== null
      ? Math.max(5, newsDurationSeconds)
      : undefined;

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      condominiumId,
      name,
      startDate,
      endDate,
      isActive: isActive ?? false,
      newsEveryNMedia,
      newsDurationSeconds: validNewsDuration,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let campaigns: Campaign[] = [];
    try {
      const data = await fs.readFile(campaignsFilePath, 'utf-8');
      campaigns = JSON.parse(data);
    } catch {
      campaigns = [];
    }

    campaigns.push(newCampaign);
    await fs.writeFile(campaignsFilePath, JSON.stringify(campaigns, null, 2));

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
