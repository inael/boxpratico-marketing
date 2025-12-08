import { NextRequest, NextResponse } from 'next/server';
import { getMonitorById, getMonitorBySlug, updateMonitor, deleteMonitor } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const monitor = await getMonitorById(id);

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Failed to read monitor:', error);
    return NextResponse.json({ error: 'Failed to read monitor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if slug already exists (excluding current monitor)
    if (body.slug) {
      const existingMonitor = await getMonitorBySlug(body.slug);
      if (existingMonitor && existingMonitor.id !== id) {
        return NextResponse.json(
          { error: 'Já existe um monitor com este slug' },
          { status: 400 }
        );
      }
    }

    const monitor = await updateMonitor(id, body);

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Failed to update monitor:', error);
    return NextResponse.json({ error: 'Failed to update monitor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteMonitor(id);

    if (!success) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete monitor:', error);
    return NextResponse.json({ error: 'Failed to delete monitor' }, { status: 500 });
  }
}
