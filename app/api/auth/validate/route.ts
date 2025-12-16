import { NextRequest, NextResponse } from 'next/server';
import { getSettingsData } from '@/app/api/settings/route';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Get settings to validate credentials
    const settings = await getSettingsData();
    const { username: validUsername, password: validPassword } = settings.auth;

    // Check credentials
    if (username === validUsername && password === validPassword) {
      return NextResponse.json({ valid: true, username });
    }

    return NextResponse.json({ valid: false }, { status: 401 });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}
