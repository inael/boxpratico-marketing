import { NextResponse } from 'next/server';
import { logoutSession, isWhatsAppConfigured } from '@/lib/whatsapp';

export async function POST() {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp não configurado' },
      { status: 400 }
    );
  }

  try {
    const result = await logoutSession();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error logging out WhatsApp:', error);
    return NextResponse.json(
      { error: 'Failed to logout WhatsApp' },
      { status: 500 }
    );
  }
}
