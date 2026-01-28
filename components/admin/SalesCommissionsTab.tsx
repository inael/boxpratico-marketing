'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  FileText,
  Download,
  Filter,
  ChevronDown,
  Wallet,
  CreditCard,
} from 'lucide-react';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';
import { useAuth } from '@/contexts/AuthContext';

interface Commission {
  id: string;
  contractId: string;
  contractName: string;
  clientName: string;
  saleValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'available' | 'paid' | 'processing';
  referenceMonth: string;
  createdAt: string;
  paidAt?: string;
}

// Dados mockados - em producao virao da API
const mockCommissions: Commission[] = [
  {
    id: '1',
    contractId: 'contract-001',
    contractName: 'Contrato Coca-Cola 2026',
    clientName: 'Coca-Cola Brasil',
    saleValue: 10000,
    commissionRate: 15,
    commissionAmount: 1500,
    status: 'paid',
    referenceMonth: '2025-12',
    createdAt: '2025-12-15T10:00:00Z',
    paidAt: '2026-01-05T10:00:00Z',
  },
  {
    id: '2',
    contractId: 'contract-001',
    contractName: 'Contrato Coca-Cola 2026',
    clientName: 'Coca-Cola Brasil',
    saleValue: 10000,
    commissionRate: 15,
    commissionAmount: 1500,
    status: 'available',
    referenceMonth: '2026-01',
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '3',
    contractId: 'contract-002',
    contractName: 'Campanha Verao Nike',
    clientName: 'Nike do Brasil',
    saleValue: 5000,
    commissionRate: 15,
    commissionAmount: 750,
    status: 'pending',
    referenceMonth: '2026-01',
    createdAt: '2026-01-20T10:00:00Z',
  },
  {
    id: '4',
    contractId: 'contract-003',
    contractName: 'Contrato Restaurante Bom Sabor',
    clientName: 'Restaurante Bom Sabor',
    saleValue: 2400,
    commissionRate: 15,
    commissionAmount: 360,
    status: 'pending',
    referenceMonth: '2026-02',
    createdAt: '2026-01-25T10:00:00Z',
  },
];

export default function SalesCommissionsTab() {
  const { user } = useAuth();
  const [commissions] = useState<Commission[]>(mockCommissions);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // Filtrar comissoes
  const filteredCommissions = useMemo(() => {
    let filtered = [...commissions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Ordenar por data de criacao (mais recente primeiro)
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [commissions, statusFilter]);

  // Calcular totais
  const totals = useMemo(() => {
    const pending = commissions
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const available = commissions
      .filter(c => c.status === 'available')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const paid = commissions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const processing = commissions
      .filter(c => c.status === 'processing')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const totalSales = commissions.reduce((sum, c) => sum + c.saleValue, 0);
    const totalCommissions = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);

    return { pending, available, paid, processing, totalSales, totalCommissions };
  }, [commissions]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { label: 'Pago', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'available':
        return { label: 'Disponivel', color: 'bg-indigo-100 text-indigo-700', icon: Wallet };
      case 'pending':
        return { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'processing':
        return { label: 'Processando', color: 'bg-blue-100 text-blue-700', icon: CreditCard };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  if (commissions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader
          title="Minhas Comissoes"
          helpTitle="Comissoes de Venda"
          helpDescription="Acompanhe comissoes de vendas. Veja valores pendentes, pagos e historico de ganhos por contrato."
        />
        <EmptyState
          title="Nenhuma comissao encontrada"
          description="Suas comissoes de vendas aparecerão aqui quando voce fechar contratos."
          icon={DollarSign}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
          title="Minhas Comissoes"
          helpTitle="Comissoes de Venda"
          helpDescription="Acompanhe comissoes de vendas. Veja valores pendentes, pagos e historico de ganhos por contrato."
        />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.pending)}</p>
              <p className="text-sm text-gray-500">Pendente</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.available)}</p>
              <p className="text-sm text-gray-500">Disponivel para Saque</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.paid)}</p>
              <p className="text-sm text-gray-500">Total Pago</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.totalSales)}</p>
              <p className="text-sm text-gray-500">Total em Vendas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botao de Saque */}
      {totals.available > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Saldo Disponivel para Saque</h3>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totals.available)}</p>
            </div>
            <button className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Solicitar Saque
            </button>
          </div>
        </div>
      )}

      {/* Filtros e Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Pendente</option>
                <option value="available">Disponivel</option>
                <option value="processing">Processando</option>
                <option value="paid">Pago</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Lista de Comissoes */}
        <div className="divide-y divide-gray-100">
          {filteredCommissions.map((commission) => {
            const statusConfig = getStatusConfig(commission.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={commission.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{commission.contractName}</p>
                      <p className="text-sm text-gray-500">{commission.clientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-gray-500">Venda: {formatCurrency(commission.saleValue)}</p>
                      <p className="text-xs text-gray-400">{commission.commissionRate}% de comissao</p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(commission.commissionAmount)}</p>
                      <p className="text-sm text-gray-500">{formatMonth(commission.referenceMonth)}</p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCommissions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma comissao encontrada com os filtros selecionados</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
