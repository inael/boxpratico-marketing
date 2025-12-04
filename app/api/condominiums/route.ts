import { NextRequest, NextResponse } from 'next/server';
import { getCondominiums, createCondominium } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    const condominiums = getCondominiums();

    // Filter by slug if provided
    if (slug) {
      const filtered = condominiums.filter(c => c.slug === slug);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(condominiums);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch condominiums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, cnpj, address } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const condominium = createCondominium({ name, slug, cnpj, address });
    return NextResponse.json(condominium, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create condominium' },
      { status: 500 }
    );
  }
}
