import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, getUserByEmail } from '@/lib/database';
import { User } from '@/types';
import crypto from 'crypto';

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function GET() {
  try {
    const users = await getUsers();
    // Remove password hash from response
    const safeUsers = users.map(({ passwordHash, ...user }) => user);
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await getUserByEmail(body.email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash: body.password ? hashPassword(body.password) : undefined,
      avatarUrl: body.avatarUrl,
      role: body.role || 'operator',
      isAdmin: body.isAdmin || body.role === 'admin',
      allowedTerminals: body.allowedTerminals,
      allowedAdvertisers: body.allowedAdvertisers,
      restrictContent: body.restrictContent || false,
      timezone: body.timezone || 'America/Sao_Paulo',
      showAvatarInMenu: body.showAvatarInMenu !== false,
      emailNotifications: body.emailNotifications || false,
      emailFrequency: body.emailFrequency || 'weekly',
      whatsappNotifications: body.whatsappNotifications || false,
      whatsappNumber: body.whatsappNumber,
      isActive: body.isActive !== false,
    };

    const user = await createUser(userData);
    // Remove password hash from response
    const { passwordHash, ...safeUser } = user;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
