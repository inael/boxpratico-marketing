import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { AnalyticsView } from '@/types';

const analyticsFilePath = path.join(process.cwd(), 'data', 'analytics.json');

export async function GET(request: NextRequest) {
  try {
    const data = await fs.readFile(analyticsFilePath, 'utf-8');
    const analytics: AnalyticsView[] = JSON.parse(data);

    // Sort by viewedAt descending (most recent first)
    const sortedAnalytics = analytics.sort((a, b) =>
      new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
    );

    return NextResponse.json(sortedAnalytics);
  } catch (error) {
    console.error('Failed to read analytics:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { condominiumId, condominiumName, campaignId, campaignName, ipAddress, viewDurationSeconds } = body;

    const newView: AnalyticsView = {
      id: Date.now().toString(),
      condominiumId,
      condominiumName,
      campaignId,
      campaignName,
      ipAddress,
      viewDurationSeconds,
      viewedAt: new Date().toISOString(),
    };

    let analytics: AnalyticsView[] = [];
    try {
      const data = await fs.readFile(analyticsFilePath, 'utf-8');
      analytics = JSON.parse(data);
    } catch {
      analytics = [];
    }

    analytics.push(newView);
    await fs.writeFile(analyticsFilePath, JSON.stringify(analytics, null, 2));

    return NextResponse.json(newView, { status: 201 });
  } catch (error) {
    console.error('Failed to create analytics entry:', error);
    return NextResponse.json(
      { error: 'Failed to create analytics entry' },
      { status: 500 }
    );
  }
}
