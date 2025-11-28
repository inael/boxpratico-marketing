'use client';

import { MediaItem } from '@/types';

interface YoutubeSlideProps {
  item: MediaItem;
}

function getYoutubeEmbedUrl(url: string): string {
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0`;
}

export default function YoutubeSlide({ item }: YoutubeSlideProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      <iframe
        src={getYoutubeEmbedUrl(item.sourceUrl)}
        className="w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
      
      {(item.title || item.description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8 lg:p-12">
          {item.title && (
            <h2 className="text-white text-3xl lg:text-4xl font-bold mb-2">{item.title}</h2>
          )}
          {item.description && (
            <p className="text-white/90 text-xl lg:text-2xl">{item.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
