import { NextRequest, NextResponse } from 'next/server';
import { getMonitors } from '@/lib/database';
import {
  calculateQuote,
  filterTerminalsByRadius,
  QuoteInput,
  DEFAULT_PRICING_CONFIG,
} from '@/lib/quote-service';
import { requirePermission, AuthenticatedUser } from '@/lib/auth-utils';

// POST /api/quotes - Calcular orçamento de campanha
export async function POST(request: NextRequest) {
  try {
    // Verificar permissão (vendedor ou superior)
    const authResult = await requirePermission('campaigns:create');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const {
      terminalIds,
      geoFilter,
      playsPerDay = 48, // Default: 1 play a cada 30 min
      durationDays = 30,
      slotDurationSec = 15,
    } = body as QuoteInput;

    // Buscar terminais
    let terminals = await getMonitors();

    // Filtrar por IDs específicos ou por raio geográfico
    if (terminalIds && terminalIds.length > 0) {
      terminals = terminals.filter((t) => terminalIds.includes(t.id));
    } else if (geoFilter) {
      terminals = filterTerminalsByRadius(
        terminals,
        geoFilter.centerLat,
        geoFilter.centerLng,
        geoFilter.radiusKm
      );
    }

    // Filtrar apenas terminais ativos
    terminals = terminals.filter((t) => t.isActive);

    if (terminals.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum terminal encontrado com os filtros especificados' },
        { status: 400 }
      );
    }

    // Calcular orçamento
    const quote = calculateQuote(
      terminals,
      { playsPerDay, durationDays, slotDurationSec },
      DEFAULT_PRICING_CONFIG
    );

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error calculating quote:', error);
    return NextResponse.json(
      { error: 'Falha ao calcular orçamento' },
      { status: 500 }
    );
  }
}

// GET /api/quotes/terminals - Listar terminais disponíveis para simulador
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');

    let terminals = await getMonitors();

    // Filtrar apenas ativos
    terminals = terminals.filter((t) => t.isActive);

    // Filtrar por raio se especificado
    if (lat && lng && radius) {
      terminals = filterTerminalsByRadius(
        terminals,
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius)
      );
    }

    // Retornar dados simplificados para o mapa
    const simplifiedTerminals = terminals.map((t) => ({
      id: t.id,
      name: t.name,
      latitude: t.latitude,
      longitude: t.longitude,
      tier: t.tier || 'BRONZE',
      dailyTraffic: t.averageDailyTraffic || 0,
      address: t.address,
      city: t.city,
      state: t.state,
      isOnline: t.isOnline,
    }));

    return NextResponse.json({
      terminals: simplifiedTerminals,
      total: simplifiedTerminals.length,
    });
  } catch (error) {
    console.error('Error fetching terminals for quote:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar terminais' },
      { status: 500 }
    );
  }
}
