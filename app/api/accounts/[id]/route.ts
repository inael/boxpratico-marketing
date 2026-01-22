import { NextRequest, NextResponse } from 'next/server';
import {
  getAccountById,
  updateAccount,
  deleteAccount,
  isAccountTrialExpired,
} from '@/lib/database';
import { ACCOUNT_PLAN_LIMITS, AccountPlan } from '@/types';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/accounts/[id] - Buscar conta por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const account = await getAccountById(id);

    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se trial expirou
    if (account.plan === 'trial' && isAccountTrialExpired(account)) {
      // Atualizar status para expirado
      const updatedAccount = await updateAccount(id, { status: 'expired' });
      return NextResponse.json(updatedAccount);
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Falha ao buscar conta' },
      { status: 500 }
    );
  }
}

// PUT /api/accounts/[id] - Atualizar conta
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await getAccountById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Preparar atualizações
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.ownerName !== undefined) updates.ownerName = body.ownerName;
    if (body.email !== undefined) updates.email = body.email;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.status !== undefined) updates.status = body.status;

    // Mudança de plano
    if (body.plan !== undefined && body.plan !== existing.plan) {
      const limits = ACCOUNT_PLAN_LIMITS[body.plan as AccountPlan];
      if (limits) {
        updates.plan = body.plan;
        updates.maxMonitors = limits.monitors;
        updates.maxStorageMB = limits.storageMB;

        // Se mudou de trial para outro plano, limpar dados de trial
        if (existing.plan === 'trial' && body.plan !== 'trial') {
          updates.trialDays = undefined;
          updates.trialStartedAt = undefined;
          updates.trialExpiresAt = undefined;
          updates.status = 'active';
        }
      }
    }

    // Extensão de trial
    if (body.extendTrialDays !== undefined && existing.plan === 'trial') {
      const currentExpiry = existing.trialExpiresAt ? new Date(existing.trialExpiresAt) : new Date();
      currentExpiry.setDate(currentExpiry.getDate() + body.extendTrialDays);
      updates.trialExpiresAt = currentExpiry.toISOString();
      updates.trialDays = (existing.trialDays || 0) + body.extendTrialDays;
      updates.status = 'trial'; // Reativar se estava expirado
    }

    const updated = await updateAccount(id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Falha ao atualizar conta' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Deletar conta
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const existing = await getAccountById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    await deleteAccount(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Falha ao deletar conta' },
      { status: 500 }
    );
  }
}
