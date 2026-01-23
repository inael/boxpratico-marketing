import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAffiliateSettings, updateAffiliateSettings } from '@/lib/database';

/**
 * GET /api/admin/settings/affiliate
 * Retorna as configurações atuais do sistema de afiliados
 * Acesso: Apenas SUPER_ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode acessar
    if (session.user.role !== 'SUPER_ADMIN' && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const settings = await getAffiliateSettings();

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API /admin/settings/affiliate] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/settings/affiliate
 * Atualiza as configurações do sistema de afiliados
 * Acesso: Apenas SUPER_ADMIN
 *
 * Body:
 *   - affiliateEnabled?: boolean
 *   - affiliateL1Percentage?: number (0-100)
 *   - affiliateL2Percentage?: number (0-100)
 *   - affiliateCookieDuration?: number (dias)
 *   - affiliateLockDays?: number (dias)
 *   - affiliateMinWithdrawal?: number (valor mínimo)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Apenas SUPER_ADMIN pode atualizar
    if (session.user.role !== 'SUPER_ADMIN' && !session.user.isAdmin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const {
      affiliateEnabled,
      affiliateL1Percentage,
      affiliateL2Percentage,
      affiliateCookieDuration,
      affiliateLockDays,
      affiliateMinWithdrawal,
    } = body;

    // Validações
    const updates: Record<string, any> = {};

    if (affiliateEnabled !== undefined) {
      updates.affiliateEnabled = Boolean(affiliateEnabled);
    }

    if (affiliateL1Percentage !== undefined) {
      const l1 = Number(affiliateL1Percentage);
      if (isNaN(l1) || l1 < 0 || l1 > 100) {
        return NextResponse.json(
          { error: 'Taxa L1 deve ser entre 0 e 100' },
          { status: 400 }
        );
      }
      updates.affiliateL1Percentage = l1;
    }

    if (affiliateL2Percentage !== undefined) {
      const l2 = Number(affiliateL2Percentage);
      if (isNaN(l2) || l2 < 0 || l2 > 100) {
        return NextResponse.json(
          { error: 'Taxa L2 deve ser entre 0 e 100' },
          { status: 400 }
        );
      }
      updates.affiliateL2Percentage = l2;
    }

    if (affiliateCookieDuration !== undefined) {
      const days = Number(affiliateCookieDuration);
      if (isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
          { error: 'Duração do cookie deve ser entre 1 e 365 dias' },
          { status: 400 }
        );
      }
      updates.affiliateCookieDuration = days;
    }

    if (affiliateLockDays !== undefined) {
      const days = Number(affiliateLockDays);
      if (isNaN(days) || days < 0 || days > 180) {
        return NextResponse.json(
          { error: 'Período de lock deve ser entre 0 e 180 dias' },
          { status: 400 }
        );
      }
      updates.affiliateLockDays = days;
    }

    if (affiliateMinWithdrawal !== undefined) {
      const min = Number(affiliateMinWithdrawal);
      if (isNaN(min) || min < 0) {
        return NextResponse.json(
          { error: 'Valor mínimo de saque não pode ser negativo' },
          { status: 400 }
        );
      }
      updates.affiliateMinWithdrawal = min;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    const settings = await updateAffiliateSettings(updates);

    console.log(
      `[Affiliate Settings] Updated by ${session.user.email}:`,
      JSON.stringify(updates)
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API /admin/settings/affiliate] PUT Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}
