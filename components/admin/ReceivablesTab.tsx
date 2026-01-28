'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ChevronDown,
  Filter,
  Download,
} from 'lucide-react';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';

interface Receivable {
  id: string;
  description: string;
  clientName: string;
  contractId: string;
  dueDate: string;
  amount: number;
  status: 'pending' | 'overdue' | 'received' | 'scheduled';
  type: 'contract' | 'campaign' | 'subscription';
}

// Dados mockados - em producao virao da API
const mockReceivables: Receivable[] = [
  {
    id: '1',
    description: 'Contrato #001 - Janeiro/2026',
    clientName: 'Coca-Cola Brasil',
    contractId: 'contract-001',
    dueDate: '2026-01-15',
    amount: 5000,
    status: 'received',
    type: 'contract',
  },
  {
    id: '2',
    description: 'Contrato #001 - Fevereiro/2026',
    clientName: 'Coca-Cola Brasil',
    contractId: 'contract-001',
    dueDate: '2026-02-15',
    amount: 5000,
    status: 'pending',
    type: 'contract',
  },
  {
    id: '3',
    description: 'Campanha Verao - Nike',
    clientName: 'Nike do Brasil',
    contractId: 'contract-002',
    dueDate: '2026-01-20',
    amount: 3500,
    status: 'overdue',
    type: 'campaign',
  },
  {
    id: '4',
    description: 'Contrato #003 - Marco/2026',
    clientName: 'Restaurante Bom Sabor',
    contractId: 'contract-003',
    dueDate: '2026-03-01',
    amount: 1200,
    status: 'scheduled',
    type: 'contract',
  },
  {
    id: '5',
    description: 'Contrato #003 - Abril/2026',
    clientName: 'Restaurante Bom Sabor',
    contractId: 'contract-003',
    dueDate: '2026-04-01',
    amount: 1200,
    status: 'scheduled',
    type: 'contract',
  },
];

export default function ReceivablesTab() {
  const [receivables] = useState<Receivable[]>(mockReceivables);
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

  // Filtrar recebíveis
  const filteredReceivables = useMemo(() => {
    let filtered = [...receivables];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (periodFilter !== 'all') {
      const now = new Date();
      const endDate = new Date();

      switch (periodFilter) {
        case '7days':
          endDate.setDate(now.getDate() + 7);
          break;
        case '30days':
          endDate.setDate(now.getDate() + 30);
          break;
        case '90days':
          endDate.setDate(now.getDate() + 90);
          break;
      }

      if (periodFilter !== 'all') {
        filtered = filtered.filter(r => {
          const dueDate = new Date(r.dueDate);
          return dueDate >= now && dueDate <= endDate;
        });
      }
    }

    // Ordenar por data de vencimento
    return filtered.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [receivables, statusFilter, periodFilter]);

  // Calcular totais
  const totals = useMemo(() => {
    const pending = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const overdue = receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0);
    const received = receivables.filter(r => r.status === 'received').reduce((sum, r) => sum + r.amount, 0);
    const scheduled = receivables.filter(r => r.status === 'scheduled').reduce((sum, r) => sum + r.amount, 0);
    const total = pending + overdue + scheduled;

    return { pending, overdue, received, scheduled, total };
  }, [receivables]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'received':
        return { label: 'Recebido', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'overdue':
        return { label: 'Atrasado', color: 'bg-red-100 text-red-700', icon: AlertCircle };
      case 'pending':
        return { label: 'A Receber', color: 'bg-amber-100 text-amber-700', icon: Clock };
      case 'scheduled':
        return { label: 'Agendado', color: 'bg-blue-100 text-blue-700', icon: Calendar };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  if (receivables.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader
          title="Recebiveis"
          helpTitle="Recebiveis"
          helpDescription="Visualize recebiveis futuros e projecao de faturamento. Acompanhe valores a receber por periodo."
        />
        <EmptyState
          title="Nenhum recebivel encontrado"
          description="Quando voce tiver contratos e campanhas ativos, seus recebiveis aparecerão aqui."
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
          title="Recebiveis"
          helpTitle="Recebiveis"
          helpDescription="Visualize recebiveis futuros e projecao de faturamento. Acompanhe valores a receber por periodo."
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
              <p className="text-sm text-gray-500">A Receber</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.overdue)}</p>
              <p className="text-sm text-gray-500">Atrasados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.received)}</p>
              <p className="text-sm text-gray-500">Recebidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.total)}</p>
              <p className="text-sm text-gray-500">Total Previsto</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Acoes */}
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
                <option value="pending">A Receber</option>
                <option value="overdue">Atrasados</option>
                <option value="received">Recebidos</option>
                <option value="scheduled">Agendados</option>
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Periodos</option>
                <option value="7days">Proximos 7 dias</option>
                <option value="30days">Proximos 30 dias</option>
                <option value="90days">Proximos 90 dias</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Lista de Recebiveis */}
        <div className="divide-y divide-gray-100">
          {filteredReceivables.map((receivable) => {
            const statusConfig = getStatusConfig(receivable.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={receivable.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      receivable.status === 'overdue' ? 'bg-red-100' :
                      receivable.status === 'received' ? 'bg-green-100' :
                      receivable.status === 'pending' ? 'bg-amber-100' : 'bg-blue-100'
                    }`}>
                      <DollarSign className={`w-5 h-5 ${
                        receivable.status === 'overdue' ? 'text-red-600' :
                        receivable.status === 'received' ? 'text-green-600' :
                        receivable.status === 'pending' ? 'text-amber-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{receivable.description}</p>
                      <p className="text-sm text-gray-500">{receivable.clientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(receivable.amount)}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(receivable.dueDate)}
                      </p>
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

        {filteredReceivables.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum recebivel encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
