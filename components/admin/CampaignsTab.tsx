'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MegaphoneIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Campaign, Condominium, MediaItem, Monitor } from '@/types';

// Helper to send WhatsApp notifications
async function sendWhatsAppNotification(
  type: string,
  condominiumName: string,
  condominiumPhone?: string,
  entityName?: string,
  details?: string
) {
  try {
    await fetch('/api/whatsapp/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        condominiumName,
        condominiumPhone,
        entityName,
        details,
      }),
    });
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
}

interface CampaignsTabProps {
  condominiums: Condominium[];
}

export default function CampaignsTab({ condominiums }: CampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceCondominium, setCopySourceCondominium] = useState<string>('');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [availableMediaItems, setAvailableMediaItems] = useState<MediaItem[]>([]);
  const [campaignMediaItems, setCampaignMediaItems] = useState<MediaItem[]>([]);

  // Function to get default dates
  const getDefaultDates = () => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0],
    };
  };

  const [formData, setFormData] = useState({
    name: '',
    monitorId: '',
    startDate: getDefaultDates().startDate,
    endDate: getDefaultDates().endDate,
    isActive: true,
    showNews: true,
    newsEveryNMedia: 3,
    newsDurationSeconds: 10,
  });

  useEffect(() => {
    if (condominiums.length > 0 && !selectedCondominium) {
      setSelectedCondominium(condominiums[0].id);
    }
  }, [condominiums]);

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCondominium) {
      fetchCampaigns();
      fetchMediaItems();
      fetchMonitors();
    }
  }, [selectedCondominium]);

  useEffect(() => {
    if (showForm && editingCampaign) {
      fetchCampaignMedia();
    } else if (showForm) {
      setCampaignMediaItems([]);
    }
  }, [showForm, editingCampaign]);

  const fetchAllCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setAllCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch all campaigns:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const fetchMediaItems = async () => {
    try {
      const response = await fetch(`/api/media-items?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setAvailableMediaItems(data.filter((m: MediaItem) => m.isActive));
    } catch (error) {
      console.error('Failed to fetch media items:', error);
    }
  };

  const fetchMonitors = async () => {
    try {
      const response = await fetch(`/api/monitors?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setMonitors(data.filter((m: Monitor) => m.isActive));
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    }
  };

  const fetchCampaignMedia = async () => {
    if (!editingCampaign) return;
    try {
      const response = await fetch(`/api/media-items?campaignId=${editingCampaign.id}`);
      const data = await response.json();
      setCampaignMediaItems(data.sort((a: MediaItem, b: MediaItem) => a.order - b.order));
    } catch (error) {
      console.error('Failed to fetch campaign media:', error);
    }
  };

  const moveMediaUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...campaignMediaItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setCampaignMediaItems(newItems);
  };

  const moveMediaDown = (index: number) => {
    if (index === campaignMediaItems.length - 1) return;
    const newItems = [...campaignMediaItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setCampaignMediaItems(newItems);
  };

  const removeMediaFromCampaign = (mediaId: string) => {
    setCampaignMediaItems(campaignMediaItems.filter(m => m.id !== mediaId));
  };

  const addMediaToCampaign = (media: MediaItem) => {
    if (!campaignMediaItems.find(m => m.id === media.id)) {
      setCampaignMediaItems([...campaignMediaItems, media]);
    }
  };

  const getTotalDuration = () => {
    return campaignMediaItems.reduce((total, media) => {
      if (media.type === 'video') return total;
      return total + (media.durationSeconds || 10);
    }, 0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date intersection for active campaigns in the same condominium
    if (formData.startDate && formData.endDate && formData.isActive) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      // Check for date intersection with other active campaigns
      const hasIntersection = campaigns.some(campaign => {
        // Skip if it's the same campaign being edited
        if (editingCampaign && campaign.id === editingCampaign.id) return false;

        // Only check active campaigns with valid dates
        if (!campaign.isActive || !campaign.startDate || !campaign.endDate) return false;

        const campaignStart = new Date(campaign.startDate);
        const campaignEnd = new Date(campaign.endDate);

        // Check if dates intersect
        return (start <= campaignEnd && end >= campaignStart);
      });

      if (hasIntersection) {
        alert('Atenção: Esta campanha tem interseção de datas com outra campanha ativa neste condomínio. Isso pode causar conflitos na exibição.');
        if (!confirm('Deseja continuar mesmo assim?')) {
          return;
        }
      }
    }

    try {
      if (editingCampaign) {
        // Update campaign
        const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          // Update media items: associate them with the campaign and set order
          for (let i = 0; i < campaignMediaItems.length; i++) {
            const media = campaignMediaItems[i];
            await fetch(`/api/media-items/${media.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...media,
                campaignId: editingCampaign.id,
                order: i,
              }),
            });
          }

          // Remove campaign association from media that were removed
          const originalMedia: MediaItem[] = await fetch(`/api/media-items?campaignId=${editingCampaign.id}`).then(r => r.json());
          const currentMediaIds = new Set(campaignMediaItems.map(m => m.id));

          for (const media of originalMedia) {
            if (!currentMediaIds.has(media.id)) {
              // Fetch the current media item to get its latest data
              const mediaRes = await fetch(`/api/media-items/${media.id}`);
              const currentMedia = await mediaRes.json();

              await fetch(`/api/media-items/${media.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...currentMedia,
                  campaignId: undefined,
                  order: 0,
                }),
              });
            }
          }

          await fetchCampaigns();
          resetForm();
        }
      } else {
        // Create campaign
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            condominiumId: selectedCondominium,
          }),
        });

        if (response.ok) {
          const newCampaign = await response.json();

          // Associate media items with the new campaign
          for (let i = 0; i < campaignMediaItems.length; i++) {
            const media = campaignMediaItems[i];
            await fetch(`/api/media-items/${media.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...media,
                campaignId: newCampaign.id,
                order: i,
              }),
            });
          }

          // Send WhatsApp notification for new campaign
          const selectedCondo = condominiums.find(c => c.id === selectedCondominium);
          if (selectedCondo?.whatsappPhone) {
            const details = formData.startDate && formData.endDate
              ? `Período: ${formData.startDate} a ${formData.endDate}`
              : '';
            sendWhatsAppNotification(
              'campaign_created',
              selectedCondo.name,
              selectedCondo.whatsappPhone,
              formData.name,
              details
            );
          }

          await fetchCampaigns();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCampaigns();
        await fetchAllCampaigns();
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      monitorId: campaign.monitorId || '',
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      isActive: campaign.isActive,
      showNews: campaign.showNews !== false, // Default to true if undefined
      newsEveryNMedia: campaign.newsEveryNMedia || 3,
      newsDurationSeconds: campaign.newsDurationSeconds || 10,
    });
    setShowForm(true);
  };

  const toggleActive = async (campaign: Campaign) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !campaign.isActive }),
      });

      if (response.ok) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
    }
  };

  const resetForm = () => {
    const defaultDates = getDefaultDates();
    setFormData({
      name: '',
      monitorId: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      isActive: true,
      showNews: true,
      newsEveryNMedia: 3,
      newsDurationSeconds: 10,
    });
    setEditingCampaign(null);
    setShowForm(false);
  };

  const handleCopyCampaigns = async () => {
    if (!copySourceCondominium || copySourceCondominium === selectedCondominium) {
      alert('Selecione um condomínio diferente para copiar');
      return;
    }

    const sourceCampaigns = allCampaigns.filter(c => c.condominiumId === copySourceCondominium);

    if (sourceCampaigns.length === 0) {
      alert('O condomínio selecionado não possui campanhas');
      return;
    }

    if (!confirm(`Deseja copiar ${sourceCampaigns.length} campanha(s) do condomínio selecionado?`)) {
      return;
    }

    try {
      let successCount = 0;
      for (const campaign of sourceCampaigns) {
        const newCampaign = {
          name: campaign.name,
          startDate: campaign.startDate || '',
          endDate: campaign.endDate || '',
          isActive: campaign.isActive,
          newsEveryNMedia: campaign.newsEveryNMedia,
          newsDurationSeconds: campaign.newsDurationSeconds,
          condominiumId: selectedCondominium,
        };

        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCampaign),
        });

        if (response.ok) {
          successCount++;
        }
      }

      if (successCount > 0) {
        alert(`${successCount} campanha(s) copiada(s) com sucesso!`);
        await fetchCampaigns();
        await fetchAllCampaigns();
        setShowCopyModal(false);
        setCopySourceCondominium('');
      }
    } catch (error) {
      console.error('Failed to copy campaigns:', error);
      alert('Erro ao copiar campanhas');
    }
  };

  const filteredCampaigns = campaigns.filter(c => c.condominiumId === selectedCondominium);

  // Check if there are campaigns in other condominiums
  const hasOtherCampaigns = allCampaigns.some(c => c.condominiumId !== selectedCondominium);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">Campanhas</h2>
          <p className="text-gray-600 mt-1">Gerencie playlists personalizadas por condomínio</p>
        </div>
        {selectedCondominium && !showForm && (
          <div className="flex gap-3">
            {hasOtherCampaigns && (
              <button
                onClick={() => setShowCopyModal(true)}
                className="flex items-center gap-2 bg-white border-2 border-[#D97706] text-[#D97706] px-6 py-3 rounded-xl hover:bg-[#FFFBEB] transition-all font-semibold"
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
                Copiar de Outro Condomínio
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md"
            >
              <PlusIcon className="w-5 h-5" />
              Nova Campanha
            </button>
          </div>
        )}
      </div>

      {condominiums.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Crie um condomínio primeiro</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Condomínio Selecionado
            </label>
            <select
              value={selectedCondominium}
              onChange={(e) => setSelectedCondominium(e.target.value)}
              disabled={showForm}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-medium bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {condominiums.map((condo) => (
                <option key={condo.id} value={condo.id}>
                  {condo.name}
                </option>
              ))}
            </select>
            {showForm && (
              <p className="mt-2 text-xs text-gray-500">
                Não é possível trocar o condomínio durante a edição de uma campanha
              </p>
            )}
          </div>

          {showCopyModal && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
                Copiar Campanhas de Outro Condomínio
              </h3>
              <p className="text-gray-600 mb-4">
                Selecione o condomínio de origem para copiar todas as campanhas para o condomínio atual.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Copiar campanhas de:
                  </label>
                  <select
                    value={copySourceCondominium}
                    onChange={(e) => setCopySourceCondominium(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none font-medium bg-white text-gray-900"
                  >
                    <option value="">Selecione um condomínio</option>
                    {condominiums
                      .filter(c => c.id !== selectedCondominium)
                      .map((condo) => {
                        const count = allCampaigns.filter(camp => camp.condominiumId === condo.id).length;
                        return (
                          <option key={condo.id} value={condo.id}>
                            {condo.name} ({count} campanha{count !== 1 ? 's' : ''})
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCopyCampaigns}
                    disabled={!copySourceCondominium}
                    className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Copiar Campanhas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCopyModal(false);
                      setCopySourceCondominium('');
                    }}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
                {editingCampaign ? 'Editar Campanha' : 'Nova Campanha'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nome da Campanha *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                      placeholder="Ex: Campanha Natal 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Monitor *
                    </label>
                    <select
                      value={formData.monitorId}
                      onChange={(e) => setFormData({ ...formData, monitorId: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    >
                      <option value="">Selecione um monitor</option>
                      {monitors.map((monitor) => (
                        <option key={monitor.id} value={monitor.id}>
                          {monitor.name} {monitor.location ? `(${monitor.location})` : ''}
                        </option>
                      ))}
                    </select>
                    {monitors.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Nenhum monitor cadastrado. Cadastre um na aba Monitores.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Data Início
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Data Fim
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Intercalar notícia a cada N mídias
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.newsEveryNMedia}
                      onChange={(e) => setFormData({ ...formData, newsEveryNMedia: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duração da notícia (segundos, mín. 5s)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={formData.newsDurationSeconds}
                      onChange={(e) => setFormData({ ...formData, newsDurationSeconds: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                      Campanha ativa
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="showNews"
                      checked={formData.showNews}
                      onChange={(e) => setFormData({ ...formData, showNews: e.target.checked })}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="showNews" className="text-sm font-semibold text-gray-700">
                      Exibir notícias nesta campanha
                    </label>
                  </div>
                </div>

                {/* Gerenciador de Mídias */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">Mídias da Campanha</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        Tempo total: <strong>{formatDuration(getTotalDuration())}</strong>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        <strong>{campaignMediaItems.length}</strong> mídia{campaignMediaItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Lista de mídias da campanha */}
                  {campaignMediaItems.length > 0 ? (
                    <div className="space-y-2 mb-3 max-h-64 overflow-y-auto">
                      {campaignMediaItems.map((media, index) => (
                        <div key={media.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-sm font-bold text-gray-500 w-6">{index + 1}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{media.title}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="capitalize">{media.type}</span>
                              <span>•</span>
                              <span>{media.type === 'video' ? 'Duração automática' : formatDuration(media.durationSeconds || 10)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveMediaUp(index)}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowUpIcon className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveMediaDown(index)}
                              disabled={index === campaignMediaItems.length - 1}
                              className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMediaFromCampaign(media.id)}
                              className="p-1 rounded hover:bg-red-100 text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic mb-3">Nenhuma mídia adicionada ainda</p>
                  )}

                  {/* Mídias disponíveis */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adicionar Mídias
                    </label>
                    <select
                      onChange={(e) => {
                        const media = availableMediaItems.find(m => m.id === e.target.value);
                        if (media) {
                          addMediaToCampaign(media);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    >
                      <option value="">Selecione uma mídia para adicionar</option>
                      {availableMediaItems
                        .filter(m => !campaignMediaItems.find(cm => cm.id === m.id))
                        .map(media => (
                          <option key={media.id} value={media.id}>
                            {media.title} ({media.type})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    {editingCampaign ? 'Atualizar' : 'Criar'} Campanha
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-display font-bold text-gray-900">{campaign.name}</h3>
                    {(campaign.startDate || campaign.endDate) && (
                      <p className="text-sm text-gray-500 mt-1">
                        {campaign.startDate && new Date(campaign.startDate).toLocaleDateString('pt-BR')}
                        {campaign.startDate && campaign.endDate && ' - '}
                        {campaign.endDate && new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${campaign.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Monitor:</span>
                    {campaign.monitorId ? (
                      <span className="font-semibold text-[#D97706]">
                        {monitors.find(m => m.id === campaign.monitorId)?.name || 'N/A'}
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-600">Não associado</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Notícias a cada:</span>
                    <span className="font-semibold text-gray-900">{campaign.newsEveryNMedia || 'N/A'} mídias</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Duração notícia:</span>
                    <span className="font-semibold text-gray-900">{campaign.newsDurationSeconds || 'N/A'}s</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(campaign)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      campaign.isActive
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {campaign.isActive ? (
                      <>
                        <XCircleIcon className="w-4 h-4" />
                        Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        Ativar
                      </>
                    )}
                  </button>

                  <a
                    href={`/preview/${campaign.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all inline-flex items-center justify-center"
                    title="Visualizar preview"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleEdit(campaign)}
                    className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(campaign.id)}
                    className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && !showForm && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma campanha criada ainda</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Criar primeira campanha
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
