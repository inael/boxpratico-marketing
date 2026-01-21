import { NextRequest, NextResponse } from 'next/server';
import {
  getRemoteCommandById,
  updateRemoteCommand,
  deleteRemoteCommand,
} from '@/lib/database';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/commands/[id] - Get a specific command
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const command = await getRemoteCommandById(id);

    if (!command) {
      return NextResponse.json({ error: 'Comando nao encontrado' }, { status: 404 });
    }

    return NextResponse.json(command);
  } catch (error) {
    console.error('Error fetching command:', error);
    return NextResponse.json({ error: 'Failed to fetch command' }, { status: 500 });
  }
}

// PUT /api/commands/[id] - Update command status
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getRemoteCommandById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Comando nao encontrado' }, { status: 404 });
    }

    // Atualizar campos permitidos
    const updates: Record<string, unknown> = {};

    if (body.status) {
      updates.status = body.status;

      // Registrar timestamps baseados no status
      if (body.status === 'sent') {
        updates.sentAt = new Date().toISOString();
      } else if (body.status === 'executed') {
        updates.executedAt = new Date().toISOString();
      }
    }

    if (body.errorMessage !== undefined) {
      updates.errorMessage = body.errorMessage;
    }

    const updated = await updateRemoteCommand(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating command:', error);
    return NextResponse.json({ error: 'Failed to update command' }, { status: 500 });
  }
}

// DELETE /api/commands/[id] - Delete a command
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await getRemoteCommandById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Comando nao encontrado' }, { status: 404 });
    }

    await deleteRemoteCommand(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting command:', error);
    return NextResponse.json({ error: 'Failed to delete command' }, { status: 500 });
  }
}
