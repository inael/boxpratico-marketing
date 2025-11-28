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
    <div className="w-full h-full flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={item.sourceUrl}
        className="w-full h-full object-contain"
        onEnded={onVideoEnd}
        muted
        playsInline
      />
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <h2 className="text-white text-4xl font-bold">{item.title}</h2>
          {item.description && (
            <p className="text-white/90 text-2xl mt-2">{item.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
