import { NextRequest, NextResponse } from 'next/server';
import { getAccountById } from '@/lib/database';

// GET /api/tenants/[id] - Obter dados do tenant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const account = await getAccountById(id);

    if (!account) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Retornar dados do tenant com tipo
    return NextResponse.json({
      id: account.id,
      name: account.name,
      slug: account.slug,
      type: account.type || 'NETWORK_OPERATOR', // Default para compatibilidade
      status: account.status,
      plan: account.plan,
      email: account.email,
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar tenant' },
      { status: 500 }
    );
  }
}
