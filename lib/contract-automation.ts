/**
 * Contract Automation Service
 *
 * Automação que ocorre quando um contrato é assinado:
 * 1. Cria usuário/login para o anunciante
 * 2. Define permissões baseadas no tipo de gestão (SELF_SERVICE ou AGENCY_MANAGED)
 * 3. Cria campanha em modo DRAFT vinculada às telas selecionadas
 * 4. Notifica time de operação se necessário
 */

import { createUser, getUserByEmail, createCampaign } from '@/lib/database';
import { Contract, ContractManagementType, Role, Campaign } from '@/types';
import bcrypt from 'bcryptjs';

// ============================================
// INTERFACES
// ============================================

export interface ContractSignedInput {
  contract: Contract;
  advertiserEmail: string;
  advertiserName: string;
  advertiserPhone?: string;
  managementType: ContractManagementType;
  selectedTerminalIds: string[];
  tenantId: string;
}

export interface ContractAutomationResult {
  success: boolean;
  userId?: string;
  campaignId?: string;
  tempPassword?: string;
  notifications?: string[];
  errors?: string[];
}

// ============================================
// FUNÇÕES PRINCIPAIS
// ============================================

/**
 * Executa automação completa ao assinar contrato
 */
export async function onContractSigned(
  input: ContractSignedInput
): Promise<ContractAutomationResult> {
  const result: ContractAutomationResult = {
    success: true,
    notifications: [],
    errors: [],
  };

  try {
    // 1. Criar ou recuperar usuário do anunciante
    const userResult = await createAdvertiserUser(input);
    if (userResult.error) {
      result.errors?.push(userResult.error);
    } else {
      result.userId = userResult.userId;
      result.tempPassword = userResult.tempPassword;
    }

    // 2. Criar campanha em modo DRAFT
    const campaignResult = await createDraftCampaign(input);
    if (campaignResult.error) {
      result.errors?.push(campaignResult.error);
    } else {
      result.campaignId = campaignResult.campaignId;
    }

    // 3. Gerar notificações
    if (input.managementType === 'AGENCY_MANAGED') {
      result.notifications?.push(
        `Nova campanha para gestão: ${input.contract.id} - ${input.advertiserName}`
      );
      result.notifications?.push(
        'Aguardando upload de arquivos de mídia pelo time de Operação'
      );
    } else {
      result.notifications?.push(
        `Cliente ${input.advertiserName} pode acessar o sistema para subir suas mídias`
      );
    }

    // Verificar se teve erros
    if (result.errors && result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido na automação'],
    };
  }
}

/**
 * Cria usuário para o anunciante (se não existir)
 */
async function createAdvertiserUser(
  input: ContractSignedInput
): Promise<{ userId?: string; tempPassword?: string; error?: string }> {
  try {
    const { advertiserEmail, advertiserName, advertiserPhone, managementType, tenantId } = input;

    // Verificar se já existe
    const existingUser = await getUserByEmail(advertiserEmail.toLowerCase());
    if (existingUser) {
      return { userId: existingUser.id };
    }

    // Gerar senha temporária
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Definir role baseado no tipo de gestão
    // SELF_SERVICE: pode gerenciar mídia e ver campanhas
    // AGENCY_MANAGED: apenas visualização (proof of play)
    const role: Role = managementType === 'SELF_SERVICE' ? 'ADVERTISER' : 'ADVERTISER';

    // Criar usuário
    const newUser = await createUser({
      name: advertiserName,
      email: advertiserEmail.toLowerCase(),
      passwordHash,
      phone: advertiserPhone,
      role,
      isAdmin: false,
      tenantId,
      // Marcar como pendente para verificação de email
      emailVerified: false,
      // Restringir conteúdo se for AGENCY_MANAGED
      restrictContent: managementType === 'AGENCY_MANAGED',
    });

    return {
      userId: newUser.id,
      tempPassword,
    };
  } catch (error) {
    return {
      error: `Erro ao criar usuário: ${error instanceof Error ? error.message : 'desconhecido'}`,
    };
  }
}

/**
 * Cria campanha em modo DRAFT vinculada ao contrato
 */
async function createDraftCampaign(
  input: ContractSignedInput
): Promise<{ campaignId?: string; error?: string }> {
  try {
    const { contract, advertiserName, selectedTerminalIds, tenantId } = input;

    // Calcular datas baseado no contrato
    const startDate = contract.startDate || new Date().toISOString().split('T')[0];
    const endDate = contract.endDate || calculateEndDate(startDate, contract.durationMonths || 1);

    // Criar campanha
    const campaign = await createCampaign({
      name: `Campanha - ${advertiserName}`,
      description: `Campanha criada automaticamente do contrato #${contract.id}`,
      advertiserId: contract.advertiserId,
      contractId: contract.id,
      status: 'DRAFT',
      startDate,
      endDate,
      // Configuração de exibição
      playsPerDay: 48, // Default: 2 por hora
      priority: 5, // Normal
      // Terminais selecionados
      targetTerminalIds: selectedTerminalIds,
      // Metadata
      tenantId,
      managementType: input.managementType,
    });

    return { campaignId: campaign.id };
  } catch (error) {
    return {
      error: `Erro ao criar campanha: ${error instanceof Error ? error.message : 'desconhecido'}`,
    };
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Gera senha temporária segura
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Calcula data de término baseado na duração em meses
 */
function calculateEndDate(startDate: string, durationMonths: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + durationMonths);
  return date.toISOString().split('T')[0];
}

/**
 * Envia email de boas-vindas para o anunciante
 * TODO: Integrar com serviço de email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string,
  managementType: ContractManagementType
): Promise<void> {
  // TODO: Implementar envio de email
  console.log(`[Contract Automation] Email de boas-vindas para ${email}`);
  console.log(`  Nome: ${name}`);
  console.log(`  Tipo: ${managementType}`);
  console.log(`  Senha temporária: ${tempPassword}`);
}

/**
 * Notifica time de operação sobre nova campanha gerenciada
 * TODO: Integrar com sistema de notificações
 */
export async function notifyOperationsTeam(
  contractId: string,
  advertiserName: string,
  tenantId: string
): Promise<void> {
  // TODO: Implementar notificação
  console.log(`[Contract Automation] Notificação para Operação`);
  console.log(`  Contrato: ${contractId}`);
  console.log(`  Anunciante: ${advertiserName}`);
  console.log(`  Tenant: ${tenantId}`);
}
