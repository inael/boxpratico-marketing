'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Monitor, Campaign } from '@/types';

interface PlayerPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitor: Monitor | null;
  campaign?: Campaign | null;
}

type PreviewSize = 'small' | 'medium' | 'large' | 'fullscreen';

export default function PlayerPreviewModal({
  isOpen,
  onClose,
  monitor,
  campaign,
}: PlayerPreviewModalProps) {
  const [previewSize, setPreviewSize] = useState<PreviewSize>('medium');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // URL do player
  const getPlayerUrl = () => {
    if (campaign) {
      return `/preview/${campaign.id}`;
    }
    if (monitor) {
      return `/monitor/${monitor.slug}`;
    }
    return '';
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('player-preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        iframe.requestFullscreen();
        setIsFullscreen(true);
      }
    }
  };

  const handleOpenInNewTab = () => {
    const url = getPlayerUrl();
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Listener para sair do fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Tamanhos do preview
  const getSizeClasses = () => {
    switch (previewSize) {
      case 'small':
        return 'w-[480px] h-[270px]'; // 16:9 small
      case 'medium':
        return 'w-[800px] h-[450px]'; // 16:9 medium
      case 'large':
        return 'w-[1280px] h-[720px]'; // 16:9 large
      case 'fullscreen':
        return 'w-full h-full';
      default:
        return 'w-[800px] h-[450px]';
    }
  };

  if (!isOpen) return null;

  const playerUrl = getPlayerUrl();
  const title = campaign ? campaign.name : monitor?.name || 'Preview';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-gray-900 rounded-2xl shadow-2xl overflow-hidden max-w-[95vw] max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <ComputerDesktopIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="text-xs text-gray-400">Player Web Preview</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botoes de tamanho */}
                <div className="flex bg-gray-700 rounded-lg p-0.5">
                  {(['small', 'medium', 'large'] as PreviewSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setPreviewSize(size)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        previewSize === size
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {size === 'small' ? 'P' : size === 'medium' ? 'M' : 'G'}
                    </button>
                  ))}
                </div>

                {/* Botao de atualizar */}
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Atualizar"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </button>

                {/* Botao de fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Tela cheia"
                >
                  {isFullscreen ? (
                    <ArrowsPointingInIcon className="w-5 h-5" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                  )}
                </button>

                {/* Botao de abrir em nova aba */}
                <button
                  onClick={handleOpenInNewTab}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="Abrir em nova aba"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>

                {/* Botao de fechar */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Player iframe */}
            <div className="p-4 flex items-center justify-center bg-gray-900">
              <div className={`relative bg-black rounded-lg overflow-hidden shadow-xl ${getSizeClasses()}`}>
                {playerUrl ? (
                  <iframe
                    id="player-preview-iframe"
                    key={refreshKey}
                    src={playerUrl}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <p>Nenhum player disponivel</p>
                  </div>
                )}

                {/* Borda simulando TV */}
                <div className="absolute inset-0 border-4 border-gray-800 rounded-lg pointer-events-none" />
              </div>
            </div>

            {/* Footer com informacoes */}
            <div className="px-4 py-3 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {monitor && (
                  <span>
                    Terminal: <span className="text-white">{monitor.name}</span>
                    {' • '}
                    Orientacao: <span className="text-white">{monitor.orientation === 'vertical' ? 'Vertical' : 'Horizontal'}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>URL:</span>
                <code className="px-2 py-1 bg-gray-700 rounded text-indigo-600 font-mono">
                  {playerUrl}
                </code>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
