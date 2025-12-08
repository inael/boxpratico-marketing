import { NextRequest, NextResponse } from 'next/server';
import { getCondominiums, getCondominiumBySlug, createCondominium } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (slug) {
      const condominium = await getCondominiumBySlug(slug);
      return NextResponse.json(condominium ? [condominium] : []);
    }

    const condominiums = await getCondominiums();
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
    const body = await request.json();
    const { name, slug, cnpj, address, city, showNews } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const condominium = await createCondominium({ name, slug, cnpj, address, city, showNews });
    return NextResponse.json(condominium, { status: 201 });
  } catch (error) {
    console.error('Failed to create condominium:', error);
    return NextResponse.json(
      { error: 'Failed to create condominium' },
      { status: 500 }
    );
  }
}
