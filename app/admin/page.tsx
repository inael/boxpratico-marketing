'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Condominium, MediaItem, Campaign, AnalyticsView, Monitor } from '@/types';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminFooter from '@/components/admin/AdminFooter';
import CampaignsTab from '@/components/admin/CampaignsTab';
import SettingsTab from '@/components/admin/SettingsTab';
import MonitorsTab from '@/components/admin/MonitorsTab';
import OnboardingWizard from '@/components/admin/OnboardingWizard';
import { brazilianStates, citiesByState } from '@/lib/brazilian-cities';
import {
  BuildingOfficeIcon,
  PhotoIcon,
  TvIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ChevronDownIcon,
  SignalIcon,
  MegaphoneIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showCondoForm, setShowCondoForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [condoName, setCondoName] = useState<string>('');
  const [condoSlug, setCondoSlug] = useState<string>('');
  const [mediaType, setMediaType] = useState<string>('');
  const [showFullVideo, setShowFullVideo] = useState<boolean>(true);
  const [startTimeSeconds, setStartTimeSeconds] = useState<number>(0);
  const [endTimeSeconds, setEndTimeSeconds] = useState<number>(0);
  const [selectedCampaignForPreview, setSelectedCampaignForPreview] = useState<string>('');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsView[]>([]);
  const [hasUploadedFile, setHasUploadedFile] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [monitorDropdownOpen, setMonitorDropdownOpen] = useState<string | null>(null);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadCondominiums();
      loadMonitors();
      loadAllCampaigns();
    }
  }, [status]);

  useEffect(() => {
    if (selectedCondominium) {
      loadMediaItems();
      loadCampaigns();
    }
  }, [selectedCondominium]);

  // Show onboarding wizard on first visit (when no condominiums exist)
  useEffect(() => {
    if (status === 'authenticated' && condominiums.length === 0 && !localStorage.getItem('onboarding_dismissed')) {
      setShowOnboarding(true);
    }
  }, [status, condominiums]);

  useEffect(() => {
    if (selectedState) {
      setAvailableCities(citiesByState[selectedState] || []);
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);

  // Close monitor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setMonitorDropdownOpen(null);
    if (monitorDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [monitorDropdownOpen]);

  useEffect(() => {
    if (editingCondo) {
      setCondoName(editingCondo.name);
      setCondoSlug(editingCondo.slug);
      setSelectedState(editingCondo.state || '');
    } else {
      setCondoName('');
      setCondoSlug('');
      setSelectedState('');
    }
  }, [editingCondo]);

  useEffect(() => {
    setCondoSlug(sanitizeSlug(condoName));
  }, [condoName]);

  useEffect(() => {
    if (editingMedia) {
      setMediaType(editingMedia.type);
      setShowFullVideo(editingMedia.playFullVideo ?? true);
      setStartTimeSeconds(editingMedia.startTimeSeconds ?? 0);
      setEndTimeSeconds(editingMedia.endTimeSeconds ?? 0);
    } else {
      setMediaType('');
      setShowFullVideo(true);
      setStartTimeSeconds(0);
      setEndTimeSeconds(0);
    }
  }, [editingMedia]);

  async function handleLogoutClick() {
    await signOut({ callbackUrl: '/login' });
  }

  async function loadCondominiums() {
    const res = await fetch('/api/condominiums');
    const data = await res.json();
    setCondominiums(data);
    if (data.length > 0 && !selectedCondominium) {
      setSelectedCondominium(data[0].id);
    }
  }

  async function loadMediaItems() {
    const res = await fetch(`/api/media-items?condominiumId=${selectedCondominium}`);
    const data = await res.json();
    setMediaItems(data);
  }

  async function loadCampaigns() {
    const res = await fetch(`/api/campaigns?condominiumId=${selectedCondominium}`);
    const data = await res.json();
    setCampaigns(data);
  }

  async function loadMonitors() {
    const res = await fetch('/api/monitors/heartbeat');
    if (res.ok) {
      const data = await res.json();
      setMonitors(data);
    }
  }

  async function loadAllCampaigns() {
    const res = await fetch('/api/campaigns');
    if (res.ok) {
      const data = await res.json();
      setAllCampaigns(data);
    }
  }

  function sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens do início e fim
  }

  function getUniqueSlug(baseSlug: string, excludeId?: string): string {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const exists = condominiums.some(
        condo => condo.slug === slug && condo.id !== excludeId
      );

      if (!exists) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async function handleCreateCondominium(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let photoUrl = '';
    const photoFile = formData.get('photo') as File;

    // Upload photo if provided
    if (photoFile && photoFile.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', photoFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadRes.json();
      photoUrl = uploadData.url;
    }

    const data = {
      name: formData.get('name') as string,
      slug: getUniqueSlug(condoSlug),
      cnpj: formData.get('cnpj') as string,
      address: formData.get('address') as string,
      state: formData.get('state') as string,
      city: formData.get('city') as string,
      whatsappPhone: formData.get('whatsappPhone') as string,
      photoUrl: photoUrl || undefined,
      isActive: true,
    };

    const res = await fetch('/api/condominiums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      // Send WhatsApp notification for new condominium
      if (data.whatsappPhone) {
        sendWhatsAppNotification(
          'condominium_created',
          data.name,
          data.whatsappPhone
        );
      }

      setShowCondoForm(false);
      setSelectedState('');
      setCondoName('');
      setCondoSlug('');
      loadCondominiums();
    }
  }

  async function handleUpdateCondominium(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCondo) return;

    const formData = new FormData(e.currentTarget);

    let photoUrl = editingCondo.photoUrl;
    const photoFile = formData.get('photo') as File;

    // Upload new photo if provided
    if (photoFile && photoFile.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', photoFile);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadRes.json();
      photoUrl = uploadData.url;
    }

    const data = {
      name: formData.get('name') as string,
      slug: getUniqueSlug(condoSlug, editingCondo.id),
      cnpj: formData.get('cnpj') as string,
      address: formData.get('address') as string,
      state: formData.get('state') as string,
      city: formData.get('city') as string,
      whatsappPhone: formData.get('whatsappPhone') as string,
      photoUrl: photoUrl || undefined,
    };

    const res = await fetch(`/api/condominiums/${editingCondo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setEditingCondo(null);
      setSelectedState('');
      setCondoName('');
      setCondoSlug('');
      loadCondominiums();
    }
  }

  async function handleDeleteCondominium(id: string) {
    const res = await fetch(`/api/condominiums/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadCondominiums();
      if (selectedCondominium === id) {
        setSelectedCondominium('');
      }
    }
  }

  async function toggleCondominiumActive(condo: Condominium) {
    await fetch(`/api/condominiums/${condo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !condo.isActive }),
    });
    loadCondominiums();
  }

  async function handleCreateMedia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const sourceUrl = formData.get('sourceUrl') as string;
    const type = formData.get('type') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const durationSeconds = parseInt(formData.get('durationSeconds') as string) || 10;
    const campaignId = formData.get('campaignId') as string;
    const files = formData.getAll('file') as File[];

    // For RTMP, generate the HLS URL
    if (type === 'rtmp') {
      const rtmpKey = formData.get('rtmpKey') as string;
      if (!rtmpKey || !rtmpKey.trim()) {
        alert('Por favor, forneça o nome da câmera');
        return;
      }

      const streamKey = rtmpKey.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Check if camera with same stream key already exists
      const hlsUrlToCheck = `http://72.61.135.214:8080/hls/${streamKey}.m3u8`;
      const existingCamera = mediaItems.find(
        m => m.type === 'rtmp' && m.sourceUrl === hlsUrlToCheck
      );
      if (existingCamera) {
        alert(`❌ Já existe uma câmera cadastrada com o nome "${streamKey}".\n\nEscolha um nome diferente para sua câmera.`);
        return;
      }

      // Generate HLS URL for playback: http://72.61.135.214:8080/hls/stream-key.m3u8
      const hlsUrl = hlsUrlToCheck;

      // RTMP URL for camera configuration
      const rtmpUrl = `rtmp://72.61.135.214:1935/live/${streamKey}`;

      // Handle thumbnail upload
      let thumbnailUrl = '/camera-warning.svg'; // Default image
      const thumbnailFile = formData.get('thumbnailFile') as File;
      if (thumbnailFile && thumbnailFile.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', thumbnailFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          thumbnailUrl = uploadResult.url;
        }
      }

      const data = {
        title: title || 'Sorria, você está sendo filmado',
        description: description || 'Ambiente monitorado. Lembre-se: furtar é crime segundo o artigo 155 do Código Penal, com pena de reclusão de um a quatro anos e multa.',
        type,
        sourceUrl: hlsUrl, // Store HLS URL for playback
        thumbnailUrl,
        durationSeconds: durationSeconds || 30,
        isActive: true,
        order: mediaItems.length,
        condominiumId: selectedCondominium,
        campaignId: campaignId || undefined,
      };

      const res = await fetch('/api/media-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        alert(`✅ Câmera cadastrada com sucesso!\n\n📹 Configure sua câmera IMIX com:\n${rtmpUrl}\n\n🎬 URL HLS (já configurada no player):\n${hlsUrl}`);
        setShowMediaForm(false);
        setMediaType('');
        setHasUploadedFile(false);
        loadMediaItems();
      }
      return;
    }

    // If sourceUrl is provided (YouTube or external), create single media item
    if (sourceUrl && sourceUrl.trim()) {
      const data = {
        title,
        description,
        type,
        sourceUrl,
        durationSeconds,
        isActive: true,
        order: mediaItems.length,
        playFullVideo: showFullVideo,
        startTimeSeconds: showFullVideo ? undefined : startTimeSeconds,
        endTimeSeconds: showFullVideo ? undefined : endTimeSeconds,
        condominiumId: selectedCondominium,
        campaignId: campaignId || undefined,
      };

      const res = await fetch('/api/media-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowMediaForm(false);
        setMediaType('');
        setHasUploadedFile(false);
        loadMediaItems();
      }
      return;
    }

    // Process multiple uploaded files
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || file.size === 0) continue;

      try {
        // Upload file
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });
        const uploadData = await uploadRes.json();

        // Create media item
        const data = {
          title: files.length > 1 ? `${title} ${i + 1}` : title,
          description,
          type,
          sourceUrl: uploadData.url,
          durationSeconds,
          isActive: true,
          order: mediaItems.length + i,
          condominiumId: selectedCondominium,
          campaignId: campaignId || undefined,
        };

        const res = await fetch('/api/media-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
      }
    }

    if (successCount > 0) {
      setShowMediaForm(false);
      setMediaType('');
      setHasUploadedFile(false);
      loadMediaItems();
      alert(`${successCount} mídia(s) criada(s) com sucesso!`);
    }
  }

  async function handleDeleteMedia(id: string) {
    const res = await fetch(`/api/media-items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadMediaItems();
    }
  }

  async function toggleMediaActive(item: MediaItem) {
    await fetch(`/api/media-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    loadMediaItems();
  }

  function handleEditMedia(item: MediaItem) {
    setEditingMedia(item);
    setShowMediaForm(true);
  }

  async function handleUpdateMedia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingMedia) return;

    const formData = new FormData(e.currentTarget);
    const campaignId = formData.get('campaignId') as string;
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      durationSeconds: parseInt(formData.get('durationSeconds') as string) || 10,
      playFullVideo: showFullVideo,
      startTimeSeconds: showFullVideo ? undefined : startTimeSeconds,
      endTimeSeconds: showFullVideo ? undefined : endTimeSeconds,
      campaignId: campaignId || undefined,
    };

    const res = await fetch(`/api/media-items/${editingMedia.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setShowMediaForm(false);
      setEditingMedia(null);
      setMediaType('');
      setHasUploadedFile(false);
      loadMediaItems();
    }
  }

  async function toggleNews(condo: Condominium) {
    await fetch(`/api/condominiums/${condo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showNews: !condo.showNews }),
    });
    loadCondominiums();
  }

  function handleRefreshPreview() {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.postMessage('refresh-player', '*');
    }
  }

  function handleOpenPreview() {
    if (selectedCondoData) {
      // Se uma campanha específica está selecionada, use a rota de preview por campanha
      // Senão, use a rota de preview por condomínio
      const url = selectedCampaignForPreview
        ? `/preview/${selectedCampaignForPreview}`
        : `/admin/${encodeURIComponent(selectedCondoData.slug)}/preview`;
      const newWindow = window.open(url, 'preview', 'width=1920,height=1080');
      setPreviewWindow(newWindow);
    }
  }

  const selectedCondoData = condominiums.find(c => c.id === selectedCondominium);
  const activeCondos = condominiums.filter(c => c.isActive !== false);
  const inactiveCondos = condominiums.filter(c => c.isActive === false);
  const activeMedia = mediaItems.filter(m => m.isActive);
  const inactiveMedia = mediaItems.filter(m => !m.isActive);

  // Helper function to check if campaign is currently active (isActive flag + within date range)
  function isCampaignCurrentlyActive(campaign: Campaign): boolean {
    if (!campaign.isActive) return false;

    const now = new Date();

    // If startDate is set, check if current date is after it
    if (campaign.startDate) {
      const startDate = new Date(campaign.startDate);
      if (now < startDate) return false;
    }

    // If endDate is set, check if current date is before it
    if (campaign.endDate) {
      const endDate = new Date(campaign.endDate);
      if (now > endDate) return false;
    }

    return true;
  }

  // Get active campaigns for a specific condominium
  function getActiveCondoCampaigns(condominiumId: string): Campaign[] {
    return allCampaigns.filter(c => c.condominiumId === condominiumId && isCampaignCurrentlyActive(c));
  }

  // Campaign statistics
  const activeCampaigns = campaigns.filter(c => c.isActive).length;
  const inactiveCampaigns = campaigns.filter(c => !c.isActive).length;
  const totalCampaigns = campaigns.length;

  // Onboarding wizard helpers
  const isFirstTime = condominiums.length === 0 && mediaItems.length === 0 && campaigns.length === 0;

  function handleCloseOnboarding() {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_dismissed', 'true');
  }

  function handleNavigateFromWizard(tab: string) {
    setActiveTab(tab);
  }

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <span className="text-black font-bold text-2xl">BP</span>
          </div>
          <p className="text-gray-600">Carregando...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <AdminHeader />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Visão geral do sistema</p>
                </div>
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 sm:px-5 py-2.5 rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all font-semibold text-sm transform hover:scale-105 w-full sm:w-auto"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span className="hidden xs:inline">Criar Campanha Fácil</span>
                  <span className="xs:hidden">Nova Campanha</span>
                </button>
              </div>

              {/* Welcome Card for First Time Users */}
              {isFirstTime && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-2xl p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 sm:w-64 h-32 sm:h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-16 sm:w-32 h-16 sm:h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
                      <SparklesIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                      <h3 className="text-xl sm:text-2xl font-display font-bold">Bem-vindo ao BoxPrático Marketing!</h3>
                    </div>
                    <p className="text-white/90 mb-6 max-w-2xl">
                      Parece que você está começando agora. Siga nosso guia passo a passo para criar sua primeira campanha
                      e começar a exibir conteúdo nas TVs do seu condomínio.
                    </p>
                    <button
                      onClick={() => setShowOnboarding(true)}
                      className="bg-white text-[#D97706] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center gap-2 shadow-lg"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      Começar Agora
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  onClick={() => setActiveTab('condominiums')}
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-6 border border-[#FEF3C7] hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                      <BuildingOfficeIcon className="w-5 h-5 sm:w-7 sm:h-7 text-[#D97706]" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold">
                      Ativos
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-br from-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">{activeCondos.length}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Condomínios</p>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setActiveTab('media')}
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-6 border border-[#FEF3C7] hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FFCE00]/20 to-[#F59E0B]/30 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                      <PhotoIcon className="w-5 h-5 sm:w-7 sm:h-7 text-[#F59E0B]" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-blue-700 bg-blue-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold">
                      Ativas
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-br from-[#F59E0B] to-[#D97706] bg-clip-text text-transparent">{activeMedia.length}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Mídias</p>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => setActiveTab('monitors')}
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-6 border border-[#FEF3C7] hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                      <TvIcon className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-emerald-700 bg-emerald-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold">
                      Online
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-br from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                    {monitors.filter(m => m.isOnline).length}
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Players Online</p>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setActiveTab('campaigns')}
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-6 border border-[#FEF3C7] hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                      <MegaphoneIcon className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-purple-700 bg-purple-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold">
                      Ativas
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent">{activeCampaigns}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Campanhas</p>
                </motion.button>
              </div>

              {/* Mídias por Tipo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100"
              >
                <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Mídias por Tipo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{mediaItems.filter(m => m.type === 'image').length}</p>
                      <p className="text-xs text-blue-700">Imagens</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-50">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{mediaItems.filter(m => m.type === 'video').length}</p>
                      <p className="text-xs text-purple-700">Vídeos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{mediaItems.filter(m => m.type === 'youtube').length}</p>
                      <p className="text-xs text-red-700">YouTube</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-orange-50">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">{mediaItems.filter(m => m.type === 'pdf').length}</p>
                      <p className="text-xs text-orange-700">PDFs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-600">{mediaItems.filter(m => m.type === 'rtmp').length}</p>
                      <p className="text-xs text-emerald-700">Câmeras</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Condomínios Tab */}
          {activeTab === 'condominiums' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold text-gray-900">Condomínios</h2>
                  <p className="text-gray-600 mt-1">Gerencie todos os condomínios cadastrados</p>
                </div>
                <button
                  onClick={() => setShowCondoForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <PlusIcon className="w-5 h-5" />
                  Novo Condomínio
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {condominiums.map((condo, index) => (
                  <motion.div
                    key={condo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0">
                          {condo.photoUrl ? (
                            <img
                              src={condo.photoUrl}
                              alt={condo.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-[#FFCE00]/20 to-[#F59E0B]/20 rounded-lg flex items-center justify-center">
                              <BuildingOfficeIcon className="w-8 h-8 text-[#D97706]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-display font-bold text-gray-900">{condo.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{condo.slug}</p>
                          {condo.cnpj && (
                            <p className="text-xs text-gray-400 mt-1">CNPJ: {condo.cnpj}</p>
                          )}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${condo.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <button
                        onClick={() => toggleNews(condo)}
                        title={condo.showNews !== false ? 'Clique para desativar exibição de notícias' : 'Clique para ativar exibição de notícias'}
                        className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                          condo.showNews !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Notícias: {condo.showNews !== false ? 'Ativadas' : 'Desativadas'}
                      </button>

                      <button
                        onClick={() => setSelectedCondominium(condo.id)}
                        title="Selecionar este condomínio para gerenciar mídias e campanhas"
                        className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                          selectedCondominium === condo.id
                            ? 'bg-[#FEF3C7] text-[#92400E]'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {selectedCondominium === condo.id ? 'Selecionado' : 'Selecionar'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCondominiumActive(condo)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          condo.isActive !== false
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={condo.isActive !== false ? 'Desativar este condomínio' : 'Ativar este condomínio'}
                      >
                        {condo.isActive !== false ? (
                          <XCircleIcon className="w-4 h-4" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setEditingCondo(condo)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-sm font-medium"
                        title="Editar dados do condomínio"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const condoMonitors = monitors.filter(m => m.condominiumId === condo.id).length;
                          const condoCampaigns = campaigns.filter(c => c.condominiumId === condo.id).length;
                          const condoMedias = mediaItems.filter(m => m.condominiumId === condo.id).length;

                          const message = `ATENÇÃO: Ao excluir o condomínio "${condo.name}", serão deletados permanentemente:\n\n` +
                            `• ${condoMonitors} monitor${condoMonitors !== 1 ? 'es' : ''}\n` +
                            `• ${condoCampaigns} campanha${condoCampaigns !== 1 ? 's' : ''}\n` +
                            `• ${condoMedias} mídia${condoMedias !== 1 ? 's' : ''}\n\n` +
                            `Esta ação não pode ser desfeita. Deseja continuar?`;

                          if (confirm(message)) {
                            handleDeleteCondominium(condo.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                        title="Excluir condomínio e todos os dados relacionados"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Campaign Status Indicator */}
                    {(() => {
                      const activeCondoCampaigns = getActiveCondoCampaigns(condo.id);
                      const hasActiveCampaign = activeCondoCampaigns.length > 0;
                      return (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
                            hasActiveCampaign
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-500'
                          }`}>
                            <MegaphoneIcon className="w-4 h-4" />
                            {hasActiveCampaign ? (
                              <span>
                                {activeCondoCampaigns.length === 1
                                  ? `Campanha ativa: ${activeCondoCampaigns[0].name}`
                                  : `${activeCondoCampaigns.length} campanhas ativas`
                                }
                              </span>
                            ) : (
                              <span>Sem campanha ativa</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Monitor Dropdown Section */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMonitorDropdownOpen(monitorDropdownOpen === condo.id ? null : condo.id);
                          }}
                          title="Ver monitores/TVs deste condomínio"
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all text-sm font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <TvIcon className="w-5 h-5" />
                            <span>Monitores ({monitors.filter(m => m.condominiumId === condo.id).length})</span>
                          </div>
                          <ChevronDownIcon className={`w-4 h-4 transition-transform ${monitorDropdownOpen === condo.id ? 'rotate-180' : ''}`} />
                        </button>

                        {monitorDropdownOpen === condo.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                          >
                            {monitors.filter(m => m.condominiumId === condo.id).length > 0 ? (
                              <div className="max-h-64 overflow-y-auto">
                                {monitors
                                  .filter(m => m.condominiumId === condo.id)
                                  .map(monitor => (
                                    <a
                                      key={monitor.id}
                                      href={`/monitor/${monitor.slug}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                                    >
                                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <TvIcon className="w-5 h-5 text-purple-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{monitor.name}</p>
                                        {monitor.location && (
                                          <p className="text-xs text-gray-500 truncate">{monitor.location}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {monitor.isOnline ? (
                                          <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                            <SignalIcon className="w-3 h-3" />
                                            Online
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                            Offline
                                          </span>
                                        )}
                                      </div>
                                    </a>
                                  ))}
                              </div>
                            ) : (
                              <div className="p-4 text-center">
                                <TvIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 mb-2">Nenhum monitor cadastrado</p>
                                <button
                                  onClick={() => {
                                    setMonitorDropdownOpen(null);
                                    setActiveTab('monitors');
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                >
                                  Cadastrar Monitor →
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {condominiums.length === 0 && (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum condomínio cadastrado ainda</p>
                </div>
              )}
            </div>
          )}

          {/* Mídias Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold text-gray-900">Mídias</h2>
                  <p className="text-gray-600 mt-1">Gerencie o conteúdo exibido nas TVs</p>
                </div>
                {selectedCondominium && (
                  <button
                    onClick={() => setShowMediaForm(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-[#F59E0B]/30 transition-all font-semibold shadow-md"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Nova Mídia
                  </button>
                )}
              </div>

              {!selectedCondominium ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {condominiums.length === 0
                      ? 'Nenhum condomínio cadastrado. Cadastre um condomínio primeiro na aba "Condomínios".'
                      : 'Selecione um condomínio acima para gerenciar suas mídias'}
                  </p>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none font-medium"
                    >
                      {condominiums.map((condo) => (
                        <option key={condo.id} value={condo.id}>
                          {condo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mediaItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-display font-bold text-gray-900">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            {item.type === 'rtmp' && (
                              <div className="mt-2 space-y-2">
                                {/* URL para configurar na câmera */}
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                  <p className="text-xs font-semibold text-red-800 mb-1">📹 Configurar na câmera:</p>
                                  <p className="text-xs text-gray-900 font-mono break-all select-all bg-white px-2 py-1 rounded">
                                    {item.sourceUrl.replace('http://', 'rtmp://').replace(':8080/hls/', ':1935/live/').replace('.m3u8', '')}
                                  </p>
                                </div>
                                {/* URL para visualização no navegador */}
                                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs font-semibold text-blue-800 mb-1">🌐 URL para navegador (HLS):</p>
                                  <p className="text-xs text-gray-900 font-mono break-all select-all bg-white px-2 py-1 rounded">{item.sourceUrl}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={`w-3 h-3 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                              {item.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.durationSeconds}s
                            </span>
                          </div>
                          {item.campaignId && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs bg-[#FFFBEB] text-[#B45309] px-2 py-1 rounded font-medium">
                                📢 {campaigns.find(c => c.id === item.campaignId)?.name || 'Campanha não encontrada'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleMediaActive(item)}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              item.isActive
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {item.isActive ? (
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
                            onClick={() => handleEditMedia(item)}
                            className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta mídia?')) {
                                handleDeleteMedia(item.id);
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {mediaItems.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                      <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma mídia cadastrada para este condomínio</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Monitors Tab */}
          {activeTab === 'monitors' && (
            <MonitorsTab condominiums={condominiums} />
          )}

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <CampaignsTab condominiums={condominiums} />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Analytics</h2>
                <p className="text-gray-600 mt-1">Visualizações e estatísticas de uso</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Condomínio</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Campanha</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">IP</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Duração</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Data/Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analyticsData.length > 0 ? (
                        analyticsData.map((view) => (
                          <tr key={view.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-900">{view.condominiumName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{view.campaignName || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">{view.ipAddress}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {Math.floor(view.viewDurationSeconds / 60)}m {view.viewDurationSeconds % 60}s
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(view.viewedAt).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            Nenhuma visualização registrada ainda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Empty state if no data */}
                {/* <div className="p-12 text-center">
                  <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma visualização registrada ainda</p>
                </div> */}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-600 mt-1">Ajuste as configurações do sistema</p>
              </div>
              <SettingsTab />
            </div>
          )}
        </main>

        <AdminFooter />
      </div>

      {/* Condominium Form Modal */}
      {(showCondoForm || editingCondo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
              {editingCondo ? 'Editar Condomínio' : 'Novo Condomínio'}
            </h2>
            <form onSubmit={editingCondo ? handleUpdateCondominium : handleCreateCondominium}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                  <input
                    name="name"
                    value={condoName}
                    onChange={(e) => setCondoName(e.target.value)}
                    placeholder="Nome do condomínio"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                  <input
                    name="slug"
                    value={condoSlug}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gerado automaticamente a partir do nome
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CNPJ (opcional)</label>
                  <input
                    name="cnpj"
                    defaultValue={editingCondo?.cnpj}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço (opcional)</label>
                  <input
                    name="address"
                    defaultValue={editingCondo?.address}
                    placeholder="Rua, número, bairro"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estado (opcional)</label>
                  <select
                    name="state"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  >
                    <option value="">Selecione o estado</option>
                    {brazilianStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade (opcional)</label>
                  <select
                    name="city"
                    defaultValue={editingCondo?.city}
                    disabled={!selectedState}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                  >
                    <option value="">
                      {selectedState ? 'Selecione a cidade' : 'Selecione o estado primeiro'}
                    </option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp para Notificações (opcional)</label>
                  <input
                    name="whatsappPhone"
                    defaultValue={editingCondo?.whatsappPhone}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Receba notificações sobre campanhas, monitores e mídias
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Foto do Condomínio (opcional)</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FFFBEB] file:text-[#B45309] hover:file:bg-[#FEF3C7]"
                  />
                  {editingCondo?.photoUrl && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">Foto atual:</p>
                      <img
                        src={editingCondo.photoUrl}
                        alt="Foto do condomínio"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCondoForm(false);
                    setEditingCondo(null);
                    setSelectedState('');
                    setCondoName('');
                    setCondoSlug('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Media Form Modal */}
      {showMediaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full my-8"
          >
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
              {editingMedia ? 'Editar Mídia' : 'Nova Mídia'}
            </h2>
            <form onSubmit={editingMedia ? handleUpdateMedia : handleCreateMedia}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <select
                    name="type"
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    required
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                    <option value="youtube">YouTube</option>
                    <option value="pdf">PDF</option>
                    <option value="rtmp">Câmera RTMP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                  <input
                    name="title"
                    defaultValue={editingMedia?.title || (mediaType === 'rtmp' ? 'Sorria, você está sendo filmado' : '')}
                    placeholder={mediaType === 'rtmp' ? 'Sorria, você está sendo filmado' : 'Título da mídia'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    name="description"
                    defaultValue={editingMedia?.description || (mediaType === 'rtmp' ? 'Ambiente monitorado. Lembre-se: furtar é crime segundo o artigo 155 do Código Penal, com pena de reclusão de um a quatro anos e multa.' : '')}
                    placeholder={mediaType === 'rtmp' ? 'Ambiente monitorado...' : 'Descrição da mídia'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Campanha (opcional)</label>
                  <select
                    name="campaignId"
                    defaultValue={editingMedia?.campaignId || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  >
                    <option value="">Sem campanha</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
                {!editingMedia && mediaType !== 'youtube' && mediaType !== 'rtmp' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Upload de arquivos</label>
                    <input
                      type="file"
                      name="file"
                      accept="image/*,video/*,.pdf"
                      multiple
                      onChange={(e) => setHasUploadedFile(e.target.files !== null && e.target.files.length > 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {hasUploadedFile
                        ? 'Arquivo(s) selecionado(s). O campo URL abaixo será ignorado.'
                        : 'Você pode selecionar múltiplos arquivos. Ou preencha a URL abaixo para arquivos externos.'}
                    </p>
                  </div>
                )}
                {mediaType !== 'rtmp' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">URL {editingMedia ? '' : '(opcional)'}</label>
                    <input
                      name="sourceUrl"
                      defaultValue={editingMedia?.sourceUrl}
                      placeholder="https://..."
                      disabled={hasUploadedFile && !editingMedia}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900 ${
                        hasUploadedFile && !editingMedia ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
                      }`}
                    />
                    {hasUploadedFile && !editingMedia && (
                      <p className="text-xs text-amber-600 mt-1">
                        Campo desabilitado porque um arquivo foi selecionado para upload.
                      </p>
                    )}
                  </div>
                )}
                {mediaType === 'rtmp' && !editingMedia && (
                  <div className="space-y-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-bold text-emerald-800">Configuração de Câmera RTMP/HLS</span>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-emerald-900 mb-1">
                        Nome da Câmera (Stream Key) *
                      </label>
                      <input
                        name="rtmpKey"
                        placeholder="Ex: camera-lobby, entrada-principal"
                        className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-900 bg-white"
                        required
                      />
                      <p className="text-xs text-emerald-600 mt-1">
                        Use apenas letras minúsculas, números e hífens. Este nome identificará sua câmera.
                      </p>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📹</span>
                        <p className="text-sm font-bold text-red-800">CONFIGURAR NA CÂMERA:</p>
                      </div>
                      <p className="text-xs text-red-700 mb-2">Configure este endereço RTMP na sua câmera IP ou software de streaming (OBS):</p>
                      <div className="bg-white p-3 rounded border border-red-200">
                        <p className="text-sm text-gray-900 font-mono break-all select-all">
                          rtmp://72.61.135.214:1935/live/<span className="text-red-600 font-bold">[NOME-DA-CAMERA]</span>
                        </p>
                      </div>
                      <p className="text-xs text-red-600 mt-2 font-medium">
                        ⚠️ Substitua [NOME-DA-CAMERA] pelo nome digitado acima
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🌐</span>
                        <p className="text-sm font-bold text-blue-800">URL PARA NAVEGADOR (HLS):</p>
                      </div>
                      <p className="text-xs text-blue-700 mb-2">Esta URL será usada automaticamente pelo player para exibir o stream:</p>
                      <div className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-sm text-gray-900 font-mono break-all">
                          http://72.61.135.214:8080/hls/<span className="text-blue-600 font-bold">[NOME-DA-CAMERA]</span>.m3u8
                        </p>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        ✓ Gerada automaticamente após o cadastro
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-emerald-900 mb-1">Imagem de Aviso (opcional)</label>
                      <input
                        type="file"
                        name="thumbnailFile"
                        accept="image/*"
                        className="w-full px-4 py-3 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-gray-900"
                      />
                      <p className="text-xs text-emerald-600 mt-1">
                        Imagem exibida enquanto carrega ou se a câmera estiver offline.
                      </p>
                    </div>
                  </div>
                )}
                {mediaType === 'rtmp' && editingMedia && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="p-3 bg-white rounded border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-1">URL HLS configurada:</p>
                      <p className="text-sm text-gray-900 font-mono break-all">
                        {editingMedia.sourceUrl}
                      </p>
                    </div>
                    {editingMedia.thumbnailUrl && (
                      <div>
                        <label className="block text-sm font-semibold text-blue-900 mb-2">Imagem de Aviso atual:</label>
                        <img src={editingMedia.thumbnailUrl} alt="Preview" className="h-20 rounded border border-blue-300" />
                      </div>
                    )}
                  </div>
                )}
                {/* Video Controls - only show for video and youtube types */}
                {(mediaType === 'video' || mediaType === 'youtube') && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="playFullVideo"
                        checked={showFullVideo}
                        onChange={(e) => setShowFullVideo(e.target.checked)}
                        className="w-4 h-4 text-[#D97706] border-gray-300 rounded focus:ring-[#F59E0B]"
                      />
                      <label htmlFor="playFullVideo" className="text-sm font-semibold text-gray-700">
                        Exibir vídeo completo
                      </label>
                    </div>

                    {!showFullVideo && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Tempo Início (segundos)
                          </label>
                          <input
                            type="number"
                            value={startTimeSeconds}
                            onChange={(e) => setStartTimeSeconds(parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Tempo Fim (segundos)
                          </label>
                          <input
                            type="number"
                            value={endTimeSeconds}
                            onChange={(e) => setEndTimeSeconds(parseInt(e.target.value) || 0)}
                            placeholder="30"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                          />
                        </div>
                      </div>
                    )}

                    {!showFullVideo && endTimeSeconds > startTimeSeconds && (
                      <div className="text-sm text-gray-600 bg-white p-3 rounded border border-gray-200">
                        <span className="font-semibold">Duração do intervalo:</span>{' '}
                        {endTimeSeconds - startTimeSeconds} segundos
                        {' '}({Math.floor((endTimeSeconds - startTimeSeconds) / 60)}m {(endTimeSeconds - startTimeSeconds) % 60}s)
                      </div>
                    )}
                  </div>
                )}

                {/* Duration field for non-video types */}
                {mediaType !== 'video' && mediaType !== 'youtube' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Duração (segundos)</label>
                    <input
                      name="durationSeconds"
                      type="number"
                      defaultValue={editingMedia?.durationSeconds}
                      placeholder="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingMedia ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaForm(false);
                    setEditingMedia(null);
                    setMediaType('');
                    setHasUploadedFile(false);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard
          onClose={handleCloseOnboarding}
          onNavigate={handleNavigateFromWizard}
        />
      )}
    </div>
  );
}



