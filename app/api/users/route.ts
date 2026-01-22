import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, getUserByEmail } from '@/lib/database';
import { User } from '@/types';
import bcrypt from 'bcryptjs';
import { requirePermission, filterByAccount, AuthenticatedUser } from '@/lib/auth-utils';

export async function GET() {
  try {
    // Verificar permissão
    const authResult = await requirePermission('users:read');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    let users = await getUsers();

    // Filtrar por conta (multi-tenant)
    users = filterByAccount(users as (User & { accountId?: string })[], currentUser);

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
    // Verificar permissão
    const authResult = await requirePermission('users:create');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
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

    // Hash password with bcrypt
    let passwordHash: string | undefined;
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 12);
    }

    // Não permitir criar admin se não for admin
    const role = body.role || 'operator';
    const isAdmin = currentUser.isAdmin && (body.isAdmin || role === 'admin');

    const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
      name: body.name,
      email: body.email.toLowerCase(),
      passwordHash,
      avatarUrl: body.avatarUrl,
      provider: body.password ? 'credentials' : undefined,
      emailVerified: false,
      accountId: body.accountId || currentUser.accountId, // Herdar accountId
      role,
      isAdmin,
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
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
