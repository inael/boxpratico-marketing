'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemName } from '@/contexts/SettingsContext';

interface WelcomeHeroProps {
  videoSrc?: string;
  title?: string;
  subtitle?: string;
  onDismiss?: () => void;
}

export default function WelcomeHero({
  videoSrc = '/videos/welcome.mp4',
  title: propTitle,
  subtitle = 'Assista este vídeo rápido para conhecer a plataforma',
  onDismiss,
}: WelcomeHeroProps) {
  const { isFirstLogin, dismissFirstLogin, user } = useAuth();
  const systemName = useSystemName();
  const title = propTitle || `Bem-vindo ao ${systemName}!`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Não mostrar se não for primeiro login
  if (!isFirstLogin) return null;

  const handleDismiss = () => {
    dismissFirstLogin();
    onDismiss?.();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = clickPosition * videoRef.current.duration;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <p className="text-white/80 text-sm mt-1">{subtitle}</p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Container */}
          <div
            className="relative aspect-video bg-gray-900 cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
          >
            {videoError ? (
              /* Fallback quando não há vídeo */
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8">
                <div className="w-32 h-32 mb-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white ml-2" />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Olá, {user?.name?.split(' ')[0] || 'usuário'}!
                </h3>
                <p className="text-center text-white/80 max-w-md mb-6">
                  Estamos preparando um vídeo especial de boas-vindas para você.
                  Enquanto isso, explore a plataforma e descubra todas as funcionalidades!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss();
                    }}
                    className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Começar a explorar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-cover"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onError={handleVideoError}
                  onEnded={handleVideoEnded}
                  playsInline
                />

                {/* Play/Pause Overlay */}
                <AnimatePresence>
                  {(!isPlaying || showControls) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/30"
                    >
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                      >
                        {isPlaying ? (
                          <Pause className="w-10 h-10 text-gray-800" />
                        ) : (
                          <Play className="w-10 h-10 text-gray-800 ml-1" />
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Video Controls */}
                <AnimatePresence>
                  {showControls && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Progress Bar */}
                      <div
                        className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer mb-3 group"
                        onClick={handleProgressClick}
                      >
                        <div
                          className="h-full bg-indigo-500 rounded-full relative transition-all"
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={togglePlay}
                            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={toggleMute}
                            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                          >
                            {isMuted ? (
                              <VolumeX className="w-5 h-5" />
                            ) : (
                              <Volume2 className="w-5 h-5" />
                            )}
                          </button>
                          <span className="text-white text-sm">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                          </span>
                        </div>
                        <button
                          onClick={handleFullscreen}
                          className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Você pode assistir este vídeo novamente em Configurações &gt; Ajuda
              </p>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Pular introdução
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
