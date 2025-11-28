'use client';

import { NewsItem } from '@/types';

interface NewsSlideProps {
  news: NewsItem;
}

export default function NewsSlide({ news }: NewsSlideProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900 p-16">
      <div className="max-w-6xl">
        <div className="mb-8">
          <span className="inline-block bg-red-600 text-white px-6 py-2 text-2xl font-bold uppercase">
            Breaking News
          </span>
        </div>
        <h2 className="text-white text-6xl font-bold mb-8 leading-tight">
          {news.title}
        </h2>
        <div className="flex items-center text-white/80 text-xl">
          <span className="mr-4">{news.source}</span>
          {news.publishedAt && (
            <>
              <span className="mr-4">•</span>
              <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
