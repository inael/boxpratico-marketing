'use client';

import Image from 'next/image';
import { MediaItem } from '@/types';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface ImageSlideProps {
  item: MediaItem;
  onTimeUpdate?: (timeLeft: number) => void;
}

export default function ImageSlide({ item, onTimeUpdate }: ImageSlideProps) {
  const duration = item.durationSeconds || 10;
  const [timeLeft, setTimeLeft] = useState(duration);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  // Keep ref updated
  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // Notify parent of time updates
  useEffect(() => {
    if (onTimeUpdateRef.current) {
      onTimeUpdateRef.current(timeLeft);
    }
  }, [timeLeft]);

  useEffect(() => {
    setTimeLeft(duration);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev <= 1 ? 0 : prev - 1;
        if (newTime === 0) {
          clearInterval(interval);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, item]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      <motion.div
        className="relative w-full h-full"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Image
          src={item.sourceUrl}
          alt={item.title}
          fill
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  );
}
