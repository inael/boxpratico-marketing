import { NextRequest, NextResponse } from 'next/server';
import { getMonitors, getMonitorsByCondominiumId, getMonitorBySlug, createMonitor } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const condominiumId = searchParams.get('condominiumId');
    const slug = searchParams.get('slug');

    if (slug) {
      const monitor = await getMonitorBySlug(slug);
      return NextResponse.json(monitor ? [monitor] : []);
    }

    let monitors;
    if (condominiumId) {
      monitors = await getMonitorsByCondominiumId(condominiumId);
    } else {
      monitors = await getMonitors();
    }

    return NextResponse.json(monitors);
  } catch (error) {
    console.error('Failed to read monitors:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, location, condominiumId, isActive } = body;

    if (!name || !slug || !condominiumId) {
      return NextResponse.json(
        { error: 'Nome, slug e condomínio são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingMonitor = await getMonitorBySlug(slug);
    if (existingMonitor) {
      return NextResponse.json(
        { error: 'Já existe um monitor com este slug' },
        { status: 400 }
      );
    }

    const monitor = await createMonitor({
      name,
      slug,
      location: location || '',
      condominiumId,
      isActive: isActive ?? true,
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    console.error('Failed to create monitor:', error);
    return NextResponse.json(
      { error: 'Failed to create monitor' },
      { status: 500 }
    );
  }
}
