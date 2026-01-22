import { NextRequest, NextResponse } from 'next/server';
import {
  getAccounts,
  getAccountByEmail,
  createAccount,
  createTrialAccount,
} from '@/lib/database';
import { ACCOUNT_PLAN_LIMITS } from '@/types';

// GET /api/accounts - Listar contas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    // Buscar por email
    if (email) {
      const account = await getAccountByEmail(email);
      if (!account) {
        return NextResponse.json(
          { error: 'Conta não encontrada' },
          { status: 404 }
        );
      }
      return NextResponse.json(account);
    }

    // Listar todas
    let accounts = await getAccounts();

    // Filtrar por status
    if (status) {
      accounts = accounts.filter(a => a.status === status);
    }

    // Filtrar por plano
    if (plan) {
      accounts = accounts.filter(a => a.plan === plan);
    }

    // Ordenar por data de criação (mais recentes primeiro)
    accounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar contas' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Criar nova conta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, ownerName, email, phone, plan, trialDays } = body;

    if (!name || !ownerName || !email) {
      return NextResponse.json(
        { error: 'name, ownerName e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingAccount = await getAccountByEmail(email);
    if (existingAccount) {
      return NextResponse.json(
        { error: 'Já existe uma conta com este email' },
        { status: 400 }
      );
    }

    // Se for trial, usar função específica
    if (plan === 'trial' || !plan) {
      const account = await createTrialAccount({
        name,
        ownerName,
        email,
        phone,
        trialDays: trialDays || 7,
      });
      return NextResponse.json(account, { status: 201 });
    }

    // Criar conta com plano específico
    const limits = ACCOUNT_PLAN_LIMITS[plan as keyof typeof ACCOUNT_PLAN_LIMITS] || ACCOUNT_PLAN_LIMITS.basic;

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const account = await createAccount({
      name,
      slug: `${slug}-${Date.now()}`,
      ownerName,
      email,
      phone,
      plan,
      maxMonitors: limits.monitors,
      maxStorageMB: limits.storageMB,
      status: 'active',
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    const message = error instanceof Error ? error.message : 'Falha ao criar conta';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
