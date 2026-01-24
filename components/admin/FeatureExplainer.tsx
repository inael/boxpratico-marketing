'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface FeatureExplainerProps {
  videoSrc?: string;
  title: string;
  description?: string;
  poster?: string;
  compact?: boolean;
}

export default function FeatureExplainer({
  videoSrc = '/videos/feature.mp4',
  title,
  description,
  poster,
  compact = false,
}: FeatureExplainerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (hasEnded) {
        videoRef.current.currentTime = 0;
        setHasEnded(false);
      }
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
      setHasEnded(false);
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
    setHasEnded(true);
    setShowControls(true);
  };

  const restart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setHasEnded(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 ${compact ? '' : 'p-4'}`}>
      {/* Header */}
      {!compact && (
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
      )}

      {/* Video Container */}
      <div
        className={`relative ${compact ? 'aspect-video' : 'aspect-video rounded-lg'} bg-gray-900 cursor-pointer overflow-hidden`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        onClick={togglePlay}
      >
        {videoError ? (
          /* Fallback quando não há vídeo */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
            <div className="w-16 h-16 mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
            <h4 className="text-lg font-semibold mb-1">{title}</h4>
            <p className="text-center text-white/80 text-sm">
              Vídeo explicativo em breve
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onEnded={handleVideoEnded}
              playsInline
            />

            {/* Play/Pause/Replay Overlay */}
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
                      hasEnded ? restart() : togglePlay();
                    }}
                    className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                  >
                    {hasEnded ? (
                      <RotateCcw className="w-7 h-7 text-gray-800" />
                    ) : isPlaying ? (
                      <Pause className="w-7 h-7 text-gray-800" />
                    ) : (
                      <Play className="w-7 h-7 text-gray-800 ml-1" />
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Controls */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Progress Bar */}
                  <div
                    className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-2 group"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-indigo-400 rounded-full relative transition-all"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlay}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={toggleMute}
                        className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-white text-xs">
                        {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                      </span>
                    </div>
                    <button
                      onClick={handleFullscreen}
                      className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Compact Title */}
      {compact && (
        <div className="p-3 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      )}
    </div>
  );
}
