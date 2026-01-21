import { NextRequest, NextResponse } from 'next/server';
import {
  getLibraryItemById,
  updateLibraryItem,
  deleteLibraryItem,
  getLibraryFolderById,
  updateLibraryFolder,
  deleteLibraryFolder,
} from '@/lib/database';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/library/[id] - Get a specific library item
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'folder' | null (item)

    if (type === 'folder') {
      const folder = await getLibraryFolderById(id);
      if (!folder) {
        return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 });
      }
      return NextResponse.json(folder);
    }

    const item = await getLibraryItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching library item:', error);
    return NextResponse.json({ error: 'Failed to fetch library item' }, { status: 500 });
  }
}

// PUT /api/library/[id] - Update a library item or folder
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if updating folder
    if (body.updateFolder) {
      const existing = await getLibraryFolderById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 });
      }

      const updated = await updateLibraryFolder(id, {
        name: body.name,
        slug: body.slug,
        parentId: body.parentId,
        color: body.color,
        icon: body.icon,
        advertiserId: body.advertiserId,
      });

      return NextResponse.json(updated);
    }

    // Updating library item
    const existing = await getLibraryItemById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    const updated = await updateLibraryItem(id, {
      name: body.name,
      fileUrl: body.fileUrl,
      fileType: body.fileType,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      width: body.width,
      height: body.height,
      duration: body.duration,
      thumbnailUrl: body.thumbnailUrl,
      folder: body.folder,
      tags: body.tags,
      description: body.description,
      advertiserId: body.advertiserId,
      usageCount: body.usageCount,
      lastUsedAt: body.lastUsedAt,
      isActive: body.isActive,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating library item:', error);
    return NextResponse.json({ error: 'Failed to update library item' }, { status: 500 });
  }
}

// DELETE /api/library/[id] - Delete a library item or folder
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'folder' | null (item)

    if (type === 'folder') {
      const existing = await getLibraryFolderById(id);
      if (!existing) {
        return NextResponse.json({ error: 'Pasta não encontrada' }, { status: 404 });
      }
      await deleteLibraryFolder(id);
      return NextResponse.json({ success: true });
    }

    const existing = await getLibraryItemById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 });
    }

    await deleteLibraryItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting library item:', error);
    return NextResponse.json({ error: 'Failed to delete library item' }, { status: 500 });
  }
}
