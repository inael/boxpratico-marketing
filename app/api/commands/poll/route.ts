import { NextRequest, NextResponse } from 'next/server';
import {
  getPendingCommandsForMonitor,
  updateRemoteCommand,
  getMonitorBySlug,
} from '@/lib/database';

// GET /api/commands/poll?monitorSlug=xxx - Player polls for pending commands
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monitorSlug = searchParams.get('monitorSlug');
    const monitorId = searchParams.get('monitorId');

    let targetMonitorId = monitorId;

    // Resolver monitorId a partir do slug se necessario
    if (!targetMonitorId && monitorSlug) {
      const monitor = await getMonitorBySlug(monitorSlug);
      if (monitor) {
        targetMonitorId = monitor.id;
      }
    }

    if (!targetMonitorId) {
      return NextResponse.json(
        { error: 'monitorSlug ou monitorId e obrigatorio' },
        { status: 400 }
      );
    }

    // Buscar comandos pendentes
    const commands = await getPendingCommandsForMonitor(targetMonitorId);

    // Marcar comandos como 'sent' e atualizar timestamp
    const updatedCommands = await Promise.all(
      commands.map(async (cmd) => {
        if (cmd.status === 'pending') {
          const updated = await updateRemoteCommand(cmd.id, {
            status: 'sent',
            sentAt: new Date().toISOString(),
          });
          return updated || cmd;
        }
        return cmd;
      })
    );

    return NextResponse.json(updatedCommands);
  } catch (error) {
    console.error('Error polling commands:', error);
    return NextResponse.json({ error: 'Failed to poll commands' }, { status: 500 });
  }
}

// POST /api/commands/poll - Player reports command execution result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commandId, status, errorMessage } = body;

    if (!commandId || !status) {
      return NextResponse.json(
        { error: 'commandId and status are required' },
        { status: 400 }
      );
    }

    // Validar status
    if (!['executed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "executed" or "failed"' },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      status,
      executedAt: new Date().toISOString(),
    };

    if (errorMessage) {
      updates.errorMessage = errorMessage;
    }

    const updated = await updateRemoteCommand(commandId, updates);

    if (!updated) {
      return NextResponse.json({ error: 'Comando nao encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error reporting command result:', error);
    return NextResponse.json({ error: 'Failed to report command result' }, { status: 500 });
  }
}
