import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser, deleteUser } from '@/lib/database';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password hash from response
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email.toLowerCase();
    if (body.password) updates.passwordHash = hashPassword(body.password);
    if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;
    if (body.role !== undefined) {
      updates.role = body.role;
      updates.isAdmin = body.role === 'admin';
    }
    if (body.isAdmin !== undefined) updates.isAdmin = body.isAdmin;
    if (body.allowedTerminals !== undefined) updates.allowedTerminals = body.allowedTerminals;
    if (body.allowedAdvertisers !== undefined) updates.allowedAdvertisers = body.allowedAdvertisers;
    if (body.restrictContent !== undefined) updates.restrictContent = body.restrictContent;
    if (body.timezone !== undefined) updates.timezone = body.timezone;
    if (body.showAvatarInMenu !== undefined) updates.showAvatarInMenu = body.showAvatarInMenu;
    if (body.emailNotifications !== undefined) updates.emailNotifications = body.emailNotifications;
    if (body.emailFrequency !== undefined) updates.emailFrequency = body.emailFrequency;
    if (body.whatsappNotifications !== undefined) updates.whatsappNotifications = body.whatsappNotifications;
    if (body.whatsappNumber !== undefined) updates.whatsappNumber = body.whatsappNumber;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.lastLoginAt !== undefined) updates.lastLoginAt = body.lastLoginAt;
    if (body.termsAcceptedAt !== undefined) updates.termsAcceptedAt = body.termsAcceptedAt;

    const user = await updateUser(id, updates);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove password hash from response
    const { passwordHash, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const success = await deleteUser(id);

    if (!success) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
