'use client';

import { NewsItem } from '@/types';
import Image from 'next/image';

interface NewsSlideProps {
  news: NewsItem;
}

export default function NewsSlide({ news }: NewsSlideProps) {
  const hasImage = Boolean(news.imageUrl);
  
  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          backgroundSize: '60px 60px, 200px 200px'
        }}></div>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">
        {hasImage && (
          <div className="w-full lg:w-1/2 h-1/2 lg:h-full relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/50 z-10"></div>
            <Image
              src={news.imageUrl || ''}
              alt={news.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className={`flex-1 flex flex-col justify-center p-12 lg:p-16 ${hasImage ? '' : 'items-center text-center'}`}>
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-600 px-6 py-3 rounded-lg shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <span className="text-white font-bold text-xl uppercase tracking-wider">
                  Últimas Notícias
                </span>
              </div>
              <div className="text-white/80 text-lg font-medium">
                {news.source}
              </div>
            </div>
          </div>

          <h2 className={`text-white font-bold leading-tight mb-6 animate-slide-up ${hasImage ? 'text-5xl lg:text-6xl' : 'text-6xl lg:text-7xl'}`}>
            {news.title}
          </h2>

          {news.description && (
            <p className="text-white/90 text-2xl lg:text-3xl leading-relaxed mb-8 max-w-4xl animate-slide-up" style={{animationDelay: '0.1s'}}>
              {news.description}
            </p>
          )}

          {news.publishedAt && (
            <div className="flex items-center gap-3 text-white/70 text-lg animate-slide-up" style={{animationDelay: '0.2s'}}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {new Date(news.publishedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-blue-600 to-purple-600"></div>
    </div>
  );
}
