'use client';

import { useState, useEffect } from 'react';
import { MediaItem } from '@/types';

interface ClockSlideProps {
  item: MediaItem;
  onTimeUpdate?: (time: number) => void;
}

export default function ClockSlide({ item, onTimeUpdate }: ClockSlideProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdown, setCountdown] = useState(item.durationSeconds || 15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Countdown para mudança de slide
  useEffect(() => {
    const duration = item.durationSeconds || 15;
    setCountdown(duration);

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1;
        if (onTimeUpdate) {
          onTimeUpdate(Math.max(0, newValue));
        }
        return Math.max(0, newValue);
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [item.durationSeconds, onTimeUpdate]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Extrair configurações do sourceUrl (pode ser JSON)
  let config = {
    title: 'Hora Certa',
    bgColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#F59E0B',
    showSeconds: true,
    showDate: true,
  };

  try {
    if (item.sourceUrl && item.sourceUrl.startsWith('{')) {
      config = { ...config, ...JSON.parse(item.sourceUrl) };
    }
  } catch (e) {
    // Usar configuração padrão
  }

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center"
      style={{ backgroundColor: config.bgColor }}
    >
      {/* Logo ou título */}
      <div className="mb-8">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-20 object-contain"
          />
        ) : (
          <h2
            className="text-3xl font-bold"
            style={{ color: config.accentColor }}
          >
            {config.title}
          </h2>
        )}
      </div>

      {/* Relógio grande */}
      <div
        className="text-[180px] font-bold leading-none tracking-tight"
        style={{ color: config.textColor }}
      >
        {formatTime(currentTime).slice(0, 5)}
      </div>

      {/* Segundos */}
      {config.showSeconds && (
        <div
          className="text-7xl font-light mt-4"
          style={{ color: config.accentColor }}
        >
          :{formatTime(currentTime).slice(6, 8)}
        </div>
      )}

      {/* Data */}
      {config.showDate && (
        <div
          className="text-4xl mt-12 capitalize"
          style={{ color: config.textColor, opacity: 0.7 }}
        >
          {formatDate(currentTime)}
        </div>
      )}

      {/* Decoração animada */}
      <div className="absolute bottom-0 left-0 right-0 h-2" style={{ backgroundColor: config.accentColor }}>
        <div
          className="h-full bg-white/30 animate-pulse"
          style={{ width: '30%' }}
        />
      </div>
    </div>
  );
}
