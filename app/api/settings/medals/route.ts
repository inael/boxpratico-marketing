import { NextRequest, NextResponse } from 'next/server';
import { MedalConfig, DEFAULT_MEDAL_CONFIG } from '@/types';
import { getEntity, setEntity } from '@/lib/redis';
import { requireAuth, AuthenticatedUser } from '@/lib/auth-utils';

const SETTINGS_KEY = 'settings';
const MEDAL_CONFIG_ID = 'medal_config';

// GET /api/settings/medals - Obter configuração de medalhas
export async function GET() {
  try {
    const config = await getEntity<MedalConfig>(SETTINGS_KEY, MEDAL_CONFIG_ID);
    return NextResponse.json(config || DEFAULT_MEDAL_CONFIG);
  } catch (error) {
    console.error('Failed to fetch medal config:', error);
    return NextResponse.json(DEFAULT_MEDAL_CONFIG);
  }
}

// PUT /api/settings/medals - Atualizar configuração de medalhas
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    // Apenas admin pode alterar configurações
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar configurações' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, tiers } = body;

    // Validar tiers
    if (tiers && Array.isArray(tiers)) {
      // Verificar se todos os tiers têm os campos necessários
      for (const tier of tiers) {
        if (
          !tier.type ||
          !tier.label ||
          tier.minTraffic === undefined ||
          tier.maxTraffic === undefined ||
          tier.priceMultiplier === undefined
        ) {
          return NextResponse.json(
            { error: 'Cada faixa deve ter: type, label, minTraffic, maxTraffic, priceMultiplier' },
            { status: 400 }
          );
        }
      }

      // Verificar se não há gaps ou sobreposições
      const sortedTiers = [...tiers].sort((a, b) => a.minTraffic - b.minTraffic);
      for (let i = 1; i < sortedTiers.length; i++) {
        if (sortedTiers[i].minTraffic !== sortedTiers[i - 1].maxTraffic + 1) {
          return NextResponse.json(
            { error: 'As faixas não podem ter gaps ou sobreposições' },
            { status: 400 }
          );
        }
      }
    }

    const currentConfig = await getEntity<MedalConfig>(SETTINGS_KEY, MEDAL_CONFIG_ID);

    const newConfig: MedalConfig = {
      enabled: enabled !== undefined ? enabled : (currentConfig?.enabled ?? true),
      tiers: tiers || currentConfig?.tiers || DEFAULT_MEDAL_CONFIG.tiers,
      updatedAt: new Date().toISOString(),
    };

    await setEntity(SETTINGS_KEY, MEDAL_CONFIG_ID, newConfig);

    return NextResponse.json(newConfig);
  } catch (error) {
    console.error('Failed to update medal config:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configuração de medalhas' },
      { status: 500 }
    );
  }
}

// POST /api/settings/medals/reset - Resetar para configuração padrão
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem resetar configurações' },
        { status: 403 }
      );
    }

    const defaultConfig: MedalConfig = {
      ...DEFAULT_MEDAL_CONFIG,
      updatedAt: new Date().toISOString(),
    };

    await setEntity(SETTINGS_KEY, MEDAL_CONFIG_ID, defaultConfig);

    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error('Failed to reset medal config:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar configuração de medalhas' },
      { status: 500 }
    );
  }
}
