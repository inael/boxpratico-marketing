import { NextResponse } from 'next/server';
import { getSessionStatus, isWhatsAppConfiguredAsync } from '@/lib/whatsapp';

export async function GET() {
  const isConfigured = await isWhatsAppConfiguredAsync();

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      status: 'not_configured',
      message: 'WhatsApp não configurado. Configure nas Configurações ou defina EVOLUTION_API_KEY no ambiente.',
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
