'use client';

import { useState, useEffect } from 'react';
import { Advertiser, BUSINESS_CATEGORIES, TargetRadiusConfig } from '@/types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

import { Condominium, Monitor } from '@/types';
import BudgetCalculator from './BudgetCalculator';

// Dynamic import do mapa para evitar SSR issues
const RadiusMapSelector = dynamic(() => import('./RadiusMapSelector'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-gray-500">Carregando mapa...</div>
    </div>
  ),
});

// Helper to generate slug from name
function sanitizeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdvertisersTab() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAdvertiser, setEditingAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [segment, setSegment] = useState('');
  const [notes, setNotes] = useState('');
  // Raio de alcance
  const [useTargetRadius, setUseTargetRadius] = useState(false);
  const [targetRadius, setTargetRadius] = useState<TargetRadiusConfig | null>(null);

  useEffect(() => {
    loadAdvertisers();
    loadCondominiums();
    loadMonitors();
  }, []);

  useEffect(() => {
    setSlug(sanitizeSlug(name));
  }, [name]);

  useEffect(() => {
    if (editingAdvertiser) {
      setName(editingAdvertiser.name);
      setSlug(editingAdvertiser.slug);
      setContactName(editingAdvertiser.contactName || '');
      setContactPhone(editingAdvertiser.contactPhone || '');
      setContactEmail(editingAdvertiser.contactEmail || '');
      setCnpj(editingAdvertiser.cnpj || '');
      setSegment(editingAdvertiser.segment || '');
      setNotes(editingAdvertiser.notes || '');
      setUseTargetRadius(!!editingAdvertiser.targetRadius);
      setTargetRadius(editingAdvertiser.targetRadius || null);
    } else {
      resetForm();
    }
  }, [editingAdvertiser]);

  function resetForm() {
    setName('');
    setSlug('');
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    setCnpj('');
    setSegment('');
    setNotes('');
    setUseTargetRadius(false);
    setTargetRadius(null);
  }

  async function loadAdvertisers() {
    try {
      const res = await fetch('/api/advertisers');
      const data = await res.json();
      setAdvertisers(data);
    } catch (error) {
      console.error('Failed to load advertisers:', error);
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

  async function loadMonitors() {
    try {
      const res = await fetch('/api/monitors');
      const data = await res.json();
      setMonitors(data);
    } catch (error) {
      console.error('Failed to load monitors:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name,
      slug,
      contactName: contactName || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      cnpj: cnpj || undefined,
      segment: segment || undefined,
      notes: notes || undefined,
      targetRadius: useTargetRadius && targetRadius ? targetRadius : undefined,
      isActive: true,
    };

    try {
      if (editingAdvertiser) {
        await fetch(`/api/advertisers/${editingAdvertiser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/advertisers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      setShowForm(false);
      setEditingAdvertiser(null);
      resetForm();
      loadAdvertisers();
    } catch (error) {
      console.error('Failed to save advertiser:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este anunciante?')) return;

    try {
      await fetch(`/api/advertisers/${id}`, { method: 'DELETE' });
      loadAdvertisers();
    } catch (error) {
      console.error('Failed to delete advertiser:', error);
    }
  }

  async function toggleActive(advertiser: Advertiser) {
    try {
      await fetch(`/api/advertisers/${advertiser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !advertiser.isActive }),
      });
      loadAdvertisers();
    } catch (error) {
      console.error('Failed to toggle advertiser:', error);
    }
  }

  // Helper to get category name from id
  const getCategoryName = (categoryId: string) => {
    const category = BUSINESS_CATEGORIES.find(c => c.id === categoryId);
    return category ? `${category.icon} ${category.name}` : categoryId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Anunciantes</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Gerencie os anunciantes que pagam para aparecer nas telas
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md text-sm sm:text-base w-full sm:w-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Anunciante
          </button>
        )}
      </div>

      {/* Form */}
      {(showForm || editingAdvertiser) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {editingAdvertiser ? 'Editar Anunciante' : 'Novo Anunciante'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: BoxPrático Mercado Inteligente"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Categoria/Segmento
                </label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                >
                  <option value="">Selecione a categoria</option>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  CNPJ (opcional)
                </label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-bold text-gray-700 mb-3">Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre o anunciante..."
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900 resize-none"
              />
            </div>

            {/* Raio de Alcance */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    Raio de Alcance
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Defina um ponto central e raio para sugerir locais próximos nas playlists
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useTargetRadius}
                    onChange={(e) => {
                      setUseTargetRadius(e.target.checked);
                      if (!e.target.checked) {
                        setTargetRadius(null);
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F59E0B]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                </label>
              </div>

              {useTargetRadius && (
                <>
                  <RadiusMapSelector
                    value={targetRadius}
                    onChange={setTargetRadius}
                  />
                  <BudgetCalculator
                    radiusConfig={targetRadius}
                    condominiums={condominiums}
                    monitors={monitors}
                  />
                </>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAdvertiser(null);
                  resetForm();
                }}
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {editingAdvertiser ? 'Salvar Alterações' : 'Criar Anunciante'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* List */}
      {advertisers.length === 0 && !showForm ? (
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
          <UserGroupIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Nenhum anunciante cadastrado</h3>
          <p className="text-gray-500 mb-4">
            Cadastre o primeiro anunciante para começar a vender espaço publicitário
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Criar primeiro anunciante
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {advertisers.map((advertiser, index) => (
            <motion.div
              key={advertiser.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    advertiser.isActive
                      ? 'bg-gradient-to-br from-blue-100 to-indigo-100'
                      : 'bg-gray-100'
                  }`}>
                    <UserGroupIcon className={`w-6 h-6 ${advertiser.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-display font-bold text-gray-900 truncate">
                      {advertiser.name}
                    </h3>
                    {advertiser.segment && (
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full mt-1">
                        {getCategoryName(advertiser.segment)}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  advertiser.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 mb-4">
                {advertiser.contactName && (
                  <p className="text-sm text-gray-600">{advertiser.contactName}</p>
                )}
                {advertiser.contactPhone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <PhoneIcon className="w-3 h-3" />
                    {advertiser.contactPhone}
                  </p>
                )}
                {advertiser.contactEmail && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <EnvelopeIcon className="w-3 h-3" />
                    {advertiser.contactEmail}
                  </p>
                )}
                {advertiser.targetRadius && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPinIcon className="w-3 h-3" />
                    Raio: {advertiser.targetRadius.radiusKm} km
                    {advertiser.targetRadius.centerName && (
                      <span className="text-gray-400">({advertiser.targetRadius.centerName})</span>
                    )}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(advertiser)}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    advertiser.isActive
                      ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                  title={advertiser.isActive ? 'Desativar' : 'Ativar'}
                >
                  {advertiser.isActive ? (
                    <XCircleIcon className="w-4 h-4" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setEditingAdvertiser(advertiser)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-sm font-medium"
                  title="Editar"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(advertiser.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                  title="Excluir"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
