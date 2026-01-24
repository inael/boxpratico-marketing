import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getUserById, updateUser, deleteUser } from '@/lib/database';
import { requirePermission, AuthenticatedUser, forbiddenResponse } from '@/lib/auth-utils';
import { User, Role } from '@/types';

// Tipo para membro da equipe (resposta da API)
interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: Role | string;
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt?: string;
  invitedAt?: string;
  createdAt: string;
  isInvite: boolean;
}

// GET /api/team - Listar membros da equipe do tenant
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission('users:read');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    // Buscar parâmetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // active, inactive, pending
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    // Buscar todos os usuários
    let users = await getUsers();

    // Filtrar por tenant/account (se não for admin global)
    if (!currentUser.isAdmin && currentUser.accountId) {
      users = users.filter(u => u.accountId === currentUser.accountId || u.tenantId === currentUser.accountId);
    }

    // Filtrar por status
    if (status === 'active') {
      users = users.filter(u => u.isActive && u.emailVerified !== false);
    } else if (status === 'inactive') {
      users = users.filter(u => !u.isActive);
    } else if (status === 'pending') {
      users = users.filter(u => u.isActive && u.emailVerified === false);
    }

    // Filtrar por role
    if (role) {
      users = users.filter(u => u.role === role);
    }

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        u =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
      );
    }

    // Mapear para formato de resposta
    const members: TeamMember[] = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      role: u.role,
      status: !u.isActive ? 'inactive' : u.emailVerified === false ? 'pending' : 'active',
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      isInvite: false,
    }));

    // Stats
    const allUsers = await getUsers();
    const tenantUsers = currentUser.isAdmin
      ? allUsers
      : allUsers.filter(u => u.accountId === currentUser.accountId || u.tenantId === currentUser.accountId);

    const stats = {
      total: tenantUsers.length,
      active: tenantUsers.filter(u => u.isActive && u.emailVerified !== false).length,
      pending: tenantUsers.filter(u => u.isActive && u.emailVerified === false).length,
      inactive: tenantUsers.filter(u => !u.isActive).length,
    };

    return NextResponse.json({
      members,
      stats,
    });
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar membros da equipe' },
      { status: 500 }
    );
  }
}

// PATCH /api/team - Atualizar membro
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requirePermission('users:update');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const body = await request.json();
    const { id, role, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar membro
    const member = await getUserById(id);
    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pertence ao mesmo tenant
    if (!currentUser.isAdmin && member.accountId !== currentUser.accountId && member.tenantId !== currentUser.accountId) {
      return forbiddenResponse('Você não pode editar este membro');
    }

    // Não pode editar a si mesmo (exceto admin)
    if (member.id === currentUser.id && !currentUser.isAdmin) {
      return forbiddenResponse('Você não pode editar seu próprio perfil por aqui');
    }

    // Atualizar
    const updates: Partial<User> = {};
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await updateUser(id, updates);

    return NextResponse.json({
      success: true,
      member: updated,
    });
  } catch (error) {
    console.error('Failed to update team member:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar membro' },
      { status: 500 }
    );
  }
}

// DELETE /api/team - Remover membro
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePermission('users:delete');
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do membro é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar membro
    const member = await getUserById(id);
    if (!member) {
      return NextResponse.json(
        { error: 'Membro não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pertence ao mesmo tenant
    if (!currentUser.isAdmin && member.accountId !== currentUser.accountId && member.tenantId !== currentUser.accountId) {
      return forbiddenResponse('Você não pode remover este membro');
    }

    // Não pode remover a si mesmo
    if (member.id === currentUser.id) {
      return forbiddenResponse('Você não pode remover a si mesmo');
    }

    // Remover
    await deleteUser(id);

    return NextResponse.json({
      success: true,
      message: 'Membro removido com sucesso',
    });
  } catch (error) {
    console.error('Failed to delete team member:', error);
    return NextResponse.json(
      { error: 'Falha ao remover membro' },
      { status: 500 }
    );
  }
}
