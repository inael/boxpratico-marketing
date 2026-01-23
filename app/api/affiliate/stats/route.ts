import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getAffiliateStats,
  getAffiliateLedgerEntries,
  getUserById,
  getUsers,
  getTenantById,
} from '@/lib/database';

/**
 * GET /api/affiliate/stats
 * Retorna estatísticas do afiliado logado
 *
 * Response:
 *   - affiliateCode: string
 *   - totalReferrals: number (indicados diretos)
 *   - tier1Earnings: number (ganhos como Pai)
 *   - tier2Earnings: number (ganhos como Avô)
 *   - totalEarnings: number
 *   - pendingBalance: number (em lock)
 *   - availableBalance: number (disponível para saque)
 *   - paidTotal: number (já sacado)
 *   - recentReferrals: array de indicados recentes
 *   - recentCommissions: array de comissões recentes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;

    // Buscar estatísticas básicas
    const stats = await getAffiliateStats(userId);

    // Buscar indicados recentes
    const allUsers = await getUsers();
    const referrals = allUsers
      .filter((u: any) => u.referrerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Enriquecer com dados do tenant (se houver)
    const recentReferrals = await Promise.all(
      referrals.map(async (user: any) => {
        let tenantName = 'Sem tenant';
        if (user.tenantId) {
          const tenant = await getTenantById(user.tenantId);
          tenantName = tenant?.name || 'Tenant não encontrado';
        }
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          tenantName,
          createdAt: user.createdAt,
        };
      })
    );

    // Buscar comissões recentes
    const allCommissions = await getAffiliateLedgerEntries(userId);
    const recentCommissions = await Promise.all(
      allCommissions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20)
        .map(async (entry) => {
          const sourceUser = await getUserById(entry.sourceUserId);
          return {
            id: entry.id,
            tier: entry.tier,
            amount: entry.amount,
            percentageApplied: entry.percentageApplied,
            baseAmount: entry.baseAmount,
            status: entry.status,
            referenceMonth: entry.referenceMonth,
            availableAt: entry.availableAt,
            paidAt: entry.paidAt,
            createdAt: entry.createdAt,
            sourceUser: sourceUser
              ? { id: sourceUser.id, name: sourceUser.name, email: sourceUser.email }
              : undefined,
          };
        })
    );

    return NextResponse.json({
      ...stats,
      recentReferrals,
      recentCommissions,
    });
  } catch (error) {
    console.error('[API /affiliate/stats] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
