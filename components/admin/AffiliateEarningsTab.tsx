'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Gift,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Download,
  Filter,
  ChevronDown,
  Link as LinkIcon,
  Copy,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Wallet,
} from 'lucide-react';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';
import { useAuth } from '@/contexts/AuthContext';

interface AffiliateEarning {
  id: string;
  referralTenantId: string;
  referralTenantName: string;
  level: 1 | 2; // 1 = direto, 2 = indireto
  rate: number;
  baseAmount: number;
  commissionAmount: number;
  status: 'pending' | 'available' | 'paid' | 'processing';
  referenceMonth: string;
  createdAt: string;
  paidAt?: string;
}

interface ReferralStats {
  totalReferrals: number;
  directReferrals: number;
  indirectReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableForWithdraw: number;
}

// Dados mockados - em producao virao da API
const mockEarnings: AffiliateEarning[] = [
  {
    id: '1',
    referralTenantId: 'tenant-001',
    referralTenantName: 'Midia Box Campinas',
    level: 1,
    rate: 10,
    baseAmount: 299,
    commissionAmount: 29.9,
    status: 'paid',
    referenceMonth: '2025-12',
    createdAt: '2025-12-01T10:00:00Z',
    paidAt: '2026-01-05T10:00:00Z',
  },
  {
    id: '2',
    referralTenantId: 'tenant-001',
    referralTenantName: 'Midia Box Campinas',
    level: 1,
    rate: 10,
    baseAmount: 299,
    commissionAmount: 29.9,
    status: 'available',
    referenceMonth: '2026-01',
    createdAt: '2026-01-01T10:00:00Z',
  },
  {
    id: '3',
    referralTenantId: 'tenant-002',
    referralTenantName: 'Digital Signs RJ',
    level: 1,
    rate: 10,
    baseAmount: 599,
    commissionAmount: 59.9,
    status: 'pending',
    referenceMonth: '2026-01',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '4',
    referralTenantId: 'tenant-003',
    referralTenantName: 'TV Indoor BH',
    level: 2,
    rate: 5,
    baseAmount: 299,
    commissionAmount: 14.95,
    status: 'pending',
    referenceMonth: '2026-01',
    createdAt: '2026-01-20T10:00:00Z',
  },
];

const mockStats: ReferralStats = {
  totalReferrals: 5,
  directReferrals: 3,
  indirectReferrals: 2,
  activeReferrals: 4,
  totalEarnings: 425.5,
  pendingEarnings: 104.75,
  availableForWithdraw: 59.8,
};

export default function AffiliateEarningsTab() {
  const { user } = useAuth();
  const [earnings] = useState<AffiliateEarning[]>(mockEarnings);
  const [stats] = useState<ReferralStats>(mockStats);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate affiliate code from user id (first 8 chars)
  const affiliateCode = user?.id?.substring(0, 8).toUpperCase() || 'SEU-CODIGO';
  const affiliateLink = typeof window !== 'undefined'
    ? `${window.location.origin}/register?ref=${affiliateCode}`
    : `https://app.boxpratico.com.br/register?ref=${affiliateCode}`;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredEarnings = useMemo(() => {
    return earnings.filter((earning) => {
      if (statusFilter !== 'all' && earning.status !== statusFilter) return false;
      if (levelFilter !== 'all' && earning.level.toString() !== levelFilter) return false;
      return true;
    });
  }, [earnings, statusFilter, levelFilter]);

  const getStatusBadge = (status: AffiliateEarning['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      available: 'bg-green-100 text-green-700',
      paid: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
    };
    const labels = {
      pending: 'Pendente',
      available: 'Disponivel',
      paid: 'Pago',
      processing: 'Processando',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getLevelBadge = (level: 1 | 2) => {
    if (level === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          Direto (10%)
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        Indireto (5%)
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Extrato de Afiliado"
        helpTitle="Extrato de Afiliado"
        helpDescription="Acompanhe seus ganhos como afiliado. Voce ganha comissoes recorrentes por cada indicacao que se torna cliente ativo. Nivel 1 (direto): 10% da assinatura. Nivel 2 (indireto): 5% quando seu indicado indica alguem."
      />

      {/* Link de Indicacao */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Seu Link de Indicacao
            </h3>
            <p className="text-indigo-100 text-sm mt-1">
              Compartilhe e ganhe 10% de comissao recorrente em cada indicacao!
            </p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-indigo-200" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={affiliateLink}
            className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 font-medium"
          >
            {copiedLink ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-indigo-500" />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalReferrals}</p>
          <p className="text-sm text-gray-500">Indicacoes</p>
          <div className="mt-2 text-xs text-gray-400">
            {stats.directReferrals} diretas + {stats.indirectReferrals} indiretas
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-green-500" />
            <span className="text-xs text-gray-500">Historico</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.totalEarnings)}</p>
          <p className="text-sm text-gray-500">Total Ganho</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <Clock className="w-8 h-8 text-yellow-500" />
            <span className="text-xs text-gray-500">Aguardando</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(stats.pendingEarnings)}</p>
          <p className="text-sm text-gray-500">Pendente</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <Wallet className="w-8 h-8 text-emerald-500" />
            <span className="text-xs text-gray-500">Disponivel</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(stats.availableForWithdraw)}</p>
          <p className="text-sm text-gray-500">Para Saque</p>
          <button className="mt-2 text-xs text-emerald-600 font-medium hover:underline">
            Solicitar Saque
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Filtros:</span>
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="available">Disponivel</option>
            <option value="paid">Pago</option>
            <option value="processing">Processando</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os niveis</option>
            <option value="1">Nivel 1 (Direto)</option>
            <option value="2">Nivel 2 (Indireto)</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="flex-1" />

        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Earnings List */}
      {filteredEarnings.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhum ganho encontrado"
          description="Seus ganhos de afiliado aparecerao aqui quando suas indicacoes se tornarem clientes ativos."
          primaryAction={{
            label: "Compartilhar Link",
            onClick: copyToClipboard,
            icon: LinkIcon,
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Indicado
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Nivel
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Referencia
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Base
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Comissao
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEarnings.map((earning) => (
                  <tr key={earning.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {earning.referralTenantName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getLevelBadge(earning.level)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {formatMonth(earning.referenceMonth)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-gray-600">
                        {formatCurrency(earning.baseAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold text-green-600">
                        +{formatCurrency(earning.commissionAmount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(earning.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(earning.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-gray-900 mb-2">Como funcionam os ganhos de afiliado?</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <strong>Nivel 1 (Direto):</strong> Voce ganha 10% da assinatura mensal de cada pessoa
            que se cadastrar usando seu link de indicacao.
          </p>
          <p>
            <strong>Nivel 2 (Indireto):</strong> Quando uma pessoa indicada por voce tambem indica
            alguem, voce ganha 5% da assinatura desse novo cliente.
          </p>
          <p>
            <strong>Recorrente:</strong> As comissoes sao pagas mensalmente enquanto o cliente
            indicado mantiver a assinatura ativa.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
