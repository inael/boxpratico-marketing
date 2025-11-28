'use client';

import { MediaItem } from '@/types';
import { useEffect, useRef } from 'react';

interface VideoSlideProps {
  item: MediaItem;
  onVideoEnd?: () => void;
}

export default function VideoSlide({ item, onVideoEnd }: VideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      <video
        ref={videoRef}
        src={item.sourceUrl}
        className="w-full h-full object-contain"
        onEnded={onVideoEnd}
        muted
        playsInline
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
