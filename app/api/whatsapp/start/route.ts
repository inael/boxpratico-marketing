import { NextResponse } from 'next/server';
import { startSession, isWhatsAppConfigured } from '@/lib/whatsapp';

export async function POST() {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp não configurado' },
      { status: 400 }
    );
  }

  try {
    const result = await startSession();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error starting WhatsApp session:', error);
    return NextResponse.json(
      { error: 'Failed to start WhatsApp session' },
      { status: 500 }
    );
  }
}
