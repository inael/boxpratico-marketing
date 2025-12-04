import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');

export async function GET() {
  try {
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to read settings:', error);
    // Return default settings if file doesn't exist
    const defaultSettings = {
      rss: {
        url: 'https://www.gazetadopovo.com.br/feed/rss/brasil.xml',
        imageTag: 'enclosure.url',
        titleTag: 'title',
        descriptionTag: 'description'
      },
      auth: {
        username: 'admin',
        password: 'admin123'
      }
    };
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.rss || !body.auth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await fs.writeFile(settingsFilePath, JSON.stringify(body, null, 2));
    return NextResponse.json(body);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
