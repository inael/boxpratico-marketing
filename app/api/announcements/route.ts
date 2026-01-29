import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Tipos de anúncios
export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promo';
  scope: 'global' | 'tenant';
  tenantId?: string;
  dismissible: boolean;
  startsAt: string;
  expiresAt?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mock de anúncios (em produção seria banco de dados)
const mockAnnouncements: SystemAnnouncement[] = [
  {
    id: 'ann-001',
    title: 'Nova funcionalidade: Grades de Programacao',
    message: 'Agora voce pode criar grades de programacao com drag-and-drop! Arraste as midias para montar a sequencia perfeita para suas telas.',
    type: 'success',
    scope: 'global',
    dismissible: true,
    startsAt: '2026-01-01T00:00:00Z',
    expiresAt: '2026-02-28T23:59:59Z',
    ctaLabel: 'Experimentar',
    ctaUrl: '/admin?tab=playlists',
    createdBy: 'system',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ann-002',
    title: 'Integracao com Assina Agora',
    message: 'Em breve: assinatura digital de contratos! Seus clientes poderao assinar contratos eletronicamente direto pela plataforma.',
    type: 'info',
    scope: 'global',
    dismissible: true,
    startsAt: '2026-01-15T00:00:00Z',
    createdBy: 'system',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

// GET - Listar anúncios ativos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();
    const tenantId = (session.user as { tenantId?: string }).tenantId;

    // Filtrar anúncios ativos
    const activeAnnouncements = mockAnnouncements.filter(ann => {
      // Verificar se está no período válido
      if (ann.startsAt > now) return false;
      if (ann.expiresAt && ann.expiresAt < now) return false;

      // Verificar escopo
      if (ann.scope === 'tenant' && ann.tenantId !== tenantId) return false;

      return true;
    });

    return NextResponse.json(activeAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// POST - Criar novo anúncio (apenas admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { role?: string; id?: string };
    if (user.role !== 'SUPER_ADMIN' && user.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const newAnnouncement: SystemAnnouncement = {
      id: `ann-${Date.now()}`,
      title: body.title,
      message: body.message,
      type: body.type || 'info',
      scope: body.scope || 'tenant',
      tenantId: body.tenantId,
      dismissible: body.dismissible ?? true,
      startsAt: body.startsAt || new Date().toISOString(),
      expiresAt: body.expiresAt,
      ctaLabel: body.ctaLabel,
      ctaUrl: body.ctaUrl,
      createdBy: user.id || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Em produção: salvar no banco de dados
    mockAnnouncements.push(newAnnouncement);

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
