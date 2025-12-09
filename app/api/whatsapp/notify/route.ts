import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, isWhatsAppConfigured, NotificationType } from '@/lib/whatsapp';
import { getSettingsData } from '@/app/api/settings/route';

export async function POST(request: NextRequest) {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json(
      { error: 'WhatsApp não configurado', sent: false },
      { status: 200 }
    );
  }

  try {
    // Check if notifications are enabled
    const settings = await getSettingsData();
    if (!settings?.whatsapp?.notificationsEnabled) {
      return NextResponse.json({
        sent: false,
        message: 'Notificações desativadas nas configurações'
      });
    }

    const body = await request.json();
    const { type, condominiumName, condominiumPhone, entityName, details } = body;

    if (!type || !condominiumName) {
      return NextResponse.json(
        { error: 'type and condominiumName are required', sent: false },
        { status: 400 }
      );
    }

    if (!condominiumPhone) {
      return NextResponse.json({
        sent: false,
        message: 'Número de WhatsApp não configurado para este condomínio'
      });
    }

    const result = await sendNotification(type as NotificationType, {
      condominiumName,
      condominiumPhone,
      entityName,
      details,
    });

    return NextResponse.json({
      sent: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification', sent: false },
      { status: 500 }
    );
  }
}
