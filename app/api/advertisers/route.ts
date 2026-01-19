import { NextRequest, NextResponse } from 'next/server';
import { getAdvertisers, getAdvertiserBySlug, createAdvertiser } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');

    if (slug) {
      const advertiser = await getAdvertiserBySlug(slug);
      return NextResponse.json(advertiser ? [advertiser] : []);
    }

    const advertisers = await getAdvertisers();
    return NextResponse.json(advertisers);
  } catch (error) {
    console.error('Failed to fetch advertisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, contactName, contactPhone, contactEmail, cnpj, logoUrl, segment, notes, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const advertiser = await createAdvertiser({
      name,
      slug,
      contactName,
      contactPhone,
      contactEmail,
      cnpj,
      logoUrl,
      segment,
      notes,
      isActive: isActive !== false,
    });
    return NextResponse.json(advertiser, { status: 201 });
  } catch (error) {
    console.error('Failed to create advertiser:', error);
    return NextResponse.json(
      { error: 'Failed to create advertiser' },
      { status: 500 }
    );
  }
}
