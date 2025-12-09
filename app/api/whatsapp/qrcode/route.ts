import { NextResponse } from 'next/server';
import { getQRCode, isWhatsAppConfigured } from '@/lib/whatsapp';

export async function GET() {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp não configurado' },
      { status: 400 }
    );
  }

  try {
    const result = await getQRCode();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting QR code:', error);
    return NextResponse.json(
      { error: 'Failed to get QR code' },
      { status: 500 }
    );
  }
}
