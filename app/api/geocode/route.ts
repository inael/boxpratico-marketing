import { NextRequest, NextResponse } from 'next/server';
import {
  geocodeAddress,
  geocodeAddressComponents,
  reverseGeocode,
  isGoogleMapsConfigured,
  buildFullAddress,
} from '@/lib/geocoding';
import { requireAuth } from '@/lib/auth-utils';

// POST /api/geocode - Geocodificar endereço
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    if (!isGoogleMapsConfigured()) {
      return NextResponse.json(
        { error: 'Google Maps API não configurada' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { address, addressComponents, latitude, longitude } = body;

    // Geocodificação reversa (coordenadas para endereço)
    if (latitude !== undefined && longitude !== undefined) {
      const result = await reverseGeocode(latitude, longitude);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        address: result.address,
        formattedAddress: result.formattedAddress,
      });
    }

    // Geocodificação a partir de componentes
    if (addressComponents) {
      const result = await geocodeAddressComponents(addressComponents);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
        fullAddress: buildFullAddress(addressComponents),
      });
    }

    // Geocodificação a partir de endereço completo
    if (address) {
      const result = await geocodeAddress(address);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        latitude: result.latitude,
        longitude: result.longitude,
        formattedAddress: result.formattedAddress,
      });
    }

    return NextResponse.json(
      { error: 'Forneça um endereço, componentes de endereço ou coordenadas' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ error: 'Erro ao geocodificar' }, { status: 500 });
  }
}

// GET /api/geocode/status - Verificar se geocodificação está disponível
export async function GET() {
  return NextResponse.json({
    configured: isGoogleMapsConfigured(),
    provider: 'google',
  });
}
