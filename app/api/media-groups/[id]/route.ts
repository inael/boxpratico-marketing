import { NextRequest, NextResponse } from 'next/server';
import { getMediaGroupById, updateMediaGroup, deleteMediaGroup, getMediaGroupBySlug } from '@/lib/database';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/media-groups/[id] - Get a specific media group
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const group = await getMediaGroupById(id);

    if (!group) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error('Error fetching media group:', error);
    return NextResponse.json({ error: 'Failed to fetch media group' }, { status: 500 });
  }
}

// PUT /api/media-groups/[id] - Update a media group
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if group exists
    const existing = await getMediaGroupById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Check slug uniqueness if changing
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await getMediaGroupBySlug(body.slug);
      if (slugExists) {
        return NextResponse.json(
          { error: 'Já existe um grupo com este slug' },
          { status: 400 }
        );
      }
    }

    const updated = await updateMediaGroup(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      color: body.color,
      icon: body.icon,
      tags: body.tags,
      advertiserId: body.advertiserId,
      mediaIds: body.mediaIds,
      mediaOrder: body.mediaOrder,
      displayMode: body.displayMode,
      schedule: body.schedule,
      isActive: body.isActive,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating media group:', error);
    return NextResponse.json({ error: 'Failed to update media group' }, { status: 500 });
  }
}

// DELETE /api/media-groups/[id] - Delete a media group
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await getMediaGroupById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Grupo não encontrado' }, { status: 404 });
    }

    await deleteMediaGroup(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting media group:', error);
    return NextResponse.json({ error: 'Failed to delete media group' }, { status: 500 });
  }
}
