'use client';

import { MediaItem } from '@/types';

interface PdfSlideProps {
  item: MediaItem;
}

export default function PdfSlide({ item }: PdfSlideProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-white">
      <iframe
        src={item.sourceUrl}
        className="w-full h-full border-0"
        title={item.title}
      />
    </div>
  );
}
