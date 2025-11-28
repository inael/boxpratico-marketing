'use client';

import { useState, useEffect, useCallback } from 'react';
import { MediaItem, NewsItem, Condominium } from '@/types';
import ImageSlide from './slides/ImageSlide';
import VideoSlide from './slides/VideoSlide';
import YoutubeSlide from './slides/YoutubeSlide';
import PdfSlide from './slides/PdfSlide';
import NewsSlide from './slides/NewsSlide';

interface PlaylistPlayerProps {
  condominiumId: string;
}

export default function PlaylistPlayer({ condominiumId }: PlaylistPlayerProps) {
  const [condominium, setCondominium] = useState<Condominium | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showNews, setShowNews] = useState(false);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [condoRes, mediaRes, newsRes] = await Promise.all([
          fetch(`/api/condominiums/${condominiumId}`),
          fetch(`/api/media-items?condominiumId=${condominiumId}`),
          fetch('/api/news'),
        ]);

        const condoData = await condoRes.json();
        const media = await mediaRes.json();
        const news = await newsRes.json();

        setCondominium(condoData);
        setMediaItems(media);
        setNewsItems(news);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch playlist data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, [condominiumId]);

  const nextSlide = useCallback(() => {
    const newsEnabled = condominium?.showNews !== false;
    
    if (showNews) {
      setCurrentNewsIndex((prev) => (prev + 1) % newsItems.length);
      setShowNews(false);
    } else {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % mediaItems.length;
        if (next % 3 === 0 && newsItems.length > 0 && newsEnabled) {
          setShowNews(true);
        }
        return next;
      });
    }
  }, [showNews, mediaItems.length, newsItems.length, condominium?.showNews]);

  useEffect(() => {
    if (isLoading || mediaItems.length === 0) return;

    const currentItem = showNews ? null : mediaItems[currentIndex];
    const duration = currentItem?.type === 'video' 
      ? null
      : currentItem?.durationSeconds 
        ? currentItem.durationSeconds * 1000 
        : 10000;

    if (duration && !showNews) {
      const timer = setTimeout(nextSlide, duration);
      return () => clearTimeout(timer);
    }

    if (showNews) {
      const timer = setTimeout(nextSlide, 15000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, isLoading, mediaItems, showNews, nextSlide]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl">Carregando...</div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl">
          Nenhuma mídia cadastrada para este condomínio
        </div>
      </div>
    );
  }

  const newsEnabled = condominium?.showNews !== false;

  if (showNews && newsItems.length > 0 && newsEnabled) {
    return <NewsSlide news={newsItems[currentNewsIndex]} />;
  }

  const currentItem = mediaItems[currentIndex];

  switch (currentItem.type) {
    case 'image':
      return <ImageSlide item={currentItem} />;
    case 'video':
      return <VideoSlide item={currentItem} onVideoEnd={nextSlide} />;
    case 'youtube':
      return <YoutubeSlide item={currentItem} />;
    case 'pdf':
      return <PdfSlide item={currentItem} />;
    default:
      return (
        <div className="w-full h-screen flex items-center justify-center bg-black">
          <div className="text-white text-4xl">Tipo de mídia não suportado</div>
        </div>
      );
  }
}
