import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserByEmail, createUser } from '@/lib/database';
import { requirePermission, AuthenticatedUser, forbiddenResponse } from '@/lib/auth-utils';
import { Role } from '@/types';
import bcrypt from 'bcryptjs';

// POST /api/team/invite - Convidar novo membro
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission('users:create');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    const body = await request.json();
    const { email, name, phone, role, password } = body;

    // Validações
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar role
    const validRoles: Role[] = ['TENANT_ADMIN', 'TENANT_MANAGER', 'OPERATOR'];
    const memberRole = (role as Role) || 'OPERATOR';
    if (!validRoles.includes(memberRole)) {
      return NextResponse.json(
        { error: 'Papel inválido' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha (se fornecida) ou gerar temporária
    let passwordHash: string | undefined;
    const tempPassword = password || Math.random().toString(36).slice(-8);
    passwordHash = await bcrypt.hash(tempPassword, 12);

    // Criar usuário com convite pendente
    const newUser = await createUser({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      role: memberRole,
      isAdmin: false,
      isActive: true,
      emailVerified: !password, // Se não definiu senha, está pendente
      accountId: currentUser.accountId,
      tenantId: currentUser.accountId,
    });

    // TODO: Enviar email de convite se não definiu senha
    // if (!password) {
    //   await sendInviteEmail(newUser, tempPassword);
    // }

    return NextResponse.json({
      success: true,
      member: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      message: password ? 'Membro criado com sucesso' : 'Convite enviado com sucesso',
      // Remover em produção - apenas para debug
      ...(process.env.NODE_ENV === 'development' && !password ? { tempPassword } : {}),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create invite:', error);
    return NextResponse.json(
      { error: 'Falha ao convidar membro' },
      { status: 500 }
    );
  }
}
