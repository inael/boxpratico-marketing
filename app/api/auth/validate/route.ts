import { NextRequest, NextResponse } from 'next/server';
import { getSettingsData } from '@/app/api/settings/route';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    console.log('[Auth Validate] Received login attempt for:', username);

    if (!username || !password) {
      console.log('[Auth Validate] Missing username or password');
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    // Get settings to validate credentials
    const settings = await getSettingsData();
    const { username: validUsername, password: validPassword } = settings.auth;

    console.log('[Auth Validate] Expected username:', validUsername);
    console.log('[Auth Validate] Credentials match:', username === validUsername && password === validPassword);

    // Check credentials
    if (username === validUsername && password === validPassword) {
      console.log('[Auth Validate] Login successful for:', username);
      return NextResponse.json({ valid: true, username });
    }

    console.log('[Auth Validate] Login failed - credentials mismatch');
    return NextResponse.json({ valid: false }, { status: 401 });
  } catch (error) {
    console.error('[Auth Validate] Error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}
