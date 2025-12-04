import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Campaign } from '@/types';

const campaignsFilePath = path.join(process.cwd(), 'data', 'campaigns.json');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await fs.readFile(campaignsFilePath, 'utf-8');
    const campaigns: Campaign[] = JSON.parse(data);

    const campaign = campaigns.find(c => c.id === id);

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
    const { name, startDate, endDate, isActive, newsEveryNMedia, newsDurationSeconds } = body;

    // Validate minimum news duration
    const validNewsDuration = newsDurationSeconds !== undefined && newsDurationSeconds !== null
      ? Math.max(5, newsDurationSeconds)
      : undefined;

    const data = await fs.readFile(campaignsFilePath, 'utf-8');
    let campaigns: Campaign[] = JSON.parse(data);

    const index = campaigns.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    campaigns[index] = {
      ...campaigns[index],
      name: name ?? campaigns[index].name,
      startDate: startDate !== undefined ? startDate : campaigns[index].startDate,
      endDate: endDate !== undefined ? endDate : campaigns[index].endDate,
      isActive: isActive !== undefined ? isActive : campaigns[index].isActive,
      newsEveryNMedia: newsEveryNMedia !== undefined ? newsEveryNMedia : campaigns[index].newsEveryNMedia,
      newsDurationSeconds: validNewsDuration !== undefined ? validNewsDuration : campaigns[index].newsDurationSeconds,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(campaignsFilePath, JSON.stringify(campaigns, null, 2));

    return NextResponse.json(campaigns[index]);
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

    const data = await fs.readFile(campaignsFilePath, 'utf-8');
    let campaigns: Campaign[] = JSON.parse(data);

    const index = campaigns.findIndex(c => c.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    campaigns.splice(index, 1);

    await fs.writeFile(campaignsFilePath, JSON.stringify(campaigns, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
