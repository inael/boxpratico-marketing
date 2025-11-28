'use client';

import Image from 'next/image';
import { MediaItem } from '@/types';
import { motion } from 'framer-motion';

interface ImageSlideProps {
  item: MediaItem;
}

export default function ImageSlide({ item }: ImageSlideProps) {
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
      
      {(item.title || item.description) && (
        <motion.div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-8 lg:p-12"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {item.title && (
            <h2 className="text-white text-3xl lg:text-4xl font-bold mb-2">{item.title}</h2>
          )}
          {item.description && (
            <p className="text-white/90 text-xl lg:text-2xl">{item.description}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
