/**
 * API para item individual da Biblioteca Global
 *
 * PUT    - Atualiza item global
 * DELETE - Exclui item global
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLibraryItemById, updateLibraryItem, deleteLibraryItem } from '@/lib/database';

type RouteParams = Promise<{ id: string }>;

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getLibraryItemById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    // Garantir que tags incluem 'biblioteca-global'
    const tags = Array.isArray(body.tags) ? body.tags : existing.tags || [];
    if (!tags.includes('biblioteca-global')) {
      tags.push('biblioteca-global');
    }

    const updated = await updateLibraryItem(id, {
      ...body,
      tags,
      // Manter sem advertiserId (global)
      advertiserId: undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Falha ao atualizar' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update global library item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const success = await deleteLibraryItem(id);

    if (!success) {
      return NextResponse.json({ error: 'Item nao encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete global library item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
