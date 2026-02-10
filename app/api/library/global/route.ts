/**
 * API para Biblioteca Global
 *
 * GET  - Lista todos os itens globais (sem advertiserId)
 * POST - Cria novo item global (super admin apenas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLibraryItems, createLibraryItem } from '@/lib/database';

export async function GET() {
  try {
    const allItems = await getLibraryItems();
    // Itens globais: sem advertiserId e com tag 'biblioteca-global'
    const globalItems = allItems.filter(
      item => !item.advertiserId && item.tags?.includes('biblioteca-global')
    );

    return NextResponse.json(globalItems);
  } catch (error) {
    console.error('Failed to fetch global library:', error);
    return NextResponse.json({ error: 'Failed to fetch global library' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || !body.fileUrl) {
      return NextResponse.json(
        { error: 'Nome e URL do arquivo sao obrigatorios' },
        { status: 400 }
      );
    }

    // Garantir que tags incluem 'biblioteca-global'
    const tags = Array.isArray(body.tags) ? body.tags : [];
    if (!tags.includes('biblioteca-global')) {
      tags.push('biblioteca-global');
    }

    const item = await createLibraryItem({
      name: body.name,
      fileUrl: body.fileUrl,
      fileType: body.fileType || 'image',
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      width: body.width,
      height: body.height,
      duration: body.duration,
      thumbnailUrl: body.thumbnailUrl,
      folder: body.folder,
      tags,
      description: body.description,
      // advertiserId intencionalmente omitido = item global
      isActive: true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Failed to create global library item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
