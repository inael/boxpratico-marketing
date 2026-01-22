import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, updateUser } from '@/lib/database';
import bcrypt from 'bcryptjs';

// API interna para verificar credenciais
// NÃO exponha publicamente - apenas para uso interno do NextAuth
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Conta desativada' }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Conta usa login social' }, { status: 400 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // Atualizar último login
    await updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Retornar dados do usuário (sem password)
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isAdmin: user.isAdmin,
      accountId: user.accountId,
      allowedTerminals: user.allowedTerminals,
      allowedAdvertisers: user.allowedAdvertisers,
      restrictContent: user.restrictContent,
    });
  } catch (error) {
    console.error('[Auth Verify] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
