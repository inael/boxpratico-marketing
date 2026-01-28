'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Contract,
  ContractType,
  ContractStatus,
  CONTRACT_TYPE_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  Condominium,
  Advertiser,
} from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import EmptyState from './EmptyState';
import PageHeader from './PageHeader';
import { FileSignature, Plus } from 'lucide-react';

// Helper to format currency
function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Helper to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

// Calculate days until expiration
function daysUntilExpiration(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function ContractsTab() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filterType, setFilterType] = useState<ContractType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ContractStatus | ''>('');

  // Form states
  const [type, setType] = useState<ContractType>('advertising');
  const [partyAName, setPartyAName] = useState('');
  const [partyACnpj, setPartyACnpj] = useState('');
  const [partyBName, setPartyBName] = useState('');
  const [partyBDocument, setPartyBDocument] = useState('');
  const [partyBEmail, setPartyBEmail] = useState('');
  const [partyBPhone, setPartyBPhone] = useState('');
  const [monthlyValue, setMonthlyValue] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [paymentDay, setPaymentDay] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ContractStatus>('draft');
  const [condominiumId, setCondominiumId] = useState('');
  const [advertiserId, setAdvertiserId] = useState('');
  const [notes, setNotes] = useState('');
  const [signedPdfUrl, setSignedPdfUrl] = useState('');

  useEffect(() => {
    loadContracts();
    loadCondominiums();
    loadAdvertisers();
  }, []);

  useEffect(() => {
    if (editingContract) {
      setType(editingContract.type);
      setPartyAName(editingContract.partyAName);
      setPartyACnpj(editingContract.partyACnpj || '');
      setPartyBName(editingContract.partyBName);
      setPartyBDocument(editingContract.partyBDocument || '');
      setPartyBEmail(editingContract.partyBEmail || '');
      setPartyBPhone(editingContract.partyBPhone || '');
      setMonthlyValue(editingContract.monthlyValue?.toString() || '');
      setTotalValue(editingContract.totalValue?.toString() || '');
      setPaymentDay(editingContract.paymentDay?.toString() || '10');
      setStartDate(editingContract.startDate.split('T')[0]);
      setEndDate(editingContract.endDate.split('T')[0]);
      setStatus(editingContract.status);
      setCondominiumId(editingContract.condominiumId || '');
      setAdvertiserId(editingContract.advertiserId || '');
      setNotes(editingContract.notes || '');
      setSignedPdfUrl(editingContract.signedPdfUrl || '');
    } else {
      resetForm();
    }
  }, [editingContract]);

  function resetForm() {
    setType('advertising');
    setPartyAName('');
    setPartyACnpj('');
    setPartyBName('');
    setPartyBDocument('');
    setPartyBEmail('');
    setPartyBPhone('');
    setMonthlyValue('');
    setTotalValue('');
    setPaymentDay('10');
    setStartDate('');
    setEndDate('');
    setStatus('draft');
    setCondominiumId('');
    setAdvertiserId('');
    setNotes('');
    setSignedPdfUrl('');
  }

  async function loadContracts() {
    try {
      const res = await fetch('/api/contracts');
      const data = await res.json();
      setContracts(data);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCondominiums() {
    try {
      const res = await fetch('/api/condominiums');
      const data = await res.json();
      setCondominiums(data);
    } catch (error) {
      console.error('Failed to load condominiums:', error);
    }
  }

  async function loadAdvertisers() {
    try {
      const res = await fetch('/api/advertisers');
      const data = await res.json();
      setAdvertisers(data);
    } catch (error) {
      console.error('Failed to load advertisers:', error);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSignedPdfUrl(data.url);
      } else {
        alert('Erro ao fazer upload do arquivo');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      type,
      partyAName,
      partyACnpj: partyACnpj || undefined,
      partyBName,
      partyBDocument: partyBDocument || undefined,
      partyBEmail: partyBEmail || undefined,
      partyBPhone: partyBPhone || undefined,
      monthlyValue: monthlyValue || undefined,
      totalValue: totalValue || undefined,
      paymentDay: paymentDay || undefined,
      startDate,
      endDate,
      status,
      condominiumId: condominiumId || undefined,
      advertiserId: advertiserId || undefined,
      notes: notes || undefined,
      signedPdfUrl: signedPdfUrl || undefined,
      signedAt: signedPdfUrl && status === 'signed' ? new Date().toISOString() : undefined,
    };

    try {
      if (editingContract) {
        const res = await fetch(`/api/contracts/${editingContract.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await loadContracts();
          setShowForm(false);
          setEditingContract(null);
          resetForm();
        }
      } else {
        const res = await fetch('/api/contracts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await loadContracts();
          setShowForm(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Failed to save contract:', error);
    }
  }

  async function handleDelete(contract: Contract) {
    if (!confirm(`Deseja realmente excluir o contrato com ${contract.partyBName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contracts/${contract.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadContracts();
      }
    } catch (error) {
      console.error('Failed to delete contract:', error);
    }
  }

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    if (filterType && c.type !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  // Contracts expiring soon (within 30 days)
  const expiringContracts = contracts.filter(c => {
    const days = daysUntilExpiration(c.endDate);
    return days > 0 && days <= 30 && c.status === 'active';
  });

  // Stats
  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    pending: contracts.filter(c => c.status === 'pending_signature').length,
    expiring: expiringContracts.length,
    totalMonthlyValue: contracts
      .filter(c => c.status === 'active' && c.monthlyValue)
      .reduce((sum, c) => sum + (c.monthlyValue || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Contratos"
        helpTitle="Contratos"
        helpDescription="Crie e gerencie contratos de publicidade. Defina valores, prazos, terminais e acompanhe o status de cada negociação."
        actions={
          <button
            onClick={() => {
              setEditingContract(null);
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Contrato
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Aguardando</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.expiring}</p>
              <p className="text-xs text-gray-500">Vencendo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.totalMonthlyValue)}</p>
              <p className="text-xs text-gray-500">Receita/mes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Alert */}
      {expiringContracts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800">Contratos vencendo em breve</h3>
              <ul className="mt-2 space-y-1">
                {expiringContracts.map(c => (
                  <li key={c.id} className="text-sm text-red-700">
                    <strong>{c.partyBName}</strong> - vence em {daysUntilExpiration(c.endDate)} dias ({formatDate(c.endDate)})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ContractType | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">Todos</option>
              {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(t => (
                <option key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ContractStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="">Todos</option>
              {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(s => (
                <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo e Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de Contrato *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ContractType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map(t => (
                    <option key={t} value={t}>{CONTRACT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContractStatus)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(s => (
                    <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parte A (Empresa) */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Parte A (Sua Empresa)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome/Razao Social *</label>
                  <input
                    type="text"
                    value={partyAName}
                    onChange={(e) => setPartyAName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Nome da sua empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={partyACnpj}
                    onChange={(e) => setPartyACnpj(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
            </div>

            {/* Parte B (Cliente) */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Parte B (Cliente)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nome/Razao Social *</label>
                  <input
                    type="text"
                    value={partyBName}
                    onChange={(e) => setPartyBName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">CPF/CNPJ</label>
                  <input
                    type="text"
                    value={partyBDocument}
                    onChange={(e) => setPartyBDocument(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="CPF ou CNPJ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={partyBEmail}
                    onChange={(e) => setPartyBEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={partyBPhone}
                    onChange={(e) => setPartyBPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>

            {/* Relacionamentos */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Vincular a</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {type === 'space_cession' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Local</label>
                    <select
                      value={condominiumId}
                      onChange={(e) => setCondominiumId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Selecione um local</option>
                      {condominiums.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {type === 'advertising' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Anunciante</label>
                    <select
                      value={advertiserId}
                      onChange={(e) => setAdvertiserId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="">Selecione um anunciante</option>
                      {advertisers.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Valores */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Valores</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monthlyValue}
                    onChange={(e) => setMonthlyValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Dia do Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDay}
                    onChange={(e) => setPaymentDay(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="10"
                  />
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Vigencia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Data de Inicio *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Data de Termino *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Upload do Contrato Assinado */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Contrato Assinado (PDF)</h3>
              <div className="space-y-3">
                {signedPdfUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <DocumentTextIcon className="w-6 h-6 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Contrato enviado</p>
                      <a
                        href={signedPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 hover:underline"
                      >
                        Visualizar PDF
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignedPdfUrl('')}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                  >
                    <ArrowUpTrayIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploading ? 'Enviando...' : 'Clique para enviar o contrato assinado (PDF)'}
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Observacoes */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Observacoes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                placeholder="Anotacoes sobre este contrato..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingContract(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                {editingContract ? 'Salvar Alteracoes' : 'Criar Contrato'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Contracts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredContracts.length === 0 ? (
          contracts.length === 0 ? (
            <EmptyState
              title="Nenhum contrato criado"
              description="Crie contratos de publicidade com seus clientes. Defina valores, prazos e quais telas serão utilizadas."
              icon={FileSignature}
              mascotImage="/images/mascot-empty.png"
              primaryAction={{
                label: 'Criar Contrato',
                onClick: () => setShowForm(true),
                icon: Plus,
              }}
            />
          ) : (
            <EmptyState
              variant="filter"
              title="Nenhum contrato encontrado"
              description="Nenhum contrato corresponde aos filtros selecionados. Tente ajustar os filtros."
              mascotImage="/images/mascot-search.png"
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Vigencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredContracts.map((contract) => {
                  const days = daysUntilExpiration(contract.endDate);
                  const isExpiring = days > 0 && days <= 30 && contract.status === 'active';
                  const isExpired = days <= 0;

                  return (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{contract.partyBName}</p>
                          {contract.partyBDocument && (
                            <p className="text-xs text-gray-500">{contract.partyBDocument}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {CONTRACT_TYPE_LABELS[contract.type]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {contract.monthlyValue ? (
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(contract.monthlyValue)}
                            </p>
                            <p className="text-xs text-gray-500">por mes</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">
                              {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                            </p>
                            {isExpiring && (
                              <p className="text-xs text-red-600 font-medium">
                                Vence em {days} dias
                              </p>
                            )}
                            {isExpired && contract.status === 'active' && (
                              <p className="text-xs text-red-600 font-medium">
                                Vencido!
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status].bg} ${CONTRACT_STATUS_COLORS[contract.status].text}`}>
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {contract.signedPdfUrl && (
                            <a
                              href={contract.signedPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver PDF"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setEditingContract(contract);
                              setShowForm(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(contract)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
