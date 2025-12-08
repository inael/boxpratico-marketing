'use client';

import { useState, useEffect } from 'react';
import { Condominium, MediaItem, Campaign, AnalyticsView } from '@/types';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminFooter from '@/components/admin/AdminFooter';
import CampaignsTab from '@/components/admin/CampaignsTab';
import SettingsTab from '@/components/admin/SettingsTab';
import MonitorsTab from '@/components/admin/MonitorsTab';
import { brazilianStates, citiesByState } from '@/lib/brazilian-cities';
import {
  BuildingOfficeIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  TvIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCondominiums();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCondominium) {
      loadMediaItems();
      loadCampaigns();
    }
  }, [selectedCondominium]);

  useEffect(() => {
    if (selectedState) {
      setAvailableCities(citiesByState[selectedState] || []);
    } else {
      setAvailableCities([]);
    }
  }, [selectedState]);

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

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const adminPassword = 'admin123';
    if (password === adminPassword) {
      localStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta');
    }
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
      photoUrl: photoUrl || undefined,
      isActive: true,
    };

    const res = await fetch('/api/condominiums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
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

      const streamKey = rtmpKey.trim();

      // Generate HLS URL for playback: http://72.61.135.214:8080/hls/stream-key.m3u8
      const hlsUrl = `http://72.61.135.214:8080/hls/${streamKey}.m3u8`;

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

  // Campaign statistics
  const activeCampaigns = campaigns.filter(c => c.isActive).length;
  const inactiveCampaigns = campaigns.filter(c => !c.isActive).length;
  const totalCampaigns = campaigns.length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-96"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">BP</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600 mt-2">BoxPrático Marketing</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:from-indigo-700 hover:to-pink-700 transition-all shadow-md"
            >
              Entrar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <AdminHeader />

        <main className="flex-1 p-8 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">Visão geral do sistema</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  onClick={() => setActiveTab('condominiums')}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-indigo-100/50 hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <BuildingOfficeIcon className="w-7 h-7 text-indigo-600" />
                    </div>
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">
                      Ativos
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-700 bg-clip-text text-transparent">{activeCondos.length}</h3>
                  <p className="text-slate-600 text-sm mt-2">Condomínios Ativos</p>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setActiveTab('media')}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-pink-100/50 hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-pink-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <PhotoIcon className="w-7 h-7 text-pink-600" />
                    </div>
                    <span className="text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full font-semibold">
                      Total
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold bg-gradient-to-br from-pink-600 to-pink-700 bg-clip-text text-transparent">{activeMedia.length}</h3>
                  <p className="text-slate-600 text-sm mt-2">Mídias Ativas</p>
                </motion.button>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-accent-100/50 hover:shadow-medium transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <XCircleIcon className="w-7 h-7 text-accent-600" />
                    </div>
                    <span className="text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full font-semibold">
                      Inativos
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold bg-gradient-to-br from-accent-600 to-accent-700 bg-clip-text text-transparent">{inactiveMedia.length}</h3>
                  <p className="text-slate-600 text-sm mt-2">Mídias Inativas</p>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => setActiveTab('analytics')}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-soft p-6 border border-indigo-100/50 hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <TvIcon className="w-7 h-7 text-indigo-600" />
                    </div>
                    <span className="text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full font-semibold">
                      Status
                    </span>
                  </div>
                  <h3 className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
                    {previewWindow && !previewWindow.closed ? '1' : '0'}
                  </h3>
                  <p className="text-slate-600 text-sm mt-2">Preview Aberto</p>
                </motion.button>
              </div>

              {/* Media Statistics */}
              <div className="bg-white rounded-2xl shadow-soft p-6 border border-gray-100">
                <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Campanhas Ativas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-600">{activeCampaigns}</p>
                      <p className="text-sm text-green-700">Ativas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-gray-600">{inactiveCampaigns}</p>
                      <p className="text-sm text-gray-700">Inativas</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedCondominium && selectedCondoData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-4">Ações Rápidas</h3>

                  {campaigns.filter(c => c.condominiumId === selectedCondominium).length > 1 && (
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Selecionar Campanha para Preview</label>
                      <select
                        value={selectedCampaignForPreview}
                        onChange={(e) => setSelectedCampaignForPreview(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                      >
                        <option value="">Todas as mídias ativas (sem filtro de campanha)</option>
                        {campaigns
                          .filter(c => c.condominiumId === selectedCondominium)
                          .map(campaign => (
                            <option key={campaign.id} value={campaign.id}>
                              {campaign.name} {campaign.isActive ? '✓' : '(inativa)'}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={handleOpenPreview}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                      <EyeIcon className="w-5 h-5" />
                      Ver Preview na TV
                    </button>
                    <button
                      onClick={handleRefreshPreview}
                      className="flex items-center gap-2 bg-white border-2 border-indigo-500 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-all font-semibold"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      Atualizar Preview
                    </button>
                  </div>
                </motion.div>
              )}
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
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
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
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-pink-100 rounded-lg flex items-center justify-center">
                              <BuildingOfficeIcon className="w-8 h-8 text-indigo-600" />
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
                        className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                          selectedCondominium === condo.id
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {selectedCondominium === condo.id ? 'Selecionado' : 'Selecionar'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={`/player/${condo.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all text-sm font-medium"
                        title="Ver campanha ativa"
                      >
                        <TvIcon className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => toggleCondominiumActive(condo)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          condo.isActive !== false
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={condo.isActive !== false ? 'Desativar' : 'Ativar'}
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
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este condomínio?')) {
                            handleDeleteCondominium(condo.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
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
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:from-indigo-700 hover:to-pink-700 transition-all font-semibold shadow-md"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
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
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs font-semibold text-blue-900 mb-1">URL RTMP:</p>
                                <p className="text-xs text-gray-900 font-mono break-all select-all">{item.sourceUrl}</p>
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
                              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-medium">
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
                    <thead className="bg-gradient-to-r from-indigo-50 to-pink-50 border-b border-gray-200">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço (opcional)</label>
                  <input
                    name="address"
                    defaultValue={editingCondo?.address}
                    placeholder="Rua, número, bairro"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estado (opcional)</label>
                  <select
                    name="state"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Foto do Condomínio (opcional)</label>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
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
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    name="description"
                    defaultValue={editingMedia?.description || (mediaType === 'rtmp' ? 'Ambiente monitorado. Lembre-se: furtar é crime segundo o artigo 155 do Código Penal, com pena de reclusão de um a quatro anos e multa.' : '')}
                    placeholder={mediaType === 'rtmp' ? 'Ambiente monitorado...' : 'Descrição da mídia'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Campanha (opcional)</label>
                  <select
                    name="campaignId"
                    defaultValue={editingMedia?.campaignId || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {mediaType === 'image' || mediaType === 'video' || mediaType === 'pdf'
                        ? 'Você pode selecionar múltiplos arquivos. Ou preencha a URL abaixo para arquivos externos.'
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                    />
                  </div>
                )}
                {mediaType === 'rtmp' && !editingMedia && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">Nome da Câmera (Stream Key)</label>
                      <input
                        name="rtmpKey"
                        placeholder="camera1"
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                        required
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Use apenas letras, números e hífens. Ex: camera1, lobby, entrada
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded border border-blue-300">
                      <p className="text-sm font-semibold text-blue-900 mb-2">📹 Configuração da Câmera IP:</p>
                      <p className="text-xs text-gray-700 mb-2">Configure sua câmera com a URL RTMP:</p>
                      <p className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded">
                        rtmp://72.61.135.214:1935/live/NOME-DA-CAMERA
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Substitua NOME-DA-CAMERA pelo nome que você digitou acima
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded border border-blue-300">
                      <p className="text-sm font-semibold text-blue-900 mb-2">🎬 URL HLS (gerada automaticamente):</p>
                      <p className="text-xs text-gray-700 mb-2">A URL HLS para reprodução será:</p>
                      <p className="text-xs text-gray-900 font-mono break-all bg-gray-50 p-2 rounded">
                        http://72.61.135.214:8080/hls/NOME-DA-CAMERA.m3u8
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">Imagem de Aviso (opcional)</label>
                      <input
                        type="file"
                        name="thumbnailFile"
                        accept="image/*"
                        className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Imagem que aparecerá ao lado do título. Se não enviar, será usada a imagem padrão de aviso de câmera.
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
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingMedia ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaForm(false);
                    setEditingMedia(null);
                    setMediaType('');
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
    </div>
  );
}



