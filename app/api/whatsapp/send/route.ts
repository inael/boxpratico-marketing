import { NextRequest, NextResponse } from 'next/server';
import { sendMessage, isWhatsAppConfigured } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp não configurado' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { phone, message, isGroup } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Phone and message are required' },
        { status: 400 }
      );
    }

    const result = await sendMessage({ phone, message, isGroup });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: 'Failed to send WhatsApp message' },
      { status: 500 }
    );
  }
}
