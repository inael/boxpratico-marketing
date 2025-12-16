import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isRedisConfigured, getEntity, setEntity } from '@/lib/redis';

const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');
const SETTINGS_KEY = 'app_settings';

// Get default settings with environment variable fallbacks
function getDefaultSettings() {
  return {
    rss: {
      url: 'https://www.gazetadopovo.com.br/feed/rss/brasil.xml',
      imageTag: 'enclosure.url',
      titleTag: 'title',
      descriptionTag: 'description'
    },
    auth: {
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    },
    whatsapp: {
      notificationsEnabled: true
    },
    evolution: {
      apiUrl: '',
      apiKey: '',
      instanceName: ''
    }
  };
}

// Export function to get settings from other modules
export async function getSettingsData() {
  const defaultSettings = getDefaultSettings();
  try {
    if (isRedisConfigured()) {
      const settings = await getEntity<typeof defaultSettings>('settings', SETTINGS_KEY);
      if (settings) {
        return {
          ...defaultSettings,
          ...settings,
          whatsapp: { ...defaultSettings.whatsapp, ...settings.whatsapp },
          evolution: { ...defaultSettings.evolution, ...settings.evolution }
        };
      }
      return defaultSettings;
    }

    const data = await fs.readFile(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    return {
      ...defaultSettings,
      ...settings,
      whatsapp: { ...defaultSettings.whatsapp, ...settings.whatsapp },
      evolution: { ...defaultSettings.evolution, ...settings.evolution }
    };
  } catch {
    return defaultSettings;
  }
}

// Get Evolution API config (from settings or env vars)
export async function getEvolutionConfig() {
  const settings = await getSettingsData();

  // Settings override environment variables if set
  return {
    apiUrl: settings.evolution?.apiUrl || process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    apiKey: settings.evolution?.apiKey || process.env.EVOLUTION_API_KEY || '',
    instanceName: settings.evolution?.instanceName || process.env.EVOLUTION_INSTANCE || 'boxpratico'
  };
}

export async function GET() {
  const defaultSettings = getDefaultSettings();
  try {
    if (isRedisConfigured()) {
      const settings = await getEntity<typeof defaultSettings>('settings', SETTINGS_KEY);
      if (settings) {
        return NextResponse.json({
          ...defaultSettings,
          ...settings,
          whatsapp: { ...defaultSettings.whatsapp, ...settings.whatsapp },
          evolution: { ...defaultSettings.evolution, ...settings.evolution }
        });
      }
      return NextResponse.json(defaultSettings);
    }

    const data = await fs.readFile(settingsFilePath, 'utf-8');
    const settings = JSON.parse(data);
    // Merge with defaults to ensure all fields exist
    return NextResponse.json({
      ...defaultSettings,
      ...settings,
      whatsapp: { ...defaultSettings.whatsapp, ...settings.whatsapp },
      evolution: { ...defaultSettings.evolution, ...settings.evolution }
    });
  } catch (error) {
    console.error('Failed to read settings:', error);
    return NextResponse.json(defaultSettings);
  }
}

export async function PUT(request: NextRequest) {
  const defaultSettings = getDefaultSettings();
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.rss || !body.auth) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure evolution config exists
    const settingsToSave = {
      ...body,
      evolution: body.evolution || defaultSettings.evolution
    };

    if (isRedisConfigured()) {
      await setEntity('settings', SETTINGS_KEY, settingsToSave);
    } else {
      await fs.writeFile(settingsFilePath, JSON.stringify(settingsToSave, null, 2));
    }

    return NextResponse.json(settingsToSave);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
