import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, updateUser } from '@/lib/database';

// API interna para processar login Google
// NÃO exponha publicamente - apenas para uso interno do NextAuth
export async function POST(request: NextRequest) {
  try {
    const { email, name, image, providerId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // Verificar se conta está ativa
      if (!existingUser.isActive) {
        return NextResponse.json({ blocked: true });
      }

      // Atualizar dados do Google
      await updateUser(existingUser.id, {
        provider: 'google',
        providerId,
        avatarUrl: image || existingUser.avatarUrl,
        emailVerified: true,
        lastLoginAt: new Date().toISOString(),
      });

      return NextResponse.json({
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        avatarUrl: image || existingUser.avatarUrl,
        role: existingUser.role,
        isAdmin: existingUser.isAdmin,
        accountId: existingUser.accountId,
        allowedTerminals: existingUser.allowedTerminals,
        allowedAdvertisers: existingUser.allowedAdvertisers,
        restrictContent: existingUser.restrictContent,
      });
    }

    // Criar novo usuário via Google
    const newUser = await createUser({
      name: name || 'Usuário',
      email,
      avatarUrl: image || undefined,
      provider: 'google',
      providerId,
      emailVerified: true,
      role: 'viewer',
      isAdmin: false,
      isActive: true,
    });

    return NextResponse.json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatarUrl: newUser.avatarUrl,
      role: newUser.role,
      isAdmin: newUser.isAdmin,
      accountId: newUser.accountId,
      allowedTerminals: newUser.allowedTerminals,
      allowedAdvertisers: newUser.allowedAdvertisers,
      restrictContent: newUser.restrictContent,
      isNew: true,
    });
  } catch (error) {
    console.error('[Auth Google] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
