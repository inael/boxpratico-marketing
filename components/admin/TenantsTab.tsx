'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Monitor,
  Calendar,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Ban,
  ChevronDown,
  Plus,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';

interface Tenant {
  id: string;
  name: string;
  email: string;
  type: 'NETWORK_OPERATOR' | 'CORPORATE_CLIENT';
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: string;
  screensCount: number;
  usersCount: number;
  createdAt: string;
  trialEndsAt?: string;
  lastPaymentAt?: string;
  monthlyRevenue: number;
}

// Dados mockados - em producao virao da API
const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'Midia Box SP',
    email: 'admin@midiabox.com',
    type: 'NETWORK_OPERATOR',
    status: 'active',
    plan: 'Professional',
    screensCount: 25,
    usersCount: 5,
    createdAt: '2025-06-15T10:00:00Z',
    lastPaymentAt: '2026-01-15T10:00:00Z',
    monthlyRevenue: 499,
  },
  {
    id: '2',
    name: 'Hospital Santa Vida',
    email: 'ti@santavida.com.br',
    type: 'CORPORATE_CLIENT',
    status: 'active',
    plan: 'Starter',
    screensCount: 3,
    usersCount: 2,
    createdAt: '2025-09-01T10:00:00Z',
    lastPaymentAt: '2026-01-10T10:00:00Z',
    monthlyRevenue: 99,
  },
  {
    id: '3',
    name: 'Shopping Ibirapuera Ads',
    email: 'marketing@ibirapuera.com',
    type: 'NETWORK_OPERATOR',
    status: 'trial',
    plan: 'Enterprise',
    screensCount: 50,
    usersCount: 8,
    createdAt: '2026-01-10T10:00:00Z',
    trialEndsAt: '2026-02-10T10:00:00Z',
    monthlyRevenue: 0,
  },
  {
    id: '4',
    name: 'Restaurante Sabor Caseiro',
    email: 'contato@saborcaseiro.com',
    type: 'CORPORATE_CLIENT',
    status: 'suspended',
    plan: 'Starter',
    screensCount: 2,
    usersCount: 1,
    createdAt: '2025-11-20T10:00:00Z',
    monthlyRevenue: 0,
  },
];

export default function TenantsTab() {
  const [tenants] = useState<Tenant[]>(mockTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Filtrar tenants
  const filteredTenants = useMemo(() => {
    let filtered = [...tenants];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tenants, searchQuery, statusFilter, typeFilter]);

  // Calcular estatisticas
  const stats = useMemo(() => {
    const active = tenants.filter(t => t.status === 'active').length;
    const trial = tenants.filter(t => t.status === 'trial').length;
    const suspended = tenants.filter(t => t.status === 'suspended').length;
    const totalScreens = tenants.reduce((sum, t) => sum + t.screensCount, 0);
    const monthlyRecurring = tenants.reduce((sum, t) => sum + t.monthlyRevenue, 0);

    return { active, trial, suspended, totalScreens, monthlyRecurring, total: tenants.length };
  }, [tenants]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle };
      case 'trial':
        return { label: 'Trial', color: 'bg-blue-100 text-blue-700', icon: Clock };
      case 'suspended':
        return { label: 'Suspenso', color: 'bg-red-100 text-red-700', icon: XCircle };
      case 'cancelled':
        return { label: 'Cancelado', color: 'bg-gray-100 text-gray-700', icon: Ban };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: Clock };
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'NETWORK_OPERATOR' ? 'Operador de Rede' : 'Cliente Corporativo';
  };

  if (tenants.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader
          title="Tenants / Afiliados"
          helpTitle="Tenants / Afiliados"
          helpDescription="Gerencie tenants e afiliados da plataforma. Ative, suspenda e acompanhe cada operacao."
        />
        <EmptyState
          title="Nenhum tenant cadastrado"
          description="Tenants sao as empresas que usam a plataforma. Quando novos clientes se cadastrarem, eles aparecerão aqui."
          icon={Building2}
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
          title="Tenants / Afiliados"
          helpTitle="Tenants / Afiliados"
          helpDescription="Gerencie tenants e afiliados da plataforma. Ative, suspenda e acompanhe cada operacao."
        />

      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.trial}</p>
              <p className="text-sm text-gray-500">Em Trial</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalScreens}</p>
              <p className="text-sm text-gray-500">Telas Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRecurring)}</p>
              <p className="text-sm text-gray-500">MRR</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="trial">Em Trial</option>
                <option value="suspended">Suspensos</option>
                <option value="cancelled">Cancelados</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Tipos</option>
                <option value="NETWORK_OPERATOR">Operador de Rede</option>
                <option value="CORPORATE_CLIENT">Cliente Corporativo</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              Novo Tenant
            </button>
          </div>
        </div>

        {/* Lista de Tenants */}
        <div className="divide-y divide-gray-100">
          {filteredTenants.map((tenant) => {
            const statusConfig = getStatusConfig(tenant.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={tenant.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {tenant.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{tenant.name}</p>
                      <p className="text-sm text-gray-500">{tenant.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{getTypeLabel(tenant.type)}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs text-gray-400">Plano: {tenant.plan}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center hidden md:block">
                      <p className="font-semibold text-gray-900">{tenant.screensCount}</p>
                      <p className="text-xs text-gray-500">Telas</p>
                    </div>

                    <div className="text-center hidden md:block">
                      <p className="font-semibold text-gray-900">{tenant.usersCount}</p>
                      <p className="text-xs text-gray-500">Usuarios</p>
                    </div>

                    <div className="text-right hidden md:block">
                      <p className="font-semibold text-gray-900">{formatCurrency(tenant.monthlyRevenue)}/mes</p>
                      <p className="text-xs text-gray-500">
                        Desde {formatDate(tenant.createdAt)}
                      </p>
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>

                    <div className="relative">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTenants.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum tenant encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
