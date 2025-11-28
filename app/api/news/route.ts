import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NewsItem } from '@/types';

const parser = new Parser();

export async function GET() {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    
    const newsItems: NewsItem[] = feed.items.slice(0, 10).map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '#',
      source: item.creator || item.source?.url || 'Unknown',
      publishedAt: item.pubDate || new Date().toISOString(),
    }));

    return NextResponse.json(newsItems);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
