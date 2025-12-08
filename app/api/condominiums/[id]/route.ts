import { NextRequest, NextResponse } from 'next/server';
import { getCondominiumById, updateCondominium, deleteCondominium } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const condominium = await getCondominiumById(id);

    if (!condominium) {
      return NextResponse.json(
        { error: 'Condominium not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(condominium);
  } catch (error) {
    console.error('Failed to fetch condominium:', error);
    return NextResponse.json(
      { error: 'Failed to fetch condominium' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const condominium = await updateCondominium(id, body);

    if (!condominium) {
      return NextResponse.json(
        { error: 'Condominium not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(condominium);
  } catch (error) {
    console.error('Failed to update condominium:', error);
    return NextResponse.json(
      { error: 'Failed to update condominium' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteCondominium(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Condominium not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete condominium:', error);
    return NextResponse.json(
      { error: 'Failed to delete condominium' },
      { status: 500 }
    );
  }
}
