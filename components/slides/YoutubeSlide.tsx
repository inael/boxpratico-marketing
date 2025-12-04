'use client';

import { MediaItem } from '@/types';
import { useEffect, useRef, useState } from 'react';

interface YoutubeSlideProps {
  item: MediaItem;
  onTimeUpdate?: (timeLeft: number) => void;
}

function getYoutubeEmbedUrl(url: string, playFullVideo: boolean, startTime?: number, endTime?: number): string {
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';

  let embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&showinfo=0&fs=0&iv_load_policy=3&disablekb=1&playsinline=1&enablejsapi=1`;

  // Add start and end time parameters if not playing full video
  if (!playFullVideo) {
    if (startTime !== undefined && startTime > 0) {
      embedUrl += `&start=${startTime}`;
    }
    if (endTime !== undefined && endTime > startTime!) {
      embedUrl += `&end=${endTime}`;
    }
  } else {
    // Loop only if playing full video
    embedUrl += `&loop=1&playlist=${videoId}`;
  }

  return embedUrl;
}

export default function YoutubeSlide({ item, onTimeUpdate }: YoutubeSlideProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playFullVideo = item.playFullVideo ?? true;
  const startTime = item.startTimeSeconds ?? 0;
  const endTime = item.endTimeSeconds ?? 0;

  const duration = item.durationSeconds || 10;
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    // Force play after a small delay to ensure iframe is loaded
    const timer = setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        // Try to send play command to YouTube iframe
        iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

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
  }, [duration, item, onTimeUpdate]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      <iframe
        ref={iframeRef}
        src={getYoutubeEmbedUrl(item.sourceUrl, playFullVideo, startTime, endTime)}
        className="w-full h-full pointer-events-none"
        allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
