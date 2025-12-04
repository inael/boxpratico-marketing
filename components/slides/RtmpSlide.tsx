'use client';

import { MediaItem } from '@/types';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Hls from 'hls.js';

interface RtmpSlideProps {
  item: MediaItem;
  onTimeUpdate?: (timeLeft: number) => void;
}

export default function RtmpSlide({ item, onTimeUpdate }: RtmpSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const duration = item.durationSeconds || 30;
  const [timeLeft, setTimeLeft] = useState(duration);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Limpar HLS anterior se existir
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const sourceUrl = item.sourceUrl;

    // Verificar se é HLS (.m3u8)
    if (sourceUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        // Usar hls.js para browsers que não suportam HLS nativamente
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          liveSyncDuration: 3,
          liveMaxLatencyDuration: 5,
        });

        hls.loadSource(sourceUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(err => {
            console.error('Error playing HLS stream:', err);
            setError('Erro ao reproduzir stream');
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error, trying to recover...');
                hls.startLoad();
                setError('Erro de rede ao carregar stream');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error, trying to recover...');
                hls.recoverMediaError();
                setError('Erro de mídia, tentando recuperar...');
                break;
              default:
                console.error('Fatal error, cannot recover');
                hls.destroy();
                setError('Erro fatal ao reproduzir stream');
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari suporta HLS nativamente
        video.src = sourceUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(err => {
            console.error('Error playing HLS stream:', err);
            setError('Erro ao reproduzir stream');
          });
        });
      } else {
        setError('Seu navegador não suporta reprodução HLS');
      }
    } else {
      // Fallback para outros tipos de stream
      video.src = sourceUrl;
      video.play().catch(err => {
        console.error('Error playing stream:', err);
        setError('Erro ao reproduzir stream');
      });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item.sourceUrl]);

  const title = item.title || 'Sorria, você está sendo filmado';
  const description = item.description ||
    'Ambiente monitorado. Lembre-se: furtar é crime segundo o artigo 155 do Código Penal, com pena de reclusão de um a quatro anos e multa.';

  const thumbnailUrl = item.thumbnailUrl || '/camera-warning.svg';

  return (
    <div className="w-full h-screen flex flex-col bg-black">
      {/* Top: Title and Description Section with Image */}
      <div className="bg-white px-12 py-8">
        <div className="flex items-start gap-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-3">
              {title}
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="relative w-64 h-48 border-4 border-gray-900 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={thumbnailUrl}
                alt="Aviso de câmera"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Video Stream Section */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-white text-center">
            <p className="text-2xl mb-2">⚠️ {error}</p>
            <p className="text-gray-400">Verifique se o stream está ativo</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        )}
      </div>
    </div>
  );
}
