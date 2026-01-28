'use client';

import { useState, useEffect } from 'react';
import {
  Company,
  Payment,
  CommissionConfig,
  getMedalForTraffic,
  MedalConfig,
  DEFAULT_MEDAL_CONFIG,
} from '@/types';
import EmptyState from './EmptyState';
import PageHeader from './PageHeader';
import { Receipt, Plus } from 'lucide-react';

interface FinancialTabProps {
  companies: Company[];
  onRefresh: () => void;
}

export default function FinancialTab({ companies, onRefresh }: FinancialTabProps) {
  const [activeSection, setActiveSection] = useState<'payments' | 'commissions'>('payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [medalConfig, setMedalConfig] = useState<MedalConfig>(DEFAULT_MEDAL_CONFIG);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionForm, setCommissionForm] = useState({ percentage: '', notes: '' });
  const [savingCommission, setSavingCommission] = useState(false);

  // Filtrar apenas pontos de tela
  const screenLocations = companies.filter((c) => c.roles?.isScreenLocation);

  useEffect(() => {
    loadPayments();
    loadMedalConfig();
  }, []);

  async function loadPayments() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMedalConfig() {
    try {
      const res = await fetch('/api/settings/medals');
      if (res.ok) {
        const config = await res.json();
        setMedalConfig(config);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de medalhas:', error);
    }
  }

  const handleEditCommission = (company: Company) => {
    setEditingCommission(company.id);
    setCommissionForm({
      percentage: company.commission?.percentage?.toString() || '',
      notes: company.commission?.notes || '',
    });
  };

  const handleSaveCommission = async (companyId: string) => {
    setSavingCommission(true);
    try {
      const commission: CommissionConfig = {
        percentage: parseFloat(commissionForm.percentage) || 0,
        notes: commissionForm.notes || undefined,
      };

      const res = await fetch('/api/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: companyId,
          commission,
        }),
      });

      if (res.ok) {
        setEditingCommission(null);
        onRefresh();
      }
    } catch (error) {
      console.error('Erro ao salvar comissão:', error);
    } finally {
      setSavingCommission(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
      in_process: 'Processando',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobranças"
        helpTitle="Cobranças"
        helpDescription="Acompanhe cobranças, pagamentos e inadimplência. Gere boletos, envie lembretes e visualize o fluxo de caixa."
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('payments')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeSection === 'payments'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pagamentos
        </button>
        <button
          onClick={() => setActiveSection('commissions')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeSection === 'commissions'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Comissões dos Pontos
        </button>
      </div>

      {/* Payments Section */}
      {activeSection === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-4">Carregando pagamentos...</p>
            </div>
          ) : payments.length === 0 ? (
            <EmptyState
              title="Nenhuma cobrança encontrada"
              description="Acompanhe aqui os pagamentos dos seus clientes. As cobranças serão geradas automaticamente a partir dos contratos."
              icon={Receipt}
              mascotImage="/images/mascot-empty.png"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Método</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{payment.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {payment.paymentMethod === 'pix' && 'PIX'}
                          {payment.paymentMethod === 'credit_card' && 'Cartão'}
                          {payment.paymentMethod === 'boleto' && 'Boleto'}
                          {!payment.paymentMethod && '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                          R$ {payment.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                exibindo {payments.length} pagamento{payments.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      )}

      {/* Commissions Section */}
      {activeSection === 'commissions' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Configure o percentual de comissão que cada ponto de mídia receberá sobre os anúncios exibidos em suas telas.
              A classificação (medalha) é baseada no fluxo diário de pessoas.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {screenLocations.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhum ponto de mídia cadastrado</h3>
                <p className="text-gray-500 mt-1">Cadastre empresas como &quot;Ponto de Tela&quot; para configurar comissões.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ponto de Mídia</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Medalha</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Fluxo/Dia</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Comissão %</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Observações</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {screenLocations.map((company) => {
                        const medal = company.averageDailyTraffic
                          ? getMedalForTraffic(company.averageDailyTraffic, medalConfig)
                          : null;
                        const isEditing = editingCommission === company.id;

                        return (
                          <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                            {/* Nome */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                  {company.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{company.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {company.city && company.state ? `${company.city}/${company.state}` : '-'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Medalha */}
                            <td className="px-4 py-3 text-center">
                              {medal ? (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${medal.color}20`,
                                    color: medal.color,
                                    border: `1px solid ${medal.color}40`,
                                  }}
                                >
                                  <span className="text-sm">{medal.icon}</span>
                                  {medal.label}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>

                            {/* Fluxo */}
                            <td className="px-4 py-3 text-center text-sm text-gray-600">
                              {company.averageDailyTraffic ? `${company.averageDailyTraffic}` : '-'}
                            </td>

                            {/* Comissão */}
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={commissionForm.percentage}
                                  onChange={(e) => setCommissionForm({ ...commissionForm, percentage: e.target.value })}
                                  placeholder="0"
                                  min="0"
                                  max="100"
                                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                />
                              ) : (
                                <span className={`text-sm font-medium ${company.commission?.percentage ? 'text-green-600' : 'text-gray-400'}`}>
                                  {company.commission?.percentage ? `${company.commission.percentage}%` : '-'}
                                </span>
                              )}
                            </td>

                            {/* Observações */}
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={commissionForm.notes}
                                  onChange={(e) => setCommissionForm({ ...commissionForm, notes: e.target.value })}
                                  placeholder="Observações..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                                />
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {company.commission?.notes || '-'}
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="px-4 py-3 text-center">
                              {isEditing ? (
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleSaveCommission(company.id)}
                                    disabled={savingCommission}
                                    className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                                  >
                                    {savingCommission ? '...' : 'Salvar'}
                                  </button>
                                  <button
                                    onClick={() => setEditingCommission(null)}
                                    className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleEditCommission(company)}
                                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-600/10 rounded-lg transition-colors"
                                  title="Editar comissão"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                  exibindo {screenLocations.length} ponto{screenLocations.length !== 1 ? 's' : ''} de mídia
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
