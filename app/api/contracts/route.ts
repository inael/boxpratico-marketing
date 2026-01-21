import { NextRequest, NextResponse } from 'next/server';
import {
  getContracts,
  createContract,
} from '@/lib/database';
import { Contract } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const condominiumId = searchParams.get('condominiumId');
    const advertiserId = searchParams.get('advertiserId');

    let contracts = await getContracts();

    // Filter by type
    if (type) {
      contracts = contracts.filter(c => c.type === type);
    }

    // Filter by status
    if (status) {
      contracts = contracts.filter(c => c.status === status);
    }

    // Filter by condominium
    if (condominiumId) {
      contracts = contracts.filter(c => c.condominiumId === condominiumId);
    }

    // Filter by advertiser
    if (advertiserId) {
      contracts = contracts.filter(c => c.advertiserId === advertiserId);
    }

    // Sort by creation date (newest first)
    contracts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.partyAName || !body.partyBName || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: type, partyAName, partyBName, startDate, endDate' },
        { status: 400 }
      );
    }

    const contractData: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'> = {
      type: body.type,
      partyAName: body.partyAName,
      partyACnpj: body.partyACnpj,
      partyBName: body.partyBName,
      partyBDocument: body.partyBDocument,
      partyBEmail: body.partyBEmail,
      partyBPhone: body.partyBPhone,
      monthlyValue: body.monthlyValue ? parseFloat(body.monthlyValue) : undefined,
      totalValue: body.totalValue ? parseFloat(body.totalValue) : undefined,
      paymentDay: body.paymentDay ? parseInt(body.paymentDay) : 10,
      startDate: body.startDate,
      endDate: body.endDate,
      signedAt: body.signedAt,
      draftPdfUrl: body.draftPdfUrl,
      signedPdfUrl: body.signedPdfUrl,
      status: body.status || 'draft',
      condominiumId: body.condominiumId,
      advertiserId: body.advertiserId,
      notes: body.notes,
    };

    const contract = await createContract(contractData);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}
