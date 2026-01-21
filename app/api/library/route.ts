import { NextRequest, NextResponse } from 'next/server';
import { getLibraryItems, createLibraryItem, getLibraryFolders, createLibraryFolder } from '@/lib/database';
import { LibraryFileType } from '@/types';

// Helper para detectar tipo de arquivo
function detectFileType(mimeType: string): LibraryFileType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  return 'other';
}

// GET /api/library - List library items and folders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'items' | 'folders' | null (both)
    const fileType = searchParams.get('fileType');
    const folder = searchParams.get('folder');
    const advertiserId = searchParams.get('advertiserId');
    const search = searchParams.get('search');

    if (type === 'folders') {
      let folders = await getLibraryFolders();
      if (advertiserId) {
        folders = folders.filter(f => f.advertiserId === advertiserId || !f.advertiserId);
      }
      folders.sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(folders);
    }

    let items = await getLibraryItems();

    // Filters
    if (fileType) {
      items = items.filter(i => i.fileType === fileType);
    }
    if (folder) {
      items = items.filter(i => i.folder === folder);
    }
    if (advertiserId) {
      items = items.filter(i => i.advertiserId === advertiserId || !i.advertiserId);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(searchLower) ||
        i.description?.toLowerCase().includes(searchLower) ||
        i.tags?.some(t => t.toLowerCase().includes(searchLower))
      );
    }

    // Sort by most recent
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (type === 'items') {
      return NextResponse.json(items);
    }

    // Return both
    const folders = await getLibraryFolders();
    return NextResponse.json({ items, folders });
  } catch (error) {
    console.error('Error fetching library:', error);
    return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
  }
}

// POST /api/library - Create library item or folder
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if creating folder
    if (body.createFolder) {
      if (!body.name || !body.slug) {
        return NextResponse.json(
          { error: 'Nome e slug são obrigatórios para criar pasta' },
          { status: 400 }
        );
      }

      const folder = await createLibraryFolder({
        name: body.name,
        slug: body.slug,
        parentId: body.parentId,
        color: body.color || '#3B82F6',
        icon: body.icon || '📁',
        advertiserId: body.advertiserId,
      });

      return NextResponse.json(folder, { status: 201 });
    }

    // Creating library item
    if (!body.name || !body.fileUrl) {
      return NextResponse.json(
        { error: 'Nome e URL do arquivo são obrigatórios' },
        { status: 400 }
      );
    }

    const fileType = body.fileType || detectFileType(body.mimeType || '');

    const item = await createLibraryItem({
      name: body.name,
      fileUrl: body.fileUrl,
      fileType,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      width: body.width,
      height: body.height,
      duration: body.duration,
      thumbnailUrl: body.thumbnailUrl,
      folder: body.folder,
      tags: body.tags || [],
      description: body.description || '',
      advertiserId: body.advertiserId,
      usageCount: 0,
      isActive: true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating library item:', error);
    return NextResponse.json({ error: 'Failed to create library item' }, { status: 500 });
  }
}
