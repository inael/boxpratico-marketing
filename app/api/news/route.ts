import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NewsItem } from '@/types';

const parser = new Parser({
  customFields: {
    item: ['enclosure', 'image', 'description']
  }
});

export async function GET() {
  try {
    const feed = await parser.parseURL('https://www.gazetadopovo.com.br/feed/rss/brasil.xml');
    
    const newsItems: NewsItem[] = feed.items.slice(0, 10).map((item: any) => {
      let imageUrl = '';
      
      if (item.image && item.image.url) {
        imageUrl = item.image.url;
      } else if (item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
      }

      let description = item.contentSnippet || item.description || '';
      
      description = description.replace(/<[^>]*>/g, '').trim();

      return {
        title: item.title || 'Untitled',
        link: item.link || '#',
        description: description.substring(0, 200),
        imageUrl,
        source: 'Gazeta do Povo',
        publishedAt: item.pubDate || new Date().toISOString(),
      };
    });

    return NextResponse.json(newsItems);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
