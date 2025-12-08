import { NextRequest, NextResponse } from 'next/server';
import { getMonitors, getMonitorBySlug, getMonitorsByCondominiumId, updateMonitor } from '@/lib/database';

// POST - Monitor sends heartbeat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monitorSlug } = body;

    if (!monitorSlug) {
      return NextResponse.json(
        { error: 'monitorSlug é obrigatório' },
        { status: 400 }
      );
    }

    const monitor = await getMonitorBySlug(monitorSlug);

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    const lastHeartbeat = new Date().toISOString();
    await updateMonitor(monitor.id, {
      lastHeartbeat,
      isOnline: true,
    });

    return NextResponse.json({ success: true, lastHeartbeat });
  } catch (error) {
    console.error('Failed to update heartbeat:', error);
    return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
  }
}

// GET - Get monitors status (checks if online based on last heartbeat)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const condominiumId = searchParams.get('condominiumId');

    let monitors;
    if (condominiumId) {
      monitors = await getMonitorsByCondominiumId(condominiumId);
    } else {
      monitors = await getMonitors();
    }

    // Update online status based on last heartbeat (offline if > 30 seconds)
    const now = new Date();
    const OFFLINE_THRESHOLD = 30 * 1000; // 30 seconds

    const updatedMonitors = await Promise.all(
      monitors.map(async (monitor) => {
        if (monitor.lastHeartbeat) {
          const lastHeartbeat = new Date(monitor.lastHeartbeat);
          const diff = now.getTime() - lastHeartbeat.getTime();
          const isOnline = diff < OFFLINE_THRESHOLD;

          if (monitor.isOnline !== isOnline) {
            await updateMonitor(monitor.id, { isOnline });
          }

          return { ...monitor, isOnline };
        }
        return { ...monitor, isOnline: false };
      })
    );

    return NextResponse.json(updatedMonitors);
  } catch (error) {
    console.error('Failed to get monitors status:', error);
    return NextResponse.json([], { status: 200 });
  }
}
