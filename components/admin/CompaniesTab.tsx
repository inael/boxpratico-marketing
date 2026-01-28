'use client';

import { useState, useEffect } from 'react';
import {
  Company,
  PersonType,
  CompanyRoles,
  BusinessCategory,
  BUSINESS_CATEGORIES,
  PERSON_TYPE_LABELS,
  PricingConfig,
  CommissionConfig,
  TargetRadiusConfig,
  MedalConfig,
  MedalTier,
  DEFAULT_MEDAL_CONFIG,
  getMedalForTraffic,
  MEDAL_COLORS,
} from '@/types';
import LocationsMap from './LocationsMap';
import EmptyState from './EmptyState';
import PageHeader from './PageHeader';
import { Building2, Plus } from 'lucide-react';

interface CompaniesTabProps {
  companies: Company[];
  onRefresh: () => void;
}

export default function CompaniesTab({ companies, onRefresh }: CompaniesTabProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<'all' | 'screen_location' | 'advertiser'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [medalConfig, setMedalConfig] = useState<MedalConfig>(DEFAULT_MEDAL_CONFIG);

  // Carregar configuração de medalhas
  useEffect(() => {
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
    loadMedalConfig();
  }, []);

  // Helper para obter medalha de uma empresa
  const getCompanyMedal = (company: Company): MedalTier | null => {
    if (!company.roles?.isScreenLocation || !company.averageDailyTraffic) {
      return null;
    }
    return getMedalForTraffic(company.averageDailyTraffic, medalConfig);
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    personType: 'company' as PersonType,
    document: '',
    isScreenLocation: false,
    isAdvertiser: false,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    logoUrl: '',
    // Endereço
    address: '',
    addressNumber: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    // Coordenadas (readonly - preenchidas automaticamente)
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    // Campos de ponto de tela
    category: '' as BusinessCategory | '',
    whatsappPhone: '',
    averageDailyTraffic: '',
    // Campos de anunciante
    segment: '',
    notes: '',
    // Status
    isActive: true,
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      personType: 'company',
      document: '',
      isScreenLocation: false,
      isAdvertiser: false,
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      logoUrl: '',
      address: '',
      addressNumber: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      latitude: undefined,
      longitude: undefined,
      category: '',
      whatsappPhone: '',
      averageDailyTraffic: '',
      segment: '',
      notes: '',
      isActive: true,
    });
    setEditingCompany(null);
  };

  // Carregar dados para edição
  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      personType: company.personType || 'company',
      document: company.document || '',
      isScreenLocation: company.roles?.isScreenLocation || false,
      isAdvertiser: company.roles?.isAdvertiser || false,
      contactName: company.contactName || '',
      contactPhone: company.contactPhone || '',
      contactEmail: company.contactEmail || '',
      logoUrl: company.logoUrl || '',
      address: company.address || '',
      addressNumber: company.addressNumber || '',
      complement: company.complement || '',
      neighborhood: company.neighborhood || '',
      city: company.city || '',
      state: company.state || '',
      zipCode: company.zipCode || '',
      latitude: company.latitude,
      longitude: company.longitude,
      category: company.category || '',
      whatsappPhone: company.whatsappPhone || '',
      averageDailyTraffic: company.averageDailyTraffic?.toString() || '',
      segment: company.segment || '',
      notes: company.notes || '',
      isActive: company.isActive ?? true,
    });
    setIsFormOpen(true);
  };


  // Salvar empresa
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.isScreenLocation && !formData.isAdvertiser) {
      alert('Selecione pelo menos um papel: Ponto de Tela ou Anunciante');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...(editingCompany ? { id: editingCompany.id } : {}),
        name: formData.name,
        personType: formData.personType,
        document: formData.document || undefined,
        roles: {
          isScreenLocation: formData.isScreenLocation,
          isAdvertiser: formData.isAdvertiser,
        },
        contactName: formData.contactName || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        logoUrl: formData.logoUrl || undefined,
        address: formData.address || undefined,
        addressNumber: formData.addressNumber || undefined,
        complement: formData.complement || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        category: formData.category || undefined,
        whatsappPhone: formData.whatsappPhone || undefined,
        averageDailyTraffic: formData.averageDailyTraffic
          ? parseInt(formData.averageDailyTraffic)
          : undefined,
        segment: formData.segment || undefined,
        notes: formData.notes || undefined,
        isActive: formData.isActive,
      };

      const response = await fetch('/api/companies', {
        method: editingCompany ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar empresa');
      }

      resetForm();
      setIsFormOpen(false);
      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao salvar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir empresa
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const response = await fetch(`/api/companies?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir empresa');
      }

      onRefresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao excluir empresa');
    }
  };

  // Filtrar empresas
  const filteredCompanies = companies.filter((company) => {
    // Filtro por papel
    if (filterRole === 'screen_location' && !company.roles?.isScreenLocation) return false;
    if (filterRole === 'advertiser' && !company.roles?.isAdvertiser) return false;

    // Filtro por busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        company.name.toLowerCase().includes(search) ||
        company.document?.toLowerCase().includes(search) ||
        company.city?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Estados brasileiros
  const STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  // Se formulário está aberto, mostrar apenas o formulário
  if (isFormOpen) {
    return (
      <div className="space-y-6">
        {/* Header do formulário */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre um ponto de tela, anunciante ou ambos
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsFormOpen(false);
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna 1: Dados básicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Dados Básicos</h3>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Tipo de pessoa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Pessoa
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="personType"
                      value="company"
                      checked={formData.personType === 'company'}
                      onChange={() => setFormData({ ...formData, personType: 'company' })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Pessoa Jurídica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="personType"
                      value="individual"
                      checked={formData.personType === 'individual'}
                      onChange={() => setFormData({ ...formData, personType: 'individual' })}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Pessoa Física</span>
                  </label>
                </div>
              </div>

              {/* Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.personType === 'company' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder={formData.personType === 'company' ? '00.000.000/0000-00' : '000.000.000-00'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Papéis da empresa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Papel da Empresa *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isScreenLocation}
                      onChange={(e) =>
                        setFormData({ ...formData, isScreenLocation: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Ponto de Tela</div>
                      <div className="text-xs text-gray-500">
                        Local que possui monitores para exibir conteúdo
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.isAdvertiser}
                      onChange={(e) =>
                        setFormData({ ...formData, isAdvertiser: e.target.checked })
                      }
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Anunciante</div>
                      <div className="text-xs text-gray-500">
                        Empresa que compra publicidade nas telas
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Contato */}
              <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">Contato</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Coluna 2: Endereço e campos específicos */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Endereço</h3>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Logradouro
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Rua, Avenida..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número
                  </label>
                  <input
                    type="text"
                    value={formData.addressNumber}
                    onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    placeholder="Sala, Bloco..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">Selecione</option>
                    {STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="00000-000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Indicador de localização automática */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800">Localização no Mapa</p>
                    <p className="text-xs text-green-600">
                      {formData.latitude && formData.longitude
                        ? 'Localização configurada - será atualizada automaticamente se o endereço mudar'
                        : 'A localização será obtida automaticamente ao salvar, baseada no endereço'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Campos específicos para Ponto de Tela */}
              {formData.isScreenLocation && (
                <>
                  <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">
                    Configurações do Ponto de Tela
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria do Local
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as BusinessCategory })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      WhatsApp do Local
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsappPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsappPhone: e.target.value })
                      }
                      placeholder="(00) 00000-0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  {/* Fluxo diário com medalha estimada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fluxo Diário Médio (pessoas/dia)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={formData.averageDailyTraffic}
                        onChange={(e) =>
                          setFormData({ ...formData, averageDailyTraffic: e.target.value })
                        }
                        placeholder="Ex: 500"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {/* Medalha estimada */}
                      {formData.averageDailyTraffic && parseInt(formData.averageDailyTraffic) > 0 && (
                        (() => {
                          const medal = getMedalForTraffic(parseInt(formData.averageDailyTraffic), medalConfig);
                          if (!medal) return null;
                          return (
                            <div
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{
                                backgroundColor: `${medal.color}20`,
                                border: `1px solid ${medal.color}40`,
                              }}
                            >
                              <span className="text-lg">{medal.icon}</span>
                              <span className="text-sm font-medium" style={{ color: medal.color }}>
                                {medal.label}
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Informe a quantidade média de pessoas que circulam no local por dia para definir a classificação (medalha)
                    </p>
                  </div>
                </>
              )}

              {/* Campos específicos para Anunciante */}
              {formData.isAdvertiser && (
                <>
                  <h3 className="font-semibold text-gray-900 border-b pb-2 pt-4">
                    Configurações do Anunciante
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Segmento de Atuação
                    </label>
                    <select
                      value={formData.segment}
                      onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="">Selecione um segmento</option>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status e botões */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Empresa ativa</span>
            </label>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Salvando...' : editingCompany ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Lista de empresas
  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus Clientes"
        helpTitle="Meus Clientes"
        helpDescription="Cadastre e gerencie seus clientes (anunciantes) e pontos de exibição. Vincule empresas a contratos e campanhas de publicidade."
        actions={
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Empresa
          </button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, documento ou cidade..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterRole('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRole === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterRole('screen_location')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRole === 'screen_location'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pontos de Tela
          </button>
          <button
            onClick={() => setFilterRole('advertiser')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterRole === 'advertiser'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Anunciantes
          </button>
        </div>
      </div>

      {/* Lista em formato de tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredCompanies.length === 0 ? (
          <EmptyState
            title="Nenhuma empresa cadastrada"
            description="Cadastre seus clientes e pontos de exibição para começar a criar contratos e campanhas de publicidade."
            icon={Building2}
            mascotImage="/images/mascot-empty.png"
            primaryAction={{
              label: 'Cadastrar Empresa',
              onClick: () => setIsFormOpen(true),
              icon: Plus,
            }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Nome
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Medalha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Cidade/UF
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Mapa
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Situação
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Opções
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCompanies.map((company) => (
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
                              {company.personType === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Documento */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company.document || '-'}
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          {company.roles?.isScreenLocation && (
                            <span
                              className="w-7 h-7 rounded flex items-center justify-center bg-green-100 text-green-600"
                              title="Ponto de Tela"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </span>
                          )}
                          {company.roles?.isAdvertiser && (
                            <span
                              className="w-7 h-7 rounded flex items-center justify-center bg-blue-100 text-blue-600"
                              title="Anunciante"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Medalha */}
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const medal = getCompanyMedal(company);
                          if (!medal) {
                            return (
                              <span className="text-gray-400 text-xs">-</span>
                            );
                          }
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${medal.color}20`,
                                color: medal.color,
                                border: `1px solid ${medal.color}40`,
                              }}
                              title={`${medal.label} - ${company.averageDailyTraffic} pessoas/dia`}
                            >
                              <span className="text-sm">{medal.icon}</span>
                              {medal.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Cidade/UF */}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {company.city && company.state
                          ? `${company.city}/${company.state}`
                          : company.city || company.state || '-'}
                      </td>

                      {/* Mapa */}
                      <td className="px-4 py-3 text-center">
                        {company.latitude && company.longitude ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-green-100 text-green-600" title="Localização configurada">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-100 text-gray-400" title="Sem localização">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </span>
                        )}
                      </td>

                      {/* Situação */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={async () => {
                            try {
                              await fetch('/api/companies', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: company.id,
                                  isActive: !company.isActive,
                                }),
                              });
                              onRefresh();
                            } catch (error) {
                              console.error('Erro ao atualizar status:', error);
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            company.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              company.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Opções */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(company)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-600/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(company.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer com paginação */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
              <div>
                exibindo do 1° ao {filteredCompanies.length}° item dos {filteredCompanies.length} encontrados
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 py-1 bg-gray-100 rounded font-medium">1</span>
                <button
                  disabled
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
