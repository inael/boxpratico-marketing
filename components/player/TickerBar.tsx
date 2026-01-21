'use client';

import { useState, useEffect, useRef } from 'react';
import { Monitor } from '@/types';

interface TickerBarProps {
  monitor: Monitor | null;
}

export default function TickerBar({ monitor }: TickerBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(20);

  // Se o ticker não está habilitado ou não tem texto, não renderiza nada
  if (!monitor?.footerEnabled || !monitor?.footerText) {
    return null;
  }

  // Definir velocidade baseada na configuração
  const getSpeedMultiplier = (speed?: 'slow' | 'normal' | 'fast') => {
    switch (speed) {
      case 'slow': return 1.5;
      case 'fast': return 0.6;
      default: return 1;
    }
  };

  // Cores do ticker
  const bgColor = monitor.footerBgColor || '#000000';
  const textColor = monitor.footerTextColor || '#F59E0B';
  const speedMultiplier = getSpeedMultiplier(monitor.footerSpeed);

  // Calcular duração da animação baseada no tamanho do texto
  useEffect(() => {
    if (textRef.current && containerRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = containerRef.current.offsetWidth;
      // Base: 10 pixels por segundo, ajustado pela velocidade
      const baseSpeed = 100 * speedMultiplier;
      const duration = Math.max(10, (textWidth + containerWidth) / baseSpeed);
      setAnimationDuration(duration);
    }
  }, [monitor.footerText, speedMultiplier]);

  // Duplicar o texto para efeito de loop contínuo
  const repeatedText = `${monitor.footerText}     •     ${monitor.footerText}     •     `;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden z-40"
      style={{ backgroundColor: bgColor }}
    >
      <div className="relative w-full h-full flex items-center">
        <div
          ref={textRef}
          className="absolute whitespace-nowrap animate-ticker"
          style={{
            color: textColor,
            animationDuration: `${animationDuration}s`,
          }}
        >
          <span className="text-xl font-medium tracking-wide px-4">
            {repeatedText}{repeatedText}
          </span>
        </div>
      </div>

      {/* Gradiente nas bordas para efeito visual suave */}
      <div
        className="absolute inset-y-0 left-0 w-12 pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${bgColor}, transparent)`,
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-12 pointer-events-none"
        style={{
          background: `linear-gradient(to left, ${bgColor}, transparent)`,
        }}
      />

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: ticker linear infinite;
        }
      `}</style>
    </div>
  );
}
