import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth, requireAdmin, AuthenticatedUser } from '@/lib/auth-utils';
import { Subscription, SubscriptionStatus } from '@/types';
import { calculateOperatorPrice, isMercadoPagoConfigured } from '@/lib/mercadopago';
import {
  setEntity,
  getEntity,
  getAllEntities,
  deleteEntity,
} from '@/lib/redis';

const SUBSCRIPTIONS_KEY = 'subscriptions';

// GET /api/subscriptions - Listar assinaturas
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    let subscriptions = await getAllEntities<Subscription>(SUBSCRIPTIONS_KEY);

    // Filtrar por conta
    if (currentUser.isAdmin && accountId) {
      subscriptions = subscriptions.filter(s => s.accountId === accountId);
    } else if (!currentUser.isAdmin) {
      subscriptions = subscriptions.filter(s => s.accountId === currentUser.accountId);
    }

    // Ordenar por data (mais recente primeiro)
    subscriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error);
    return NextResponse.json({ error: 'Erro ao buscar assinaturas' }, { status: 500 });
  }
}

// POST /api/subscriptions - Criar nova assinatura
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const body = await request.json();

    const {
      monitorCount,      // Número de monitores
      pricePerMonitor,   // Preço por monitor (opcional, default: R$35)
      billingDay,        // Dia de cobrança (1-28)
      accountId: bodyAccountId,
    } = body;

    // Determinar accountId
    const accountId = currentUser.isAdmin && bodyAccountId
      ? bodyAccountId
      : currentUser.accountId;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 400 }
      );
    }

    if (!monitorCount || monitorCount < 1) {
      return NextResponse.json(
        { error: 'Número de monitores inválido' },
        { status: 400 }
      );
    }

    // Verificar se já existe assinatura ativa para esta conta
    const existingSubscriptions = await getAllEntities<Subscription>(SUBSCRIPTIONS_KEY);
    const activeSubscription = existingSubscriptions.find(
      s => s.accountId === accountId && (s.status === 'authorized' || s.status === 'pending')
    );

    if (activeSubscription) {
      return NextResponse.json(
        { error: 'Já existe uma assinatura ativa para esta conta' },
        { status: 400 }
      );
    }

    // Calcular valores
    const unitPrice = pricePerMonitor || 35;
    const pricing = calculateOperatorPrice(monitorCount, unitPrice);

    // Criar assinatura
    const subscriptionId = uuidv4();
    const now = new Date();

    // Calcular próxima cobrança
    const nextBillingDate = new Date();
    const day = billingDay || now.getDate();
    nextBillingDate.setDate(Math.min(day, 28));
    if (nextBillingDate <= now) {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    const subscription: Subscription = {
      id: subscriptionId,
      accountId,
      userId: currentUser.id,
      planType: 'operator_monthly',
      amount: pricing.amount,
      currency: 'BRL',
      quantity: monitorCount,
      pricePerUnit: unitPrice,
      status: 'pending',
      billingDay: Math.min(day, 28),
      nextBillingDate: nextBillingDate.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await setEntity(SUBSCRIPTIONS_KEY, subscriptionId, subscription);

    return NextResponse.json({
      success: true,
      subscription,
      message: 'Assinatura criada. Realize o primeiro pagamento para ativar.',
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create subscription:', error);
    return NextResponse.json(
      { error: 'Erro ao criar assinatura' },
      { status: 500 }
    );
  }
}

// PATCH /api/subscriptions - Atualizar assinatura (admin)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { id, status, monitorCount, pricePerMonitor } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const subscription = await getEntity<Subscription>(SUBSCRIPTIONS_KEY, id);
    if (!subscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 });
    }

    // Atualizar campos
    const updates: Partial<Subscription> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updates.status = status as SubscriptionStatus;
      if (status === 'cancelled') {
        updates.cancelledAt = new Date().toISOString();
      }
    }

    if (monitorCount) {
      updates.quantity = monitorCount;
      updates.amount = monitorCount * (pricePerMonitor || subscription.pricePerUnit);
    }

    if (pricePerMonitor) {
      updates.pricePerUnit = pricePerMonitor;
      updates.amount = (monitorCount || subscription.quantity) * pricePerMonitor;
    }

    const updatedSubscription = { ...subscription, ...updates };
    await setEntity(SUBSCRIPTIONS_KEY, id, updatedSubscription);

    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar assinatura' },
      { status: 500 }
    );
  }
}
