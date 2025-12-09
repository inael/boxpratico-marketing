import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');

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
  },
  whatsapp: {
    notificationsEnabled: true
  }
};

// Export function to get settings from other modules
export async function getSettingsData() {
  try {
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    return {
      ...defaultSettings,
      ...settings,
      whatsapp: { ...defaultSettings.whatsapp, ...settings.whatsapp }
    };
  } catch {
    return defaultSettings;
  }
}

export async function GET() {
  try {
    const data = await fs.readFile(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    // Merge with defaults to ensure all fields exist
    return NextResponse.json({
      ...defaultSettings,
      ...settings,
      whatsapp: { ...defaultSettings.whatsapp, ...settings.whatsapp }
    });
  } catch (error) {
    console.error('Failed to read settings:', error);
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
