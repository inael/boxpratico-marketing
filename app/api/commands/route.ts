import { NextRequest, NextResponse } from 'next/server';
import {
  getRemoteCommands,
  getRemoteCommandsByMonitorId,
  createRemoteCommand,
  cleanupOldCommands,
} from '@/lib/database';
import { RemoteCommandType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monitorId = searchParams.get('monitorId');
    const status = searchParams.get('status');
    const cleanup = searchParams.get('cleanup');

    // Limpar comandos antigos
    if (cleanup === 'true') {
      const deletedCount = await cleanupOldCommands();
      return NextResponse.json({ message: `${deletedCount} comandos antigos removidos` });
    }

    // Buscar comandos por monitor
    if (monitorId) {
      let commands = await getRemoteCommandsByMonitorId(monitorId);

      // Filtrar por status se especificado
      if (status) {
        commands = commands.filter(c => c.status === status);
      }

      // Ordenar por data de criacao (mais recentes primeiro)
      commands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return NextResponse.json(commands);
    }

    // Buscar todos os comandos
    let commands = await getRemoteCommands();

    // Filtrar por status se especificado
    if (status) {
      commands = commands.filter(c => c.status === status);
    }

    // Ordenar por data de criacao (mais recentes primeiro)
    commands.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(commands);
  } catch (error) {
    console.error('Error fetching commands:', error);
    return NextResponse.json({ error: 'Failed to fetch commands' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monitorId, type, payload, createdBy } = body;

    if (!monitorId || !type) {
      return NextResponse.json(
        { error: 'monitorId and type are required' },
        { status: 400 }
      );
    }

    // Validar tipo de comando
    const validTypes: RemoteCommandType[] = [
      'refresh',
      'restart',
      'screenshot',
      'volume',
      'clear_cache',
      'message',
      'update_settings',
      'reboot',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid command type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const command = await createRemoteCommand({
      monitorId,
      type,
      payload,
      createdBy,
    });

    return NextResponse.json(command, { status: 201 });
  } catch (error) {
    console.error('Error creating command:', error);
    return NextResponse.json({ error: 'Failed to create command' }, { status: 500 });
  }
}
