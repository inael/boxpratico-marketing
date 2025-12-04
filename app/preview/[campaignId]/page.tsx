'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback, useTransition } from 'react';
import { MediaItem, NewsItem, Campaign, Condominium } from '@/types';
import ImageSlide from '@/components/slides/ImageSlide';
import VideoSlide from '@/components/slides/VideoSlide';
import YoutubeSlide from '@/components/slides/YoutubeSlide';
import PdfSlide from '@/components/slides/PdfSlide';
import NewsSlide from '@/components/slides/NewsSlide';
import RtmpSlide from '@/components/slides/RtmpSlide';

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
          setTemperature(22); // Fallback
        });
    } else {
      setTemperature(22); // Default when no city
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

export default function CampaignPreview() {
  const params = useParams();
  const campaignId = params.campaignId as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [condominium, setCondominium] = useState<Condominium | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNews, setShowNews] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [mediaCounter, setMediaCounter] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [sessionStartTime] = useState<number>(Date.now());
  const [, startTransition] = useTransition();

  // Callback for timer updates from slides
  const handleTimeUpdate = useCallback((time: number) => {
    startTransition(() => {
      setCountdown(time);
    });
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get campaign info
        const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
        const campaignData: Campaign = await campaignRes.json();

        // Get condominium info
        const condoRes = await fetch(`/api/condominiums/${campaignData.condominiumId}`);
        const condoData = await condoRes.json();

        // Get media items for this campaign
        const mediaRes = await fetch(`/api/media-items?campaignId=${campaignId}`);
        const allMedia: MediaItem[] = await mediaRes.json();

        // Filter and sort
        const filteredMedia = allMedia
          .filter(m => m.isActive && m.campaignId === campaignId)
          .sort((a, b) => a.order - b.order);

        // Get news
        const newsRes = await fetch('/api/news');
        const news = await newsRes.json();

        setCampaign(campaignData);
        setCondominium(condoData);
        setMediaItems(filteredMedia);
        setNewsItems(news);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch campaign preview data:', error);
        setIsLoading(false);
      }
    }

    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  // Analytics tracking
  useEffect(() => {
    const sendAnalytics = async () => {
      if (!campaign || !condominium) return;

      const viewDurationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      try {
        // Get client IP (in a real scenario, this would come from server-side)
        const ipAddress = 'preview-session';

        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            condominiumId: condominium.id,
            condominiumName: condominium.name,
            campaignId: campaign.id,
            campaignName: campaign.name,
            ipAddress,
            viewDurationSeconds,
          }),
        });
      } catch (error) {
        console.error('Failed to send analytics:', error);
      }
    };

    // Send analytics when component unmounts or page is closed
    return () => {
      sendAnalytics();
    };
  }, [campaign, condominium, sessionStartTime]);

  const nextSlide = useCallback(() => {
    // Check campaign first, then condominium, default to true
    const newsEnabled = campaign?.showNews !== false && condominium?.showNews !== false;
    const newsEveryN = campaign?.newsEveryNMedia || 3;

    if (showNews) {
      setCurrentNewsIndex((prev) => (prev + 1) % newsItems.length);
      setShowNews(false);
      setMediaCounter(0);
    } else {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % mediaItems.length;
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
  }, [showNews, mediaItems.length, newsItems.length, condominium?.showNews, campaign?.showNews, campaign?.newsEveryNMedia]);

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
      const newsDuration = campaign?.newsDurationSeconds
        ? Math.max(5, campaign.newsDurationSeconds) * 1000
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
  }, [currentIndex, isLoading, mediaItems, showNews, nextSlide, campaign?.newsDurationSeconds]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl">Carregando preview...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl">Campanha não encontrada</div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl">
          Nenhuma mídia cadastrada para esta campanha
        </div>
      </div>
    );
  }

  // Check campaign first, then condominium, default to true
  const newsEnabled = campaign?.showNews !== false && condominium?.showNews !== false;

  const renderSlide = () => {
    if (showNews && newsItems.length > 0 && newsEnabled) {
      const newsDuration = campaign?.newsDurationSeconds
        ? Math.max(5, campaign.newsDurationSeconds)
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
