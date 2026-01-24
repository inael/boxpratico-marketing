'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Condominium, MediaItem, Campaign, AnalyticsView, Monitor, PricingModel, PricingConfig, CommissionConfig, Advertiser, BUSINESS_CATEGORIES, BusinessCategory, Company } from '@/types';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSidebarV2 from '@/components/admin/AdminSidebarV2';
import AdminHeaderV2 from '@/components/admin/AdminHeaderV2';
import AdminFooter from '@/components/admin/AdminFooter';
import BenefitsTab from '@/components/admin/BenefitsTab';
import CampaignsTab from '@/components/admin/CampaignsTab';
import SettingsTab from '@/components/admin/SettingsTab';
import MonitorsTab from '@/components/admin/MonitorsTab';
import AdvertisersTab from '@/components/admin/AdvertisersTab';
import ReportsTab from '@/components/admin/ReportsTab';
import ContractsTab from '@/components/admin/ContractsTab';
import UsersTab from '@/components/admin/UsersTab';
import TeamPage from './equipe/page';
import WelcomeHero from '@/components/admin/WelcomeHero';
import AccountsTab from '@/components/admin/AccountsTab';
import MediaGroupsTab from '@/components/admin/MediaGroupsTab';
import LibraryTab from '@/components/admin/LibraryTab';
import OnboardingWizard from '@/components/admin/OnboardingWizard';
import CompaniesTab from '@/components/admin/CompaniesTab';
import FinancialTab from '@/components/admin/FinancialTab';
import dynamic from 'next/dynamic';
import { brazilianStates, citiesByState } from '@/lib/brazilian-cities';

// Dynamic import for map component (no SSR)
const LocationsMap = dynamic(() => import('@/components/admin/LocationsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-gray-500">Carregando mapa...</div>
    </div>
  ),
});
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
  CurrencyDollarIcon,
  MapPinIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Stream server configuration from environment variables
const STREAM_DOMAIN = process.env.STREAM_DOMAIN || 'stream.boxpratico.com.br';
const RTMP_SERVER = process.env.RTMP_SERVER || '72.61.135.214:1935';

// Helper to convert HLS URL to RTMP URL for camera configuration
function hlsToRtmpUrl(hlsUrl: string): string {
  // Extract stream name from HLS URL and convert to RTMP format
  const match = hlsUrl.match(/\/live\/([^.]+)\.m3u8$/);
  if (match) {
    return `rtmp://${RTMP_SERVER}/stream/${match[1]}`;
  }
  // Fallback for old URL formats
  return hlsUrl
    .replace(/https?:\/\/[^/]+/, `rtmp://${RTMP_SERVER}`)
    .replace('/live/', '/stream/')
    .replace('.m3u8', '');
}

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
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
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
  // Pricing states
  const [pricingModel, setPricingModel] = useState<PricingModel>('network');
  const [networkPrice, setNetworkPrice] = useState<string>('');
  const [pricePerPoint, setPricePerPoint] = useState<string>('');
  const [cityPopulation, setCityPopulation] = useState<string>('');
  const [pricingNotes, setPricingNotes] = useState<string>('');
  // Commission states (for the location owner)
  const [commissionPercentage, setCommissionPercentage] = useState<string>('');
  const [commissionNotes, setCommissionNotes] = useState<string>('');
  // Categorias/restrições
  const [localCategory, setLocalCategory] = useState<string>('');
  const [blockedCategories, setBlockedCategories] = useState<string[]>([]);
  const [blockOwnCategory, setBlockOwnCategory] = useState(false);
  // Advertisers state
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>('');
  // Companies state (unified)
  const [companies, setCompanies] = useState<Company[]>([]);
  // Loading state for dashboard
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsLoadingData(true);
      Promise.all([
        loadCondominiums(),
        loadMonitors(),
        loadAllCampaigns(),
        loadAdvertisers(),
        loadCompanies(),
      ]).finally(() => {
        setIsLoadingData(false);
      });
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
      // Set pricing fields
      setPricingModel(editingCondo.pricing?.model || 'network');
      setNetworkPrice(editingCondo.pricing?.networkPrice?.toString() || '');
      setPricePerPoint(editingCondo.pricing?.pricePerPoint?.toString() || '');
      setCityPopulation(editingCondo.pricing?.cityPopulation?.toString() || '');
      setPricingNotes(editingCondo.pricing?.notes || '');
      // Set commission fields
      setCommissionPercentage(editingCondo.commission?.percentage?.toString() || '');
      setCommissionNotes(editingCondo.commission?.notes || '');
      // Category restriction fields
      setLocalCategory(editingCondo.category || '');
      setBlockedCategories(editingCondo.blockedCategories || []);
      setBlockOwnCategory(editingCondo.blockOwnCategory || false);
    } else {
      setCondoName('');
      setCondoSlug('');
      setSelectedState('');
      // Reset pricing fields
      setPricingModel('network');
      setNetworkPrice('');
      setPricePerPoint('');
      setCityPopulation('');
      setPricingNotes('');
      // Reset category fields
      setLocalCategory('');
      setBlockedCategories([]);
      setBlockOwnCategory(false);
      // Reset commission fields
      setCommissionPercentage('');
      setCommissionNotes('');
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

  async function loadAdvertisers() {
    const res = await fetch('/api/advertisers');
    if (res.ok) {
      const data = await res.json();
      // Only show active advertisers in the media form
      setAdvertisers(data.filter((a: Advertiser) => a.isActive));
    }
  }

  async function loadCompanies() {
    const res = await fetch('/api/companies');
    if (res.ok) {
      const data = await res.json();
      setCompanies(data);
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

    // Build pricing config
    const pricing: PricingConfig = {
      model: pricingModel,
      networkPrice: networkPrice ? parseFloat(networkPrice) : undefined,
      pricePerPoint: pricePerPoint ? parseFloat(pricePerPoint) : undefined,
      cityPopulation: cityPopulation ? parseInt(cityPopulation) : undefined,
      notes: pricingNotes || undefined,
    };

    // Build commission config (for location owner)
    const commission: CommissionConfig | undefined = commissionPercentage
      ? {
          percentage: parseFloat(commissionPercentage),
          notes: commissionNotes || undefined,
        }
      : undefined;

    // Parse geolocation
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    const latitude = latitudeStr ? parseFloat(latitudeStr) : undefined;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : undefined;

    // Parse average daily traffic
    const trafficStr = formData.get('averageDailyTraffic') as string;
    const averageDailyTraffic = trafficStr ? parseInt(trafficStr) : undefined;

    const data = {
      name: formData.get('name') as string,
      slug: getUniqueSlug(condoSlug),
      cnpj: formData.get('cnpj') as string,
      address: formData.get('address') as string,
      state: formData.get('state') as string,
      city: formData.get('city') as string,
      whatsappPhone: formData.get('whatsappPhone') as string,
      photoUrl: photoUrl || undefined,
      latitude,
      longitude,
      averageDailyTraffic,
      isActive: true,
      pricing,
      commission,
      // Category restrictions
      category: localCategory || undefined,
      blockedCategories: blockedCategories.length > 0 ? blockedCategories : undefined,
      blockOwnCategory,
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
      // Reset pricing
      setPricingModel('network');
      setNetworkPrice('');
      setPricePerPoint('');
      setCityPopulation('');
      setPricingNotes('');
      // Reset commission
      setCommissionPercentage('');
      setCommissionNotes('');
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

    // Build pricing config
    const pricing: PricingConfig = {
      model: pricingModel,
      networkPrice: networkPrice ? parseFloat(networkPrice) : undefined,
      pricePerPoint: pricePerPoint ? parseFloat(pricePerPoint) : undefined,
      cityPopulation: cityPopulation ? parseInt(cityPopulation) : undefined,
      notes: pricingNotes || undefined,
    };

    // Build commission config (for location owner)
    const commission: CommissionConfig | undefined = commissionPercentage
      ? {
          percentage: parseFloat(commissionPercentage),
          notes: commissionNotes || undefined,
        }
      : undefined;

    // Parse geolocation
    const latitudeStr = formData.get('latitude') as string;
    const longitudeStr = formData.get('longitude') as string;
    const latitude = latitudeStr ? parseFloat(latitudeStr) : undefined;
    const longitude = longitudeStr ? parseFloat(longitudeStr) : undefined;

    // Parse average daily traffic
    const trafficStr = formData.get('averageDailyTraffic') as string;
    const averageDailyTraffic = trafficStr ? parseInt(trafficStr) : undefined;

    const data = {
      name: formData.get('name') as string,
      slug: getUniqueSlug(condoSlug, editingCondo.id),
      cnpj: formData.get('cnpj') as string,
      address: formData.get('address') as string,
      state: formData.get('state') as string,
      city: formData.get('city') as string,
      whatsappPhone: formData.get('whatsappPhone') as string,
      photoUrl: photoUrl || undefined,
      latitude,
      longitude,
      averageDailyTraffic,
      pricing,
      commission,
      // Category restrictions
      category: localCategory || undefined,
      blockedCategories: blockedCategories.length > 0 ? blockedCategories : undefined,
      blockOwnCategory,
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
      // Reset commission
      setCommissionPercentage('');
      setCommissionNotes('');
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
      const hlsUrlToCheck = `https://${STREAM_DOMAIN}/live/${streamKey}.m3u8`;
      const existingCamera = mediaItems.find(
        m => m.type === 'rtmp' && m.sourceUrl === hlsUrlToCheck
      );
      if (existingCamera) {
        alert(`❌ Já existe uma câmera cadastrada com o nome "${streamKey}".\n\nEscolha um nome diferente para sua câmera.`);
        return;
      }

      // Generate HLS URL for playback
      const hlsUrl = hlsUrlToCheck;

      // RTMP URL for camera configuration (alfg/nginx-rtmp uses 'stream' app)
      const rtmpUrl = `rtmp://${RTMP_SERVER}/stream/${streamKey}`;

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
        advertiserId: selectedAdvertiserId || undefined,
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
        setSelectedAdvertiserId('');
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
        advertiserId: selectedAdvertiserId || undefined,
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
        setSelectedAdvertiserId('');
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
          advertiserId: selectedAdvertiserId || undefined,
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
      setSelectedAdvertiserId('');
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
    setSelectedAdvertiserId(item.advertiserId || '');
    setShowMediaForm(true);
  }

  async function handleUpdateMedia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingMedia) return;

    const formData = new FormData(e.currentTarget);
    const campaignId = formData.get('campaignId') as string;

    // Handle thumbnail for RTMP type
    let thumbnailUrl = editingMedia.thumbnailUrl;
    if (editingMedia.type === 'rtmp') {
      const removeThumbnail = formData.get('removeThumbnail') === 'on';
      const thumbnailFile = formData.get('thumbnailFile') as File;

      if (removeThumbnail) {
        // User wants to remove thumbnail and use default
        thumbnailUrl = '/camera-warning.svg';
      } else if (thumbnailFile && thumbnailFile.size > 0) {
        // User uploaded a new thumbnail
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
    }

    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      durationSeconds: parseInt(formData.get('durationSeconds') as string) || 10,
      playFullVideo: showFullVideo,
      startTimeSeconds: showFullVideo ? undefined : startTimeSeconds,
      endTimeSeconds: showFullVideo ? undefined : endTimeSeconds,
      campaignId: campaignId || undefined,
      advertiserId: selectedAdvertiserId || undefined,
      thumbnailUrl,
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
      setSelectedAdvertiserId('');
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
      // Se uma playlist específica está selecionada, use a rota de preview por playlist
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

  // Generate breadcrumbs based on active tab
  function getBreadcrumbs(): { label: string; id?: string }[] {
    const breadcrumbMap: Record<string, { label: string; id?: string }[]> = {
      dashboard: [{ label: 'Inicio' }],
      condominiums: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Locais' }],
      media: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Midias' }],
      monitors: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Receber', id: 'companies' }, { label: 'Monitores' }],
      companies: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Receber' }, { label: 'Meus Clientes' }],
      contracts: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Receber' }, { label: 'Contratos' }],
      financial: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Receber' }, { label: 'Cobrancas' }],
      advertisers: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Receber' }, { label: 'Anunciantes' }],
      campaigns: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Campanhas' }],
      reports: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Relatorios' }],
      analytics: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Analytics' }],
      users: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Administracao' }, { label: 'Usuarios' }],
      accounts: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Administracao' }, { label: 'Contas' }],
      settings: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Configuracoes' }],
      affiliate: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Beneficios' }, { label: 'Indicar Amigo' }],
      'affiliate-earnings': [{ label: 'Inicio', id: 'dashboard' }, { label: 'Beneficios' }, { label: 'Minhas Comissoes' }],
      'media-groups': [{ label: 'Inicio', id: 'dashboard' }, { label: 'Grupos de Midia' }],
      library: [{ label: 'Inicio', id: 'dashboard' }, { label: 'Biblioteca' }],
    };
    return breadcrumbMap[activeTab] || [{ label: 'Inicio' }];
  }

  function handleBreadcrumbNavigate(id: string) {
    setActiveTab(id);
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
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Welcome Hero - First Login */}
      <WelcomeHero />

      <AdminSidebarV2
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isExpanded={sidebarExpanded}
        onExpandChange={setSidebarExpanded}
      />
      <AdminHeaderV2
        breadcrumbs={getBreadcrumbs()}
        onNavigate={handleBreadcrumbNavigate}
        sidebarExpanded={sidebarExpanded}
      />

      <main
        className={`pt-20 pb-8 px-4 sm:px-6 lg:px-8 transition-all duration-300 lg:ml-[var(--sidebar-width)]`}
        style={{
          '--sidebar-width': sidebarExpanded ? '280px' : '80px',
        } as React.CSSProperties}
      >
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Dashboard</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Visão geral do sistema</p>
                </div>
                {!isLoadingData && (
                  <button
                    onClick={() => setShowOnboarding(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 sm:px-5 py-2.5 rounded-xl hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all font-semibold text-sm transform hover:scale-105 w-full sm:w-auto"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span className="hidden xs:inline">Criar Playlist Fácil</span>
                    <span className="xs:hidden">Nova Playlist</span>
                  </button>
                )}
              </div>

              {/* Loading Skeleton */}
              {isLoadingData && (
                <div className="space-y-6 animate-pulse">
                  {/* Skeleton for stats cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-white/80 rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-2 sm:mb-4">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-xl sm:rounded-2xl" />
                          <div className="w-12 h-5 bg-gray-200 rounded-full" />
                        </div>
                        <div className="w-12 h-8 bg-gray-200 rounded mb-2" />
                        <div className="w-16 h-4 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                  {/* Skeleton for media types */}
                  <div>
                    <div className="w-32 h-6 bg-gray-200 rounded mb-4" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                            <div>
                              <div className="w-8 h-6 bg-gray-200 rounded mb-1" />
                              <div className="w-12 h-3 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Welcome Card for First Time Users */}
              {!isLoadingData && isFirstTime && (
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
                      Parece que você está começando agora. Siga nosso guia passo a passo para criar sua primeira playlist
                      e começar a exibir conteúdo nas TVs do seu local.
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

              {/* Dashboard Content - only show when data is loaded */}
              {!isLoadingData && (
                <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
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
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Locais</p>
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
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Telas Online</p>
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
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Playlists</p>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => setActiveTab('advertisers')}
                  className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-soft p-3 sm:p-6 border border-[#FEF3C7] hover:shadow-medium transition-shadow text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm">
                      <UserGroupIcon className="w-5 h-5 sm:w-7 sm:h-7 text-cyan-600" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-cyan-700 bg-cyan-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold">
                      Ativos
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-br from-cyan-500 to-cyan-600 bg-clip-text text-transparent">{advertisers.length}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm mt-1 sm:mt-2">Anunciantes</p>
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
                </>
              )}
            </div>
          )}

          {/* Locais Tab */}
          {activeTab === 'condominiums' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Formulário inline quando ativo */}
              {(showCondoForm || editingCondo) ? (
                <div className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900">
                      {editingCondo ? 'Editar Local' : 'Novo Local'}
                    </h2>
                    <button
                      onClick={() => {
                        setShowCondoForm(false);
                        setEditingCondo(null);
                        setSelectedState('');
                        setCondoName('');
                        setCondoSlug('');
                        setPricingModel('network');
                        setNetworkPrice('');
                        setPricePerPoint('');
                        setCityPopulation('');
                        setPricingNotes('');
                        setCommissionPercentage('');
                        setCommissionNotes('');
                        setLocalCategory('');
                        setBlockedCategories([]);
                        setBlockOwnCategory(false);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <form onSubmit={editingCondo ? handleUpdateCondominium : handleCreateCondominium}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Coluna 1 - Dados Básicos */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                          <BuildingOfficeIcon className="w-5 h-5 text-[#F59E0B]" />
                          Dados Básicos
                        </h3>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                          <input
                            name="name"
                            value={condoName}
                            onChange={(e) => setCondoName(e.target.value)}
                            placeholder="Nome do local (ex: Academia XYZ, Mercado ABC)"
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado</label>
                            <select
                              name="state"
                              value={selectedState}
                              onChange={(e) => setSelectedState(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                            >
                              <option value="">Selecione</option>
                              {brazilianStates.map(state => (
                                <option key={state.code} value={state.code}>
                                  {state.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
                            <select
                              name="city"
                              defaultValue={editingCondo?.city}
                              disabled={!selectedState}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900"
                            >
                              <option value="">
                                {selectedState ? 'Selecione' : 'Selecione o estado'}
                              </option>
                              {availableCities.map(city => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp para Notificações</label>
                          <input
                            name="whatsappPhone"
                            defaultValue={editingCondo?.whatsappPhone}
                            placeholder="(11) 99999-9999"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Foto do Local</label>
                          <input
                            type="file"
                            name="photo"
                            accept="image/*"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FFFBEB] file:text-[#B45309] hover:file:bg-[#FEF3C7]"
                          />
                          {editingCondo?.photoUrl && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={editingCondo.photoUrl}
                                alt="Foto do local"
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <span className="text-xs text-gray-500">Foto atual</span>
                            </div>
                          )}
                        </div>

                        {/* Geolocalização */}
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <MapPinIcon className="w-5 h-5 text-blue-600" />
                            Geolocalização
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                              <input
                                name="latitude"
                                type="number"
                                step="any"
                                defaultValue={editingCondo?.latitude}
                                placeholder="-23.5505"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                              <input
                                name="longitude"
                                type="number"
                                step="any"
                                defaultValue={editingCondo?.longitude}
                                placeholder="-46.6333"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                              />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Dica: Pesquise o endereço no Google Maps e copie as coordenadas
                          </p>
                        </div>

                        {/* Tráfego */}
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                            Tráfego do Local
                          </h3>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              Média de pessoas por dia
                            </label>
                            <input
                              name="averageDailyTraffic"
                              type="number"
                              min="0"
                              defaultValue={editingCondo?.averageDailyTraffic}
                              placeholder="Ex: 500"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Coluna 2 - Precificação e Restrições */}
                      <div className="space-y-4">
                        {/* Precificação */}
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-200">
                          <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                          Precificação
                        </h3>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo de Cobrança</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPricingModel('network')}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                pricingModel === 'network'
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-bold">Por Rede</div>
                              <div className="text-xs opacity-75">Pacote único</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPricingModel('per_point')}
                              className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                                pricingModel === 'per_point'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                              }`}
                            >
                              <div className="font-bold">Por Ponto</div>
                              <div className="text-xs opacity-75">Por tela</div>
                            </button>
                          </div>
                        </div>
                        {pricingModel === 'network' ? (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor da Rede (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={networkPrice}
                              onChange={(e) => setNetworkPrice(e.target.value)}
                              placeholder="Ex: 200.00"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Valor por Ponto/Tela (R$)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={pricePerPoint}
                              onChange={(e) => setPricePerPoint(e.target.value)}
                              placeholder="Ex: 50.00"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">População da Cidade</label>
                          <input
                            type="number"
                            min="0"
                            value={cityPopulation}
                            onChange={(e) => setCityPopulation(e.target.value)}
                            placeholder="Ex: 150000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Observações de Preço</label>
                          <textarea
                            value={pricingNotes}
                            onChange={(e) => setPricingNotes(e.target.value)}
                            placeholder="Ex: Desconto de 10% para pagamento anual"
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900 resize-none"
                          />
                        </div>

                        {/* Comissão */}
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 text-xs font-bold">%</span>
                            </div>
                            Comissão do Local
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Comissão (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(e.target.value)}
                                placeholder="Ex: 30"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Observações</label>
                              <input
                                type="text"
                                value={commissionNotes}
                                onChange={(e) => setCommissionNotes(e.target.value)}
                                placeholder="Ex: Pago via PIX"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Restrições */}
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-xs">🚫</span>
                            </div>
                            Restrições de Anúncios
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria deste Local</label>
                              <select
                                value={localCategory}
                                onChange={(e) => setLocalCategory(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-gray-900"
                              >
                                <option value="">Nenhuma categoria</option>
                                {BUSINESS_CATEGORIES.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.icon} {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {localCategory && (
                              <label className="flex items-center gap-3 p-3 rounded-lg bg-red-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={blockOwnCategory}
                                  onChange={(e) => setBlockOwnCategory(e.target.checked)}
                                  className="w-5 h-5 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                />
                                <div>
                                  <span className="font-medium text-gray-900">Bloquear concorrentes</span>
                                  <p className="text-xs text-gray-500">
                                    Não exibir anúncios da mesma categoria
                                  </p>
                                </div>
                              </label>
                            )}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Categorias bloqueadas</label>
                              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                                {BUSINESS_CATEGORIES.filter(cat => cat.id !== localCategory).map((cat) => (
                                  <label
                                    key={cat.id}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${
                                      blockedCategories.includes(cat.id)
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={blockedCategories.includes(cat.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setBlockedCategories([...blockedCategories, cat.id]);
                                        } else {
                                          setBlockedCategories(blockedCategories.filter(id => id !== cat.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
                                    />
                                    <span>{cat.icon} {cat.name}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCondoForm(false);
                          setEditingCondo(null);
                          setSelectedState('');
                          setCondoName('');
                          setCondoSlug('');
                          setPricingModel('network');
                          setNetworkPrice('');
                          setPricePerPoint('');
                          setCityPopulation('');
                          setPricingNotes('');
                          setCommissionPercentage('');
                          setCommissionNotes('');
                          setLocalCategory('');
                          setBlockedCategories([]);
                          setBlockOwnCategory(false);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Listagem normal */
                <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Locais</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie todos os locais cadastrados (academias, condomínios, mercados, clínicas...)</p>
                </div>
                <button
                  onClick={() => setShowCondoForm(true)}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all font-semibold text-sm sm:text-base w-full sm:w-auto"
                >
                  <PlusIcon className="w-5 h-5" />
                  Novo Local
                </button>
              </div>

              {/* Mapa de Locais */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-soft p-4 sm:p-6 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-display font-bold text-gray-900">Mapa de Terminais</h3>
                  </div>
                  <span className="text-xs text-gray-500">
                    {condominiums.filter(c => c.latitude && c.longitude).length} de {condominiums.length} locais no mapa
                  </span>
                </div>
                <LocationsMap
                  locations={condominiums}
                  monitors={monitors}
                  onLocationSelect={(id) => {
                    const condo = condominiums.find(c => c.id === id);
                    if (condo) {
                      setEditingCondo(condo);
                    }
                  }}
                />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {condominiums.map((condo, index) => (
                  <motion.div
                    key={condo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {condo.photoUrl ? (
                            <img
                              src={condo.photoUrl}
                              alt={condo.name}
                              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FFCE00]/20 to-[#F59E0B]/20 rounded-lg flex items-center justify-center">
                              <BuildingOfficeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#D97706]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-display font-bold text-gray-900 truncate">{condo.name}</h3>
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
                        title="Selecionar este local para gerenciar mídias e playlists"
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
                        title={condo.isActive !== false ? 'Desativar este local' : 'Ativar este local'}
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
                        title="Editar dados do local"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          const condoMonitors = monitors.filter(m => m.condominiumId === condo.id).length;
                          const condoCampaigns = campaigns.filter(c => c.condominiumId === condo.id).length;
                          const condoMedias = mediaItems.filter(m => m.condominiumId === condo.id).length;

                          const message = `ATENÇÃO: Ao excluir o local "${condo.name}", serão deletados permanentemente:\n\n` +
                            `• ${condoMonitors} tela${condoMonitors !== 1 ? 's' : ''}\n` +
                            `• ${condoCampaigns} playlist${condoCampaigns !== 1 ? 's' : ''}\n` +
                            `• ${condoMedias} mídia${condoMedias !== 1 ? 's' : ''}\n\n` +
                            `Esta ação não pode ser desfeita. Deseja continuar?`;

                          if (confirm(message)) {
                            handleDeleteCondominium(condo.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                        title="Excluir local e todos os dados relacionados"
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
                                  ? `Playlist ativa: ${activeCondoCampaigns[0].name}`
                                  : `${activeCondoCampaigns.length} playlists ativas`
                                }
                              </span>
                            ) : (
                              <span>Sem playlist ativa</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Pricing and Commission Indicators */}
                    {(condo.pricing && (condo.pricing.networkPrice || condo.pricing.pricePerPoint)) || condo.commission?.percentage ? (
                      <div className="mt-3 space-y-2">
                        {/* Pricing */}
                        {condo.pricing && (condo.pricing.networkPrice || condo.pricing.pricePerPoint) && (
                          <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                            condo.pricing.model === 'network'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            <div className="flex items-center gap-2">
                              <CurrencyDollarIcon className="w-4 h-4" />
                              <span>
                                {condo.pricing.model === 'network' ? 'Por Rede' : 'Por Ponto'}
                              </span>
                            </div>
                            <span className="font-bold">
                              {condo.pricing.model === 'network'
                                ? `R$ ${condo.pricing.networkPrice?.toFixed(2)}`
                                : `R$ ${condo.pricing.pricePerPoint?.toFixed(2)}/tela`
                              }
                              {condo.pricing.model === 'per_point' && (
                                <span className="font-normal opacity-75 ml-1">
                                  ({monitors.filter(m => m.condominiumId === condo.id).length} telas = R$ {((condo.pricing.pricePerPoint || 0) * monitors.filter(m => m.condominiumId === condo.id).length).toFixed(2)})
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                        {/* Commission */}
                        {condo.commission?.percentage && (
                          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-purple-50 text-purple-700">
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center text-[10px] font-bold">%</span>
                              <span>Comissão Local</span>
                            </div>
                            <span className="font-bold">{condo.commission.percentage}%</span>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {/* Monitor Dropdown Section */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMonitorDropdownOpen(monitorDropdownOpen === condo.id ? null : condo.id);
                          }}
                          title="Ver telas deste local"
                          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all text-sm font-medium"
                        >
                          <div className="flex items-center gap-2">
                            <TvIcon className="w-5 h-5" />
                            <span>Telas ({monitors.filter(m => m.condominiumId === condo.id).length})</span>
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
                                <p className="text-sm text-gray-500 mb-2">Nenhuma tela cadastrada</p>
                                <button
                                  onClick={() => {
                                    setMonitorDropdownOpen(null);
                                    setActiveTab('monitors');
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                >
                                  Cadastrar Tela →
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
                  <p className="text-gray-500">Nenhum local cadastrado ainda</p>
                </div>
              )}
                </>
              )}
            </div>
          )}

          {/* Mídias Tab */}
          {activeTab === 'media' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Mídias</h2>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Gerencie o conteúdo exibido nas TVs</p>
                </div>
                {selectedCondominium && (
                  <button
                    onClick={() => setShowMediaForm(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg hover:shadow-[#F59E0B]/30 transition-all font-semibold shadow-md text-sm sm:text-base w-full sm:w-auto"
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
                      ? 'Nenhum local cadastrado. Cadastre um local primeiro na aba "Locais".'
                      : 'Selecione um local acima para gerenciar suas mídias'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Local Selecionado
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

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {mediaItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        {/* Thumbnail Preview */}
                        <div className="relative w-full h-28 sm:h-32 mb-3 sm:mb-4 rounded-lg overflow-hidden bg-gray-100">
                          {item.type === 'image' ? (
                            <img
                              src={item.sourceUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === 'youtube' ? (
                            <img
                              src={`https://img.youtube.com/vi/${item.sourceUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)?.[1] || ''}/mqdefault.jpg`}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === 'rtmp' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={item.thumbnailUrl || '/camera-warning.svg'}
                                alt={item.title}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                          ) : item.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          ) : null}
                          <div className="absolute top-2 right-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                              {item.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-display font-bold text-gray-900 truncate">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                            {item.type === 'rtmp' && (
                              <div className="mt-2 space-y-2">
                                {/* URL para configurar na câmera */}
                                <div className="p-2 bg-red-50 rounded border border-red-200">
                                  <p className="text-xs font-semibold text-red-800 mb-1">📹 Configurar na câmera:</p>
                                  <p className="text-xs text-gray-900 font-mono break-all select-all bg-white px-2 py-1 rounded">
                                    {hlsToRtmpUrl(item.sourceUrl)}
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
                        </div>

                        <div className="space-y-2 mb-3 sm:mb-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                              {item.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.durationSeconds}s
                            </span>
                          </div>
                          {item.campaignId && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs bg-[#FFFBEB] text-[#B45309] px-2 py-1 rounded font-medium truncate max-w-full">
                                📢 {campaigns.find(c => c.id === item.campaignId)?.name || 'Playlist não encontrada'}
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
                      <p className="text-gray-500">Nenhuma mídia cadastrada para este local</p>
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

          {/* Companies Tab (Unified) */}
          {activeTab === 'companies' && (
            <CompaniesTab companies={companies} onRefresh={loadCompanies} />
          )}

          {/* Advertisers Tab (Legacy - mantido para compatibilidade) */}
          {activeTab === 'advertisers' && (
            <AdvertisersTab />
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <ContractsTab />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTab />
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <TeamPage />
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <AccountsTab />
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <ReportsTab condominiums={condominiums} monitors={monitors} />
          )}

          {/* Media Groups Tab */}
          {activeTab === 'media-groups' && (
            <MediaGroupsTab />
          )}

          {/* Library Tab */}
          {activeTab === 'library' && (
            <LibraryTab />
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
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Playlist</th>
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

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <FinancialTab companies={companies} onRefresh={loadCompanies} />
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

          {/* Benefits/Affiliate Tab */}
          {(activeTab === 'affiliate' || activeTab === 'affiliate-earnings') && (
            <BenefitsTab subTab={activeTab as 'affiliate' | 'affiliate-earnings'} />
          )}
        </main>

      {/* Media Form Modal */}
      {showMediaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-md w-full my-4 sm:my-8"
          >
            <h2 className="text-xl sm:text-2xl font-display font-bold text-gray-900 mb-4 sm:mb-6">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Playlist (opcional)</label>
                  <select
                    name="campaignId"
                    defaultValue={editingMedia?.campaignId || ''}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  >
                    <option value="">Sem playlist</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Anunciante (opcional)</label>
                  <select
                    name="advertiserId"
                    value={selectedAdvertiserId}
                    onChange={(e) => setSelectedAdvertiserId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                  >
                    <option value="">Mídia interna (sem anunciante)</option>
                    {advertisers.map(advertiser => (
                      <option key={advertiser.id} value={advertiser.id}>
                        {advertiser.name} {advertiser.segment ? `(${advertiser.segment})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Selecione o anunciante dono desta mídia para controle de faturamento
                  </p>
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
                          rtmp://{RTMP_SERVER}/stream/<span className="text-red-600 font-bold">[NOME-DA-CAMERA]</span>
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
                          https://{STREAM_DOMAIN}/live/<span className="text-blue-600 font-bold">[NOME-DA-CAMERA]</span>.m3u8
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
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-2">Imagem de Aviso:</label>
                      {editingMedia.thumbnailUrl && editingMedia.thumbnailUrl !== '/camera-warning.svg' ? (
                        <div className="space-y-2">
                          <img src={editingMedia.thumbnailUrl} alt="Preview" className="h-20 rounded border border-blue-300" />
                          <p className="text-xs text-gray-500">Imagem atual</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mb-2">Usando imagem padrão</p>
                      )}
                      <input
                        type="file"
                        name="thumbnailFile"
                        accept="image/*"
                        className="w-full mt-2 px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        Selecione uma nova imagem para substituir a atual
                      </p>
                      {editingMedia.thumbnailUrl && editingMedia.thumbnailUrl !== '/camera-warning.svg' && (
                        <label className="flex items-center gap-2 mt-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            name="removeThumbnail"
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          Remover imagem e usar padrão
                        </label>
                      )}
                    </div>
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
              <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMediaForm(false);
                    setEditingMedia(null);
                    setMediaType('');
                    setHasUploadedFile(false);
                    setSelectedAdvertiserId('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:shadow-lg transition-all text-sm sm:text-base"
                >
                  {editingMedia ? 'Atualizar' : 'Criar'}
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



