import { NextResponse } from 'next/server';
import { getSessionStatus, isWhatsAppConfigured } from '@/lib/whatsapp';

export async function GET() {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json({
      configured: false,
      status: 'not_configured',
      message: 'WhatsApp não configurado. Configure EVOLUTION_API_KEY no ambiente.',
    });
  }

  try {
    const result = await getSessionStatus();
    return NextResponse.json({
      configured: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    return NextResponse.json(
      { error: 'Failed to get WhatsApp status' },
      { status: 500 }
    );
  }
}
