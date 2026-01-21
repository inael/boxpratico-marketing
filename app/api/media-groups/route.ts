import { NextRequest, NextResponse } from 'next/server';
import { getMediaGroups, createMediaGroup, getMediaGroupBySlug } from '@/lib/database';

// GET /api/media-groups - List all media groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const advertiserId = searchParams.get('advertiserId');

    let groups = await getMediaGroups();

    // Filter by advertiser if specified
    if (advertiserId) {
      groups = groups.filter(g => g.advertiserId === advertiserId);
    }

    // Sort by name
    groups.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching media groups:', error);
    return NextResponse.json({ error: 'Failed to fetch media groups' }, { status: 500 });
  }
}

// POST /api/media-groups - Create a new media group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Nome e slug são obrigatórios' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingGroup = await getMediaGroupBySlug(body.slug);
    if (existingGroup) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este slug' },
        { status: 400 }
      );
    }

    const group = await createMediaGroup({
      name: body.name,
      slug: body.slug,
      description: body.description || '',
      color: body.color || '#3B82F6',
      icon: body.icon || '',
      tags: body.tags || [],
      advertiserId: body.advertiserId || undefined,
      mediaIds: body.mediaIds || [],
      mediaOrder: body.mediaOrder || {},
      displayMode: body.displayMode || 'sequential',
      schedule: body.schedule || { enabled: false },
      isActive: body.isActive !== false,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating media group:', error);
    return NextResponse.json({ error: 'Failed to create media group' }, { status: 500 });
  }
}
