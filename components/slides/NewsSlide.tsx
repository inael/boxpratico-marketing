'use client';

import { NewsItem } from '@/types';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface NewsSlideProps {
  news: NewsItem;
  duration: number; // in seconds
  onTimeUpdate?: (timeLeft: number) => void;
}

export default function NewsSlide({ news, duration, onTimeUpdate }: NewsSlideProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const hasImage = Boolean(news.imageUrl && news.imageUrl.trim() !== '');

  useEffect(() => {
    setTimeLeft(duration);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }
        if (newTime === 0) {
          clearInterval(interval);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, news, onTimeUpdate]);

  return (
    <div className="w-full h-screen flex flex-col bg-black">
      {/* Top: Title and Description Section */}
      <div className="bg-white px-12 py-8">
        <div className="min-w-0">
          <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-3">
            {news.title}
          </h2>
          {news.description && (
            <p className="text-xl text-gray-700 leading-relaxed line-clamp-3">
              {news.description}
            </p>
          )}
          {news.source && (
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Fonte: {news.source}
            </p>
          )}
        </div>
      </div>

      {/* Bottom: Image Section */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {hasImage ? (
          <Image
            src={news.imageUrl!}
            alt={news.title}
            fill
            className="object-contain"
            priority
          />
        ) : (
          <div className="text-gray-600 text-4xl font-semibold">
            Sem imagem disponível
          </div>
        )}
      </div>
    </div>
  );
}
