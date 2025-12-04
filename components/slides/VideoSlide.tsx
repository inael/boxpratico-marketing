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
    const video = videoRef.current;
    if (!video) return;

    const playFullVideo = item.playFullVideo ?? true;
    const startTime = item.startTimeSeconds ?? 0;
    const endTime = item.endTimeSeconds ?? 0;

    // Set start time
    if (!playFullVideo && startTime > 0) {
      video.currentTime = startTime;
    }

    // Monitor playback for end time
    const handleTimeUpdate = () => {
      if (!playFullVideo && endTime > startTime && video.currentTime >= endTime) {
        video.pause();
        if (onVideoEnd) {
          onVideoEnd();
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.play();

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [item.playFullVideo, item.startTimeSeconds, item.endTimeSeconds, onVideoEnd]);

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
    </div>
  );
}
