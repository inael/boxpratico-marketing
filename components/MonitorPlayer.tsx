'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaItem, NewsItem, Condominium, Campaign } from '@/types';
import ImageSlide from './slides/ImageSlide';
import VideoSlide from './slides/VideoSlide';
import YoutubeSlide from './slides/YoutubeSlide';
import PdfSlide from './slides/PdfSlide';
import NewsSlide from './slides/NewsSlide';
import RtmpSlide from './slides/RtmpSlide';

interface PlayerFooterProps {
  city?: string;
  countdown?: number;
}

function PlayerFooter({ city, countdown }: PlayerFooterProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (city) {
      fetch(`/api/weather?city=${encodeURIComponent(city)}`)
        .then(res => res.json())
        .then(data => setTemperature(data.temperature))
        .catch(err => {
          console.error('Failed to fetch weather:', err);
          setTemperature(22);
        });
    } else {
      setTemperature(22);
    }
  }, [city]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm px-12 py-6 flex items-center justify-between z-50">
      <div className="flex items-center gap-12">
        <div>
          <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">Hora</p>
          <p className="text-white text-4xl font-bold">{formatTime(currentTime)}</p>
        </div>

        <div className="w-px h-12 bg-gray-700"></div>

        <div>
          <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">Dia</p>
          <p className="text-white text-2xl font-semibold capitalize">{formatDate(currentTime)}</p>
        </div>

        <div className="w-px h-12 bg-gray-700"></div>

        <div>
          <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">Temperatura</p>
          <p className="text-white text-4xl font-bold">{temperature}°C</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <p className="text-white text-xl font-semibold">BoxPrático Player</p>
        {countdown !== undefined && countdown > 0 && (
          <>
            <div className="w-px h-8 bg-gray-700"></div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-white/30 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xl font-bold text-white tabular-nums">
                  {countdown}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MonitorPlayerProps {
  monitorId: string;
  monitorSlug: string;
  condominiumId: string;
}

export default function MonitorPlayer({ monitorId, monitorSlug, condominiumId }: MonitorPlayerProps) {
  const [condominium, setCondominium] = useState<Condominium | null>(null);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNews, setShowNews] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [loopCount, setLoopCount] = useState(0);
  const [mediaCounter, setMediaCounter] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Send heartbeat every 15 seconds
  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/monitors/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monitorSlug }),
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 15 seconds
    const interval = setInterval(sendHeartbeat, 15000);

    return () => clearInterval(interval);
  }, [monitorSlug]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCountdown(time);
  }, []);

  const isCampaignActive = (campaign: Campaign): boolean => {
    if (!campaign.isActive) return false;

    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) return false;
    if (campaign.endDate && new Date(campaign.endDate) < now) return false;

    return true;
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [condoRes, campaignsRes, mediaRes, newsRes] = await Promise.all([
          fetch(`/api/condominiums/${condominiumId}`),
          fetch(`/api/campaigns?condominiumId=${condominiumId}`),
          fetch(`/api/media-items?condominiumId=${condominiumId}`),
          fetch('/api/news'),
        ]);

        const condoData = await condoRes.json();
        const campaigns: Campaign[] = await campaignsRes.json();
        const allMedia: MediaItem[] = await mediaRes.json();
        const news = await newsRes.json();

        // Find active campaigns for this monitor within date range
        const activeCampaigns = campaigns.filter(c =>
          isCampaignActive(c) && c.monitorId === monitorId
        );

        // If no campaigns for this monitor, try general campaigns (without monitorId)
        let active: Campaign | null = null;
        if (activeCampaigns.length > 0) {
          active = activeCampaigns.sort((a, b) => {
            const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
            const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
            return dateB - dateA;
          })[0];
        } else {
          // Fallback to campaigns without monitorId
          const generalCampaigns = campaigns.filter(c =>
            isCampaignActive(c) && !c.monitorId
          );
          if (generalCampaigns.length > 0) {
            active = generalCampaigns.sort((a, b) => {
              const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
              const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
              return dateB - dateA;
            })[0];
          }
        }

        setCondominium(condoData);
        setActiveCampaign(active);

        // Filter media: only active items from the active campaign
        // If no active campaign for this monitor, show no media
        let filteredMedia: MediaItem[] = [];

        if (active) {
          filteredMedia = allMedia
            .filter(m => m.isActive && m.campaignId === active.id)
            .sort((a, b) => a.order - b.order);
        }

        setMediaItems(filteredMedia);
        setNewsItems(news);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch playlist data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [condominiumId, monitorId]);

  const nextSlide = useCallback(() => {
    const newsEnabled = activeCampaign?.showNews !== false && condominium?.showNews !== false;
    const newsEveryN = activeCampaign?.newsEveryNMedia || 3;

    if (showNews) {
      setCurrentNewsIndex((prev) => (prev + 1) % newsItems.length);
      setShowNews(false);
      setMediaCounter(0);
    } else {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % mediaItems.length;

        if (next === 0) {
          setLoopCount((count) => count + 1);
          window.location.reload();
        }

        return next;
      });

      setMediaCounter((prev) => {
        const newCounter = prev + 1;
        if (newCounter >= newsEveryN && newsItems.length > 0 && newsEnabled) {
          setShowNews(true);
          return 0;
        }
        return newCounter;
      });
    }
  }, [showNews, mediaItems.length, newsItems.length, condominium?.showNews, activeCampaign?.showNews, activeCampaign?.newsEveryNMedia]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'refresh-player') {
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isLoading || mediaItems.length === 0) return;

    const currentItem = showNews ? null : mediaItems[currentIndex];
    const duration = currentItem?.type === 'video'
      ? null
      : currentItem?.durationSeconds
        ? currentItem.durationSeconds * 1000
        : 10000;

    if (duration && !showNews) {
      const fadeOutTimer = setTimeout(() => {
        setIsTransitioning(true);
      }, duration - 500);

      const timer = setTimeout(() => {
        nextSlide();
        setTimeout(() => setIsTransitioning(false), 50);
      }, duration);

      return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
      };
    }

    if (showNews) {
      const newsDuration = activeCampaign?.newsDurationSeconds
        ? Math.max(5, activeCampaign.newsDurationSeconds) * 1000
        : 15000;

      const fadeOutTimer = setTimeout(() => {
        setIsTransitioning(true);
      }, newsDuration - 500);

      const timer = setTimeout(() => {
        nextSlide();
        setTimeout(() => setIsTransitioning(false), 50);
      }, newsDuration);

      return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
      };
    }
  }, [currentIndex, isLoading, mediaItems, showNews, nextSlide, activeCampaign?.newsDurationSeconds]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl">Carregando...</div>
      </div>
    );
  }

  if (!activeCampaign) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-white text-4xl font-bold mb-4">Nenhuma Playlist Ativa</h1>
          <p className="text-gray-400 text-xl max-w-md mx-auto">
            Configure uma playlist para esta tela no painel administrativo
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Aguardando configuração...</span>
          </div>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-white text-4xl font-bold mb-4">Nenhuma Mídia Cadastrada</h1>
          <p className="text-gray-400 text-xl max-w-md mx-auto">
            Adicione mídias à playlist <span className="text-[#F59E0B] font-semibold">&quot;{activeCampaign?.name}&quot;</span>
          </p>
          <div className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-gray-300">Aguardando conteúdo...</span>
          </div>
        </div>
      </div>
    );
  }

  const newsEnabled = activeCampaign?.showNews !== false && condominium?.showNews !== false;

  const renderSlide = () => {
    if (showNews && newsItems.length > 0 && newsEnabled) {
      const newsDuration = activeCampaign?.newsDurationSeconds
        ? Math.max(5, activeCampaign.newsDurationSeconds)
        : 15;
      return <NewsSlide news={newsItems[currentNewsIndex]} duration={newsDuration} onTimeUpdate={handleTimeUpdate} />;
    }

    const currentItem = mediaItems[currentIndex];

    switch (currentItem.type) {
      case 'image':
        return <ImageSlide item={currentItem} onTimeUpdate={handleTimeUpdate} />;
      case 'video':
        return <VideoSlide item={currentItem} onVideoEnd={nextSlide} />;
      case 'youtube':
        return <YoutubeSlide item={currentItem} onTimeUpdate={handleTimeUpdate} />;
      case 'pdf':
        return <PdfSlide item={currentItem} />;
      case 'rtmp':
        return <RtmpSlide item={currentItem} onTimeUpdate={handleTimeUpdate} />;
      default:
        return (
          <div className="w-full h-screen flex items-center justify-center bg-black">
            <div className="text-white text-4xl">Tipo de mídia não suportado</div>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative w-full h-screen transition-opacity duration-500 ease-in-out ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {renderSlide()}
      <PlayerFooter city={condominium?.city} countdown={countdown} />
    </div>
  );
}
