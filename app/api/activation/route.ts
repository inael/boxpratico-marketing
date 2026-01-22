import { NextRequest, NextResponse } from 'next/server';
import {
  createActivationCode,
  getActivationCodeByCode,
  getActivationCodeByDeviceId,
  isActivationCodeValid,
  activateCode,
  createTrialAccount,
  getAccountByEmail,
  getAccountById,
  cleanupExpiredActivationCodes,
  createCondominium,
} from '@/lib/database';

// GET /api/activation - Buscar ou criar código de ativação para um dispositivo
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const deviceId = searchParams.get('deviceId');
    const code = searchParams.get('code');
    const cleanup = searchParams.get('cleanup');

    // Limpar códigos expirados
    if (cleanup === 'true') {
      const count = await cleanupExpiredActivationCodes();
      return NextResponse.json({ message: `${count} códigos expirados limpos` });
    }

    // Verificar se código é válido
    if (code) {
      const isValid = await isActivationCodeValid(code);
      const activationCode = await getActivationCodeByCode(code);
      return NextResponse.json({
        valid: isValid,
        code: activationCode,
      });
    }

    // Buscar ou criar código para dispositivo
    if (!deviceId) {
      return NextResponse.json(
        { error: 'deviceId é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um código válido para este dispositivo
    let existingCode = await getActivationCodeByDeviceId(deviceId);

    if (existingCode) {
      // Se já foi ativado, retornar informações
      if (existingCode.status === 'activated') {
        return NextResponse.json({
          status: 'activated',
          code: existingCode,
        });
      }

      // Se ainda é válido (não expirou), retornar o mesmo código
      if (existingCode.status === 'pending' && new Date() < new Date(existingCode.expiresAt)) {
        return NextResponse.json({
          status: 'pending',
          code: existingCode,
        });
      }
    }

    // Criar novo código
    const newCode = await createActivationCode(deviceId);

    return NextResponse.json({
      status: 'pending',
      code: newCode,
    });
  } catch (error) {
    console.error('Error handling activation:', error);
    return NextResponse.json(
      { error: 'Falha ao processar ativação' },
      { status: 500 }
    );
  }
}

// POST /api/activation - Ativar código com conta existente ou criar trial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, accountId, createTrial, trialData, monitorName, condominiumId } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Código de ativação é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se código é válido
    const isValid = await isActivationCodeValid(code);
    if (!isValid) {
      const activationCode = await getActivationCodeByCode(code);
      if (!activationCode) {
        return NextResponse.json(
          { error: 'Código inválido' },
          { status: 400 }
        );
      }
      if (activationCode.status === 'activated') {
        return NextResponse.json(
          { error: 'Este código já foi utilizado' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Este código expirou' },
        { status: 400 }
      );
    }

    let targetAccountId = accountId;
    let targetCondominiumId = condominiumId;

    // Criar conta trial se necessário
    if (createTrial && trialData) {
      // Verificar se email já existe
      const existingAccount = await getAccountByEmail(trialData.email);
      if (existingAccount) {
        return NextResponse.json(
          { error: 'Já existe uma conta com este email. Faça login para continuar.' },
          { status: 400 }
        );
      }

      const newAccount = await createTrialAccount({
        name: trialData.name,
        ownerName: trialData.ownerName,
        email: trialData.email,
        phone: trialData.phone,
        trialDays: trialData.trialDays || 7,
      });

      targetAccountId = newAccount.id;

      // Criar condomínio padrão para a conta trial
      const defaultCondominium = await createCondominium({
        name: trialData.name,
        slug: `${trialData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        address: '',
        city: '',
        state: '',
        isActive: true,
        accountId: newAccount.id,
      });

      targetCondominiumId = defaultCondominium.id;
    }

    if (!targetAccountId) {
      return NextResponse.json(
        { error: 'accountId ou createTrial com trialData é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se conta existe
    const account = await getAccountById(targetAccountId);
    if (!account) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 404 }
      );
    }

    // Se não tem condominiumId ainda, criar um condomínio padrão
    if (!targetCondominiumId) {
      const defaultCondominium = await createCondominium({
        name: account.name,
        slug: `${account.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        address: '',
        city: '',
        state: '',
        isActive: true,
        accountId: account.id,
      });

      targetCondominiumId = defaultCondominium.id;
    }

    // Ativar código e criar monitor
    const result = await activateCode(code, targetAccountId, {
      name: monitorName || 'Terminal Principal',
      condominiumId: targetCondominiumId,
    });

    return NextResponse.json({
      success: true,
      account,
      activationCode: result?.activationCode,
      monitor: result?.monitor,
    });
  } catch (error) {
    console.error('Error activating code:', error);
    const message = error instanceof Error ? error.message : 'Falha ao ativar código';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
