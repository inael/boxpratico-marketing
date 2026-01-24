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
  PhotoIcon,
  FilmIcon,
  DocumentIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Campaign, Condominium, MediaItem, Monitor, Advertiser, calculateDistanceKm, MEDIA_TYPE_ICONS } from '@/types';
import MediaEditModal from './MediaEditModal';
import SpecialMediaModal from './SpecialMediaModal';
import PlayerPreviewModal from './PlayerPreviewModal';

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
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('');
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copySourceCondominium, setCopySourceCondominium] = useState<string>('');
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [availableMediaItems, setAvailableMediaItems] = useState<MediaItem[]>([]);
  const [campaignMediaItems, setCampaignMediaItems] = useState<MediaItem[]>([]);
  const [campaignMediaMap, setCampaignMediaMap] = useState<Record<string, MediaItem[]>>({});
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [showMediaEditModal, setShowMediaEditModal] = useState(false);
  const [showSpecialMediaModal, setShowSpecialMediaModal] = useState(false);
  // Preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedCampaignForPreview, setSelectedCampaignForPreview] = useState<Campaign | null>(null);

  const handleOpenPreview = (campaign: Campaign) => {
    setSelectedCampaignForPreview(campaign);
    setShowPreviewModal(true);
  };

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
    advertiserId: '',
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
    fetchAdvertisers();
    fetchAllMonitors();
  }, []);

  useEffect(() => {
    if (selectedAdvertiser) {
      fetchCampaignsByAdvertiser();
      fetchMediaItemsByAdvertiser();
    }
  }, [selectedAdvertiser]);

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

  const fetchAdvertisers = async () => {
    try {
      const response = await fetch('/api/advertisers');
      const data = await response.json();
      setAdvertisers(data);
      // Auto-select first advertiser
      if (data.length > 0 && !selectedAdvertiser) {
        setSelectedAdvertiser(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch advertisers:', error);
    }
  };

  const fetchAllMonitors = async () => {
    try {
      const response = await fetch('/api/monitors');
      const data = await response.json();
      setMonitors(data.filter((m: Monitor) => m.isActive));
    } catch (error) {
      console.error('Failed to fetch all monitors:', error);
    }
  };

  const fetchCampaignsByAdvertiser = async () => {
    try {
      const response = await fetch(`/api/campaigns?advertiserId=${selectedAdvertiser}`);
      const data = await response.json();
      setCampaigns(data);
      fetchCampaignMediaForList(data);
    } catch (error) {
      console.error('Failed to fetch campaigns by advertiser:', error);
    }
  };

  const fetchMediaItemsByAdvertiser = async () => {
    try {
      const response = await fetch(`/api/media-items?advertiserId=${selectedAdvertiser}`);
      const data = await response.json();
      setAvailableMediaItems(data.filter((m: MediaItem) => m.isActive));
    } catch (error) {
      console.error('Failed to fetch media items by advertiser:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setCampaigns(data);
      // Fetch media for each campaign to display counts
      fetchCampaignMediaForList(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const fetchCampaignMediaForList = async (campaignsList: Campaign[]) => {
    const mediaMap: Record<string, MediaItem[]> = {};
    for (const campaign of campaignsList) {
      try {
        const response = await fetch(`/api/media-items?campaignId=${campaign.id}`);
        const data = await response.json();
        mediaMap[campaign.id] = data.filter((m: MediaItem) => m.isActive);
      } catch (error) {
        console.error(`Failed to fetch media for campaign ${campaign.id}:`, error);
        mediaMap[campaign.id] = [];
      }
    }
    setCampaignMediaMap(mediaMap);
  };

  // Get media count by type for a specific campaign
  const getMediaCountByType = (campaignId: string) => {
    const media = campaignMediaMap[campaignId] || [];
    return {
      image: media.filter(m => m.type === 'image').length,
      video: media.filter(m => m.type === 'video').length,
      youtube: media.filter(m => m.type === 'youtube').length,
      pdf: media.filter(m => m.type === 'pdf').length,
      rtmp: media.filter(m => m.type === 'rtmp').length,
      clock: media.filter(m => m.type === 'clock').length,
      currency: media.filter(m => m.type === 'currency').length,
      weather: media.filter(m => m.type === 'weather').length,
      total: media.length
    };
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

  const handleEditMedia = (media: MediaItem) => {
    setEditingMedia(media);
    setShowMediaEditModal(true);
  };

  const handleSaveMedia = async (updatedMedia: MediaItem) => {
    try {
      const response = await fetch(`/api/media-items/${updatedMedia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMedia),
      });

      if (response.ok) {
        // Atualizar na lista local
        setCampaignMediaItems(campaignMediaItems.map(m =>
          m.id === updatedMedia.id ? updatedMedia : m
        ));
        setAvailableMediaItems(availableMediaItems.map(m =>
          m.id === updatedMedia.id ? updatedMedia : m
        ));
      }
    } catch (error) {
      console.error('Failed to update media:', error);
    }
  };

  const handleSaveSpecialMedia = async (mediaData: Partial<MediaItem>) => {
    try {
      const response = await fetch('/api/media-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mediaData,
          advertiserId: selectedAdvertiser,
          order: campaignMediaItems.length,
        }),
      });

      if (response.ok) {
        const newMedia = await response.json();
        // Adicionar a midia criada a playlist atual
        setCampaignMediaItems([...campaignMediaItems, newMedia]);
        // Atualizar lista de midias disponiveis
        setAvailableMediaItems([...availableMediaItems, newMedia]);
      }
    } catch (error) {
      console.error('Failed to create special media:', error);
    }
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
        alert('Atenção: Esta playlist tem interseção de datas com outra playlist ativa neste local. Isso pode causar conflitos na exibição.');
        if (!confirm('Deseja continuar mesmo assim?')) {
          return;
        }
      }
    }

    try {
      const campaignData = {
        ...formData,
        advertiserId: formData.advertiserId || selectedAdvertiser,
        targetLocations,
      };

      if (editingCampaign) {
        // Update campaign
        const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignData),
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

          await fetchCampaignsByAdvertiser();
          resetForm();
        }
      } else {
        // Create campaign
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignData),
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

          // Send WhatsApp notification for each target location
          for (const locationId of targetLocations) {
            const selectedCondo = condominiums.find(c => c.id === locationId);
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
          }

          await fetchCampaignsByAdvertiser();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Failed to save campaign:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta playlist?')) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCampaignsByAdvertiser();
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
      advertiserId: campaign.advertiserId || selectedAdvertiser,
      monitorId: campaign.monitorId || '',
      startDate: campaign.startDate || '',
      endDate: campaign.endDate || '',
      isActive: campaign.isActive,
      showNews: campaign.showNews !== false, // Default to true if undefined
      newsEveryNMedia: campaign.newsEveryNMedia || 3,
      newsDurationSeconds: campaign.newsDurationSeconds || 10,
    });
    setTargetLocations(campaign.targetLocations || (campaign.condominiumId ? [campaign.condominiumId] : []));
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
        await fetchCampaignsByAdvertiser();
      }
    } catch (error) {
      console.error('Failed to toggle campaign:', error);
    }
  };

  // Toggle a location in the targetLocations array
  const toggleTargetLocation = (locationId: string) => {
    setTargetLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  // Get the current advertiser's target radius config
  const getCurrentAdvertiserRadius = () => {
    const advertiser = advertisers.find(a => a.id === selectedAdvertiser);
    return advertiser?.targetRadius;
  };

  // Select all locations within the advertiser's radius
  const selectLocationsWithinRadius = () => {
    const radiusConfig = getCurrentAdvertiserRadius();
    if (!radiusConfig) return;

    const locationsWithinRadius = condominiums.filter(condo => {
      if (!condo.latitude || !condo.longitude) return false;
      const distance = calculateDistanceKm(
        radiusConfig.centerLat,
        radiusConfig.centerLng,
        condo.latitude,
        condo.longitude
      );
      return distance <= radiusConfig.radiusKm;
    });

    setTargetLocations(locationsWithinRadius.map(l => l.id));
  };

  // Get distance from advertiser center for a location
  const getDistanceFromAdvertiser = (condo: Condominium): number | null => {
    const radiusConfig = getCurrentAdvertiserRadius();
    if (!radiusConfig || !condo.latitude || !condo.longitude) return null;
    return calculateDistanceKm(
      radiusConfig.centerLat,
      radiusConfig.centerLng,
      condo.latitude,
      condo.longitude
    );
  };

  // Check if location is within advertiser's radius
  const isWithinRadius = (condo: Condominium): boolean => {
    const radiusConfig = getCurrentAdvertiserRadius();
    if (!radiusConfig || !condo.latitude || !condo.longitude) return false;
    const distance = calculateDistanceKm(
      radiusConfig.centerLat,
      radiusConfig.centerLng,
      condo.latitude,
      condo.longitude
    );
    return distance <= radiusConfig.radiusKm;
  };

  const resetForm = () => {
    const defaultDates = getDefaultDates();
    setFormData({
      name: '',
      advertiserId: selectedAdvertiser,
      monitorId: '',
      startDate: defaultDates.startDate,
      endDate: defaultDates.endDate,
      isActive: true,
      showNews: true,
      newsEveryNMedia: 3,
      newsDurationSeconds: 10,
    });
    setTargetLocations([]);
    setEditingCampaign(null);
    setShowForm(false);
  };

  const handleCopyCampaigns = async () => {
    if (!copySourceCondominium || copySourceCondominium === selectedCondominium) {
      alert('Selecione um local diferente para copiar');
      return;
    }

    const sourceCampaigns = allCampaigns.filter(c => c.condominiumId === copySourceCondominium);

    if (sourceCampaigns.length === 0) {
      alert('O local selecionado não possui playlists');
      return;
    }

    if (!confirm(`Deseja copiar ${sourceCampaigns.length} playlist(s) do local selecionado?`)) {
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
        alert(`${successCount} playlist(s) copiada(s) com sucesso!`);
        await fetchCampaigns();
        await fetchAllCampaigns();
        setShowCopyModal(false);
        setCopySourceCondominium('');
      }
    } catch (error) {
      console.error('Failed to copy campaigns:', error);
      alert('Erro ao copiar playlists');
    }
  };

  const filteredCampaigns = campaigns.filter(c => c.condominiumId === selectedCondominium);

  // Check if there are campaigns in other condominiums
  const hasOtherCampaigns = allCampaigns.some(c => c.condominiumId !== selectedCondominium);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Playlists</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie playlists por anunciante e distribua para os locais</p>
        </div>
        {selectedAdvertiser && !showForm && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md text-sm sm:text-base"
            >
              <PlusIcon className="w-5 h-5" />
              Nova Playlist
            </button>
          </div>
        )}
      </div>

      {advertisers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <MegaphoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Cadastre um anunciante primeiro na aba Anunciantes</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Anunciante
            </label>
            <select
              value={selectedAdvertiser}
              onChange={(e) => setSelectedAdvertiser(e.target.value)}
              disabled={showForm}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-medium bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {advertisers.map((advertiser) => (
                <option key={advertiser.id} value={advertiser.id}>
                  {advertiser.name} {advertiser.segment ? `(${advertiser.segment})` : ''}
                </option>
              ))}
            </select>
            {showForm && (
              <p className="mt-2 text-xs text-gray-500">
                Não é possível trocar o anunciante durante a edição de uma playlist
              </p>
            )}
          </div>

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
                {editingCampaign ? 'Editar Playlist' : 'Nova Playlist'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome da Playlist *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    placeholder="Ex: Playlist Natal 2024"
                  />
                </div>

                {/* Seleção de Locais/Telas onde a playlist será exibida */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Locais onde exibir *
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Selecione os locais/telas onde esta playlist será exibida
                  </p>

                  {/* Botão de seleção automática por raio */}
                  {getCurrentAdvertiserRadius() && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Raio de alcance: {getCurrentAdvertiserRadius()?.radiusKm} km
                            </p>
                            {getCurrentAdvertiserRadius()?.centerName && (
                              <p className="text-xs text-blue-600">
                                Centro: {getCurrentAdvertiserRadius()?.centerName}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={selectLocationsWithinRadius}
                          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Selecionar no raio
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {condominiums.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhum local cadastrado
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {condominiums.map((condo) => {
                          const condoMonitors = monitors.filter(m => m.condominiumId === condo.id);
                          const distance = getDistanceFromAdvertiser(condo);
                          const withinRadius = isWithinRadius(condo);
                          const radiusConfig = getCurrentAdvertiserRadius();

                          return (
                            <label
                              key={condo.id}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                targetLocations.includes(condo.id)
                                  ? 'bg-indigo-50 border border-indigo-500'
                                  : withinRadius && radiusConfig
                                  ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={targetLocations.includes(condo.id)}
                                onChange={() => toggleTargetLocation(condo.id)}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">{condo.name}</span>
                                  {withinRadius && radiusConfig && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">
                                      No raio
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                  <span>
                                    {condoMonitors.length} tela{condoMonitors.length !== 1 ? 's' : ''}
                                  </span>
                                  {distance !== null && (
                                    <>
                                      <span>-</span>
                                      <span className={withinRadius ? 'text-blue-600 font-medium' : ''}>
                                        {distance.toFixed(1)} km
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {targetLocations.length === 0 && (
                    <p className="text-xs text-amber-600 mt-2">
                      Selecione pelo menos um local para exibir a playlist
                    </p>
                  )}
                  {targetLocations.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      {targetLocations.length} local(is) selecionado(s)
                    </p>
                  )}
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
                      Playlist ativa
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
                      Exibir notícias nesta playlist
                    </label>
                  </div>
                </div>

                {/* Gerenciador de Mídias */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">Mídias da Playlist</h4>
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

                  {/* Lista de mídias da playlist */}
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
                              onClick={() => handleEditMedia(media)}
                              className="p-1 rounded hover:bg-blue-100 text-blue-600"
                              title="Editar midia (agendamento, duracao...)"
                            >
                              <Cog6ToothIcon className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMediaFromCampaign(media.id)}
                              className="p-1 rounded hover:bg-red-100 text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Indicador de agendamento */}
                          {media.schedule?.enabled && (
                            <div className="ml-8 mt-1 flex items-center gap-1 text-xs text-amber-600">
                              <CalendarDaysIcon className="w-3 h-3" />
                              <span>Agendada</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic mb-3">Nenhuma midia adicionada ainda</p>
                  )}

                  {/* Mídias disponíveis */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adicionar Mídias
                    </label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => {
                          const media = availableMediaItems.find(m => m.id === e.target.value);
                          if (media) {
                            addMediaToCampaign(media);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                      >
                        <option value="">Selecione uma mídia para adicionar</option>
                        {availableMediaItems
                          .filter(m => !campaignMediaItems.find(cm => cm.id === m.id))
                          .map(media => (
                            <option key={media.id} value={media.id}>
                              {MEDIA_TYPE_ICONS[media.type] || ''} {media.title} ({media.type})
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowSpecialMediaModal(true)}
                        className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                        title="Adicionar midia especial (Hora Certa, Cotacao, Previsao do Tempo)"
                      >
                        <span>✨</span>
                        <span className="hidden sm:inline">Midia Especial</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    {editingCampaign ? 'Atualizar' : 'Criar'} Playlist
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

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-display font-bold text-gray-900 truncate">{campaign.name}</h3>
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
                      <span className="font-semibold text-indigo-700">
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

                {/* Media count by type */}
                {(() => {
                  const counts = getMediaCountByType(campaign.id);
                  if (counts.total === 0) {
                    return (
                      <div className="mb-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="font-medium">Sem mídias cadastradas</span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="mb-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        {counts.image > 0 && (
                          <div className="flex items-center gap-1 text-blue-600" title="Imagens">
                            <PhotoIcon className="w-4 h-4" />
                            <span className="font-medium">{counts.image}</span>
                          </div>
                        )}
                        {counts.video > 0 && (
                          <div className="flex items-center gap-1 text-purple-600" title="Vídeos">
                            <FilmIcon className="w-4 h-4" />
                            <span className="font-medium">{counts.video}</span>
                          </div>
                        )}
                        {counts.youtube > 0 && (
                          <div className="flex items-center gap-1 text-red-600" title="YouTube">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            <span className="font-medium">{counts.youtube}</span>
                          </div>
                        )}
                        {counts.pdf > 0 && (
                          <div className="flex items-center gap-1 text-orange-600" title="PDFs">
                            <DocumentIcon className="w-4 h-4" />
                            <span className="font-medium">{counts.pdf}</span>
                          </div>
                        )}
                        {counts.rtmp > 0 && (
                          <div className="flex items-center gap-1 text-green-600" title="Câmeras RTMP">
                            <VideoCameraIcon className="w-4 h-4" />
                            <span className="font-medium">{counts.rtmp}</span>
                          </div>
                        )}
                        {counts.clock > 0 && (
                          <div className="flex items-center gap-1 text-blue-600" title="Hora Certa">
                            <ClockIcon className="w-4 h-4" />
                            <span className="font-medium">{counts.clock}</span>
                          </div>
                        )}
                        {counts.currency > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600" title="Cotação">
                            <span className="text-sm">💹</span>
                            <span className="font-medium">{counts.currency}</span>
                          </div>
                        )}
                        {counts.weather > 0 && (
                          <div className="flex items-center gap-1 text-amber-600" title="Previsão do Tempo">
                            <span className="text-sm">🌤️</span>
                            <span className="font-medium">{counts.weather}</span>
                          </div>
                        )}
                        <div className="ml-auto text-gray-500">
                          = <span className="font-semibold">{counts.total}</span> {counts.total === 1 ? 'mídia' : 'mídias'}
                        </div>
                      </div>
                    </div>
                  );
                })()}

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

                  <button
                    onClick={() => handleOpenPreview(campaign)}
                    className="px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all inline-flex items-center justify-center"
                    title="Visualizar preview"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>

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
              <p className="text-gray-500">Nenhuma playlist criada ainda</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Criar primeira playlist
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de edição de mídia */}
      <MediaEditModal
        media={editingMedia}
        isOpen={showMediaEditModal}
        onClose={() => {
          setShowMediaEditModal(false);
          setEditingMedia(null);
        }}
        onSave={handleSaveMedia}
      />

      {/* Modal de mídia especial */}
      <SpecialMediaModal
        isOpen={showSpecialMediaModal}
        onClose={() => setShowSpecialMediaModal(false)}
        onSave={handleSaveSpecialMedia}
        advertiserId={selectedAdvertiser}
      />

      {/* Modal de preview do player */}
      <PlayerPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedCampaignForPreview(null);
        }}
        monitor={null}
        campaign={selectedCampaignForPreview}
      />
    </div>
  );
}
