import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/database';

// API interna para buscar dados do usuário
// NÃO exponha publicamente - apenas para uso interno do NextAuth
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

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
      isActive: user.isActive,
    });
  } catch (error) {
    console.error('[Auth User] Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
