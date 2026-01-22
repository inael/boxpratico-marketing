'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  TvIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  Account,
  ACCOUNT_PLAN_LIMITS,
  ACCOUNT_STATUS_LABELS,
  AccountPlan,
  AccountStatus,
} from '@/types';
import { LabelWithTooltip } from '@/components/ui/Tooltip';

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    plan: 'trial' as AccountPlan,
    trialDays: 7,
    extendDays: 0,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      ownerName: '',
      email: '',
      phone: '',
      plan: 'trial',
      trialDays: 7,
      extendDays: 0,
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      ownerName: account.ownerName,
      email: account.email,
      phone: account.phone || '',
      plan: account.plan,
      trialDays: account.trialDays || 7,
      extendDays: 0,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAccount) {
        // Atualizar conta
        const body: Record<string, unknown> = {
          name: formData.name,
          ownerName: formData.ownerName,
          email: formData.email,
          phone: formData.phone || undefined,
          plan: formData.plan,
        };

        // Extensão de trial
        if (formData.extendDays > 0 && editingAccount.plan === 'trial') {
          body.extendTrialDays = formData.extendDays;
        }

        await fetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        // Criar nova conta
        await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            ownerName: formData.ownerName,
            email: formData.email,
            phone: formData.phone || undefined,
            plan: formData.plan,
            trialDays: formData.trialDays,
          }),
        });
      }

      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const handleStatusChange = async (account: Account, newStatus: AccountStatus) => {
    try {
      await fetch(`/api/accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchAccounts();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Calcular dias restantes do trial
  const getTrialDaysRemaining = (account: Account): number => {
    if (!account.trialExpiresAt) return 0;
    const now = new Date();
    const expires = new Date(account.trialExpiresAt);
    const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // Filtrar contas
  const filteredAccounts = accounts.filter(account => {
    if (filterStatus !== 'all' && account.status !== filterStatus) return false;
    if (filterPlan !== 'all' && account.plan !== filterPlan) return false;
    return true;
  });

  // Estatísticas
  const stats = {
    total: accounts.length,
    trial: accounts.filter(a => a.plan === 'trial' && a.status === 'trial').length,
    active: accounts.filter(a => a.status === 'active').length,
    expired: accounts.filter(a => a.status === 'expired').length,
  };

  const getStatusColor = (status: AccountStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'trial': return 'bg-blue-100 text-blue-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'suspended': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlanColor = (plan: AccountPlan) => {
    switch (plan) {
      case 'trial': return 'bg-purple-100 text-purple-700';
      case 'basic': return 'bg-blue-100 text-blue-700';
      case 'pro': return 'bg-[#F59E0B]/10 text-[#D97706]';
      case 'enterprise': return 'bg-gray-900 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="w-8 h-8 text-[#F59E0B] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserGroupIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Contas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.trial}</p>
              <p className="text-sm text-gray-500">Em Trial</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-sm text-gray-500">Expirados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e botão de adicionar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="trial">Em trial</option>
            <option value="active">Ativos</option>
            <option value="expired">Expirados</option>
            <option value="suspended">Suspensos</option>
          </select>

          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos os planos</option>
            <option value="trial">Trial</option>
            <option value="basic">Básico</option>
            <option value="pro">Profissional</option>
            <option value="enterprise">Empresarial</option>
          </select>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Nova Conta
        </button>
      </div>

      {/* Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 border border-gray-200"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <LabelWithTooltip
                    label="Nome da Empresa"
                    tooltip="Nome da empresa ou condomínio"
                    required
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                    required
                  />
                </div>

                <div>
                  <LabelWithTooltip
                    label="Nome do Responsável"
                    tooltip="Nome completo do responsável pela conta"
                    required
                  />
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                    required
                  />
                </div>

                <div>
                  <LabelWithTooltip
                    label="Email"
                    tooltip="Email principal da conta"
                    required
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                    required
                  />
                </div>

                <div>
                  <LabelWithTooltip
                    label="Telefone"
                    tooltip="Telefone ou WhatsApp"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                  />
                </div>

                <div>
                  <LabelWithTooltip
                    label="Plano"
                    tooltip="Plano da conta"
                    required
                  />
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value as AccountPlan })}
                    className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                  >
                    <option value="trial">Trial ({ACCOUNT_PLAN_LIMITS.trial.monitors} monitor)</option>
                    <option value="basic">Básico ({ACCOUNT_PLAN_LIMITS.basic.monitors} monitores)</option>
                    <option value="pro">Profissional ({ACCOUNT_PLAN_LIMITS.pro.monitors} monitores)</option>
                    <option value="enterprise">Empresarial (ilimitado)</option>
                  </select>
                </div>

                {formData.plan === 'trial' && !editingAccount && (
                  <div>
                    <LabelWithTooltip
                      label="Dias de Trial"
                      tooltip="Duração do período de teste (1-30 dias)"
                      required
                    />
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={formData.trialDays}
                      onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 7 })}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                    />
                  </div>
                )}

                {editingAccount && editingAccount.plan === 'trial' && (
                  <div>
                    <LabelWithTooltip
                      label="Estender Trial"
                      tooltip="Adicionar mais dias ao período de teste"
                    />
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={formData.extendDays}
                      onChange={(e) => setFormData({ ...formData, extendDays: parseInt(e.target.value) || 0 })}
                      placeholder="Dias a adicionar"
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingAccount ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de contas */}
      <div className="space-y-3">
        {filteredAccounts.map((account, index) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-gray-900">{account.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPlanColor(account.plan)}`}>
                    {ACCOUNT_PLAN_LIMITS[account.plan].label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                    {ACCOUNT_STATUS_LABELS[account.status]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>{account.ownerName}</span>
                  <span>{account.email}</span>
                  {account.phone && <span>{account.phone}</span>}
                </div>

                {account.plan === 'trial' && (
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <CalendarDaysIcon className="w-4 h-4 text-blue-500" />
                    {getTrialDaysRemaining(account) > 0 ? (
                      <span className="text-blue-600">
                        {getTrialDaysRemaining(account)} dias restantes
                      </span>
                    ) : (
                      <span className="text-red-600">Trial expirado</span>
                    )}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <TvIcon className="w-4 h-4" />
                    {account.maxMonitors} {account.maxMonitors === 1 ? 'monitor' : 'monitores'}
                  </span>
                  <span>
                    {account.maxStorageMB} MB storage
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {account.status === 'expired' && (
                  <button
                    onClick={() => handleStatusChange(account, 'trial')}
                    className="px-3 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-all text-sm"
                    title="Reativar conta"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                )}

                {account.status === 'active' || account.status === 'trial' ? (
                  <button
                    onClick={() => handleStatusChange(account, 'suspended')}
                    className="px-3 py-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all text-sm"
                    title="Suspender conta"
                  >
                    <XCircleIcon className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  onClick={() => handleEdit(account)}
                  className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(account.id)}
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma conta encontrada</p>
        </div>
      )}
    </div>
  );
}
