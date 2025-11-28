'use client';

import Image from 'next/image';
import { MediaItem } from '@/types';

interface ImageSlideProps {
  item: MediaItem;
}

export default function ImageSlide({ item }: ImageSlideProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="relative w-full h-full">
        <Image
          src={item.sourceUrl}
          alt={item.title}
          fill
          className="object-contain"
          priority
        />
      </div>
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
          <h2 className="text-white text-4xl font-bold">{item.title}</h2>
          {item.description && (
            <p className="text-white/90 text-2xl mt-2">{item.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
