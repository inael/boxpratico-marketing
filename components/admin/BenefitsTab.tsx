'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GiftIcon,
  ShareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';

interface AffiliateStats {
  affiliateCode: string;
  totalReferrals: number;
  tier1Earnings: number;
  tier2Earnings: number;
  totalEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  paidTotal: number;
  recentReferrals: Array<{
    id: string;
    name: string;
    email: string;
    tenantName: string;
    createdAt: string;
  }>;
  recentCommissions: Array<{
    id: string;
    tier: number;
    amount: number;
    status: string;
    referenceMonth: string;
    createdAt: string;
    sourceUser?: { name: string; email: string };
  }>;
}

interface BenefitsTabProps {
  subTab?: 'affiliate' | 'affiliate-earnings';
}

export default function BenefitsTab({ subTab = 'affiliate' }: BenefitsTabProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'indicar' | 'comissoes'>(
    subTab === 'affiliate-earnings' ? 'comissoes' : 'indicar'
  );

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const affiliateLink = stats?.affiliateCode
    ? `${baseUrl}/cadastro?ref=${stats.affiliateCode}`
    : '';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/affiliate/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BoxPratico - Indique e Ganhe',
          text: 'Conheça o BoxPratico! Use meu link de indicação e ganhe benefícios exclusivos.',
          url: affiliateLink,
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Indique e ganhe até 20% em cada assinatura
            </h2>
            <p className="text-white/90 text-lg">
              Compartilhe seu link e ganhe comissões recorrentes em 2 níveis!
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <p className="text-sm text-white/80 mb-1">Seu código</p>
              <p className="text-2xl font-bold">{stats?.affiliateCode || '---'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('indicar')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'indicar'
              ? 'border-[#F59E0B] text-[#D97706]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Indicar Amigo
        </button>
        <button
          onClick={() => setActiveTab('comissoes')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'comissoes'
              ? 'border-[#F59E0B] text-[#D97706]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Minhas Comissões
        </button>
      </div>

      {activeTab === 'indicar' ? (
        <>
          {/* Link de Indicação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-gray-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compartilhe seu link
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={affiliateLink}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600 text-sm pr-12"
                />
                <button
                  onClick={copyToClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <CheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <ClipboardDocumentIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={shareLink}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <ShareIcon className="w-5 h-5" />
                Indicar amigos
              </button>
            </div>
          </motion.div>

          {/* Como Funciona */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {/* Você ganha */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Você ganha</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">20%</strong> de comissão recorrente sobre cada pagamento do seu indicado direto (Nível 1)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">5%</strong> de comissão recorrente sobre pagamentos de quem seu indicado indicar (Nível 2)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    Comissões <strong className="text-gray-900">vitalícias</strong> enquanto o indicado for cliente ativo
                  </span>
                </li>
              </ul>
            </div>

            {/* Seu indicado ganha */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Seu indicado ganha</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    <strong className="text-gray-900">14 dias grátis</strong> para testar a plataforma
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    Acesso a todas as funcionalidades do BoxPratico
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckIcon className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-gray-600">
                    Suporte prioritário durante o período de teste
                  </span>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Resumo dos Benefícios */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#FEF3C7] rounded-xl flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-[#D97706]" />
                </div>
                <h4 className="font-semibold text-gray-900">Saldo Disponível</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.availableBalance || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Disponível para saque
              </p>
              <button className="mt-4 text-[#F59E0B] text-sm font-medium flex items-center gap-1 hover:text-[#D97706]">
                Solicitar saque
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Saldo Pendente</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.pendingBalance || 0)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Aguardando período de lock (30 dias)
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900">Amigos Indicados</h4>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.totalReferrals || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Total de indicações diretas
              </p>
              <button className="mt-4 text-[#F59E0B] text-sm font-medium flex items-center gap-1 hover:text-[#D97706]">
                Ver indicados
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </>
      ) : (
        <>
          {/* Resumo de Comissões */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Total Ganho</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.totalEarnings || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Nível 1 (20%)</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats?.tier1Earnings || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Nível 2 (5%)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.tier2Earnings || 0)}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Já Sacado</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.paidTotal || 0)}
              </p>
            </div>
          </motion.div>

          {/* Histórico de Comissões */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Histórico de Comissões
              </h3>
            </div>

            {stats?.recentCommissions && stats.recentCommissions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Origem
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nível
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentCommissions.map((commission) => (
                      <tr key={commission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(commission.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {commission.sourceUser?.name || 'Usuário'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              commission.tier === 1
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            Nível {commission.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {formatCurrency(commission.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              commission.status === 'AVAILABLE'
                                ? 'bg-green-100 text-green-700'
                                : commission.status === 'PAID'
                                ? 'bg-blue-100 text-blue-700'
                                : commission.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {commission.status === 'AVAILABLE'
                              ? 'Disponível'
                              : commission.status === 'PAID'
                              ? 'Pago'
                              : commission.status === 'PENDING'
                              ? 'Pendente'
                              : 'Cancelado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <GiftIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma comissão ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Compartilhe seu link para começar a ganhar!
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
