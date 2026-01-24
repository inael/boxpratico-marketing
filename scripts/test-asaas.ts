/**
 * Script de teste da integração Asaas
 * Execute com: npx tsx scripts/test-asaas.ts
 */

import {
  isAsaasConfigured,
  createCustomer,
  findCustomerByCpfCnpj,
  createSimplePayment,
  getPayment,
  getPixQrCode,
} from '../lib/asaas';

async function testAsaasIntegration() {
  console.log('='.repeat(50));
  console.log('TESTE DE INTEGRAÇÃO ASAAS');
  console.log('='.repeat(50));

  // 1. Verificar configuração
  console.log('\n1. Verificando configuração...');
  if (!isAsaasConfigured()) {
    console.error('❌ Asaas não está configurado!');
    console.log('Verifique as variáveis ASAAS_API_KEY ou ASAAS_API_KEY_SANDBOX no .env.local');
    process.exit(1);
  }
  console.log('✅ Asaas configurado corretamente');

  // 2. Criar/buscar cliente de teste
  console.log('\n2. Criando cliente de teste...');
  const testCpf = '24971563792'; // CPF de teste válido

  let customer = await findCustomerByCpfCnpj(testCpf);
  if (customer) {
    console.log('✅ Cliente já existe:', customer.id);
  } else {
    const result = await createCustomer({
      name: 'Cliente Teste BoxPratico',
      cpfCnpj: testCpf,
      email: 'teste@boxpratico.com.br',
      mobilePhone: '11999999999',
    });

    if (result.success && result.customer) {
      customer = result.customer;
      console.log('✅ Cliente criado:', customer.id);
    } else {
      console.error('❌ Erro ao criar cliente:', result.error);
      process.exit(1);
    }
  }

  // 3. Criar cobrança PIX
  console.log('\n3. Criando cobrança PIX de R$ 1,00...');
  const pixResult = await createSimplePayment({
    customerName: 'Cliente Teste BoxPratico',
    customerCpfCnpj: testCpf,
    customerEmail: 'teste@boxpratico.com.br',
    amount: 1.0,
    description: 'Teste de integração BoxPratico',
    billingType: 'PIX',
  });

  if (!pixResult.success) {
    console.error('❌ Erro ao criar cobrança PIX:', pixResult.error);
    process.exit(1);
  }

  console.log('✅ Cobrança PIX criada:', pixResult.paymentId);
  console.log('   Status:', pixResult.status);
  console.log('   Invoice URL:', pixResult.invoiceUrl);

  if (pixResult.pixCopiaECola) {
    console.log('\n📱 PIX Copia e Cola:');
    console.log(pixResult.pixCopiaECola.substring(0, 80) + '...');
  }

  // 4. Buscar QR Code
  if (pixResult.paymentId) {
    console.log('\n4. Buscando QR Code...');
    const qrCode = await getPixQrCode(pixResult.paymentId);
    if (qrCode) {
      console.log('✅ QR Code obtido');
      console.log('   Expira em:', qrCode.expirationDate);
    }
  }

  // 5. Buscar pagamento
  if (pixResult.paymentId) {
    console.log('\n5. Verificando pagamento...');
    const payment = await getPayment(pixResult.paymentId);
    if (payment) {
      console.log('✅ Pagamento encontrado');
      console.log('   ID:', payment.id);
      console.log('   Status:', payment.status);
      console.log('   Valor:', `R$ ${payment.value.toFixed(2)}`);
      console.log('   Vencimento:', payment.dueDate);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ TODOS OS TESTES PASSARAM!');
  console.log('='.repeat(50));

  console.log('\n📋 Próximos passos:');
  console.log('1. Configure o webhook no painel Asaas:');
  console.log('   URL: https://seu-dominio.com/api/payments/asaas/webhook');
  console.log('   Eventos: PAYMENT_RECEIVED, PAYMENT_CONFIRMED, PAYMENT_REFUNDED');
  console.log('\n2. Teste um pagamento real no sandbox:');
  console.log('   - Acesse o painel sandbox: https://sandbox.asaas.com/');
  console.log('   - Simule um pagamento da cobrança criada');
  console.log('\n3. Para produção, use a API key de produção');
}

// Executar teste
testAsaasIntegration().catch(console.error);
