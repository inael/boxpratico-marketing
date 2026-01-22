import { NextRequest, NextResponse } from 'next/server';
import { getCondominiums, getCondominiumBySlug, createCondominium } from '@/lib/database';
import { requirePermission, filterByAccount, AuthenticatedUser } from '@/lib/auth-utils';
import { Condominium } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Verificar permissão
    const authResult = await requirePermission('condominiums:read');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (slug) {
      const condominium = await getCondominiumBySlug(slug);

      // Verificar se usuário pode ver este local
      if (condominium && !currentUser.isAdmin && currentUser.accountId) {
        if (condominium.accountId && condominium.accountId !== currentUser.accountId) {
          return NextResponse.json([]);
        }
      }

      return NextResponse.json(condominium ? [condominium] : []);
    }

    let condominiums = await getCondominiums();

    // Filtrar por conta (multi-tenant)
    condominiums = filterByAccount(condominiums as (Condominium & { accountId?: string })[], currentUser);

    return NextResponse.json(condominiums);
  } catch (error) {
    console.error('Failed to fetch condominiums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch condominiums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar permissão
    const authResult = await requirePermission('condominiums:create');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const body = await request.json();
    const { name, slug, cnpj, address, city, state, showNews, latitude, longitude, category, blockedCategories, blockOwnCategory, averageDailyTraffic, pricing, commission } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const condominium = await createCondominium({
      name,
      slug,
      cnpj,
      address,
      city,
      state,
      showNews,
      latitude,
      longitude,
      category,
      blockedCategories,
      blockOwnCategory,
      averageDailyTraffic,
      pricing,
      commission,
      isActive: true,
      accountId: body.accountId || currentUser.accountId, // Herdar accountId
    });

    return NextResponse.json(condominium, { status: 201 });
  } catch (error) {
    console.error('Failed to create condominium:', error);
    return NextResponse.json(
      { error: 'Failed to create condominium' },
      { status: 500 }
    );
  }
}
