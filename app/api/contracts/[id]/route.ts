import { NextRequest, NextResponse } from 'next/server';
import {
  getContractById,
  updateContract,
  deleteContract,
} from '@/lib/database';

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const contract = await getContractById(id);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to fetch contract:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};

    // Only include fields that are provided
    if (body.type !== undefined) updates.type = body.type;
    if (body.partyAName !== undefined) updates.partyAName = body.partyAName;
    if (body.partyACnpj !== undefined) updates.partyACnpj = body.partyACnpj;
    if (body.partyBName !== undefined) updates.partyBName = body.partyBName;
    if (body.partyBDocument !== undefined) updates.partyBDocument = body.partyBDocument;
    if (body.partyBEmail !== undefined) updates.partyBEmail = body.partyBEmail;
    if (body.partyBPhone !== undefined) updates.partyBPhone = body.partyBPhone;
    if (body.monthlyValue !== undefined) updates.monthlyValue = body.monthlyValue ? parseFloat(body.monthlyValue) : null;
    if (body.totalValue !== undefined) updates.totalValue = body.totalValue ? parseFloat(body.totalValue) : null;
    if (body.paymentDay !== undefined) updates.paymentDay = body.paymentDay ? parseInt(body.paymentDay) : null;
    if (body.startDate !== undefined) updates.startDate = body.startDate;
    if (body.endDate !== undefined) updates.endDate = body.endDate;
    if (body.signedAt !== undefined) updates.signedAt = body.signedAt;
    if (body.draftPdfUrl !== undefined) updates.draftPdfUrl = body.draftPdfUrl;
    if (body.signedPdfUrl !== undefined) updates.signedPdfUrl = body.signedPdfUrl;
    if (body.status !== undefined) updates.status = body.status;
    if (body.condominiumId !== undefined) updates.condominiumId = body.condominiumId;
    if (body.advertiserId !== undefined) updates.advertiserId = body.advertiserId;
    if (body.notes !== undefined) updates.notes = body.notes;

    const contract = await updateContract(id, updates);

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to update contract:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const success = await deleteContract(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}
