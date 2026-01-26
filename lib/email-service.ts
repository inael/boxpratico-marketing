/**
 * Email Service - Resend + SMTP (Mailpit) Integration
 *
 * Suporta dois providers:
 * - Resend (produção): API moderna, boa entregabilidade
 * - SMTP/Mailpit (desenvolvimento/VPS): Para testes ou self-hosted
 *
 * Configuração via env:
 * - EMAIL_PROVIDER=resend|smtp (default: resend)
 * - RESEND_API_KEY=re_xxx (para Resend)
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS (para SMTP)
 */

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// ============================================
// CONFIGURAÇÃO
// ============================================

type EmailProvider = 'resend' | 'smtp';

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'resend') as EmailProvider;
const FROM_EMAIL = process.env.EMAIL_FROM || 'BoxPratico <noreply@boxpratico.com.br>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://boxpratico.com.br';

// Resend client (lazy init)
let resendClient: Resend | null = null;
function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// SMTP transporter (lazy init)
let smtpTransporter: nodemailer.Transporter | null = null;
function getSmtpTransporter(): nodemailer.Transporter {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '25'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
      // Para Mailpit em desenvolvimento, ignorar certificado
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  }
  return smtpTransporter;
}

// ============================================
// TIPOS
// ============================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: EmailProvider;
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface WelcomeEmailData {
  to: string;
  name: string;
  tempPassword: string;
  role: string;
  tenantName?: string;
}

export interface PasswordResetEmailData {
  to: string;
  name: string;
  resetToken: string;
  expiresIn: string;
}

export interface ContractSignedEmailData {
  to: string;
  name: string;
  contractName: string;
  advertiserName: string;
  totalValue: number;
  startDate: string;
  endDate: string;
}

export interface CommissionNotificationEmailData {
  to: string;
  name: string;
  amount: number;
  contractName: string;
  referenceMonth: string;
}

export interface SettlementEmailData {
  to: string;
  name: string;
  amount: number;
  referenceMonth: string;
  totalPlays: number;
  beneficiaryType: 'LOCATION_OWNER' | 'SALES_AGENT';
}

// ============================================
// FUNÇÃO CORE DE ENVIO
// ============================================

/**
 * Envia email usando o provider configurado
 */
async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const { to, subject, html, from = FROM_EMAIL } = options;

  try {
    if (EMAIL_PROVIDER === 'smtp') {
      // Usar SMTP (Mailpit ou outro)
      const transporter = getSmtpTransporter();
      const result = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      return {
        success: true,
        messageId: result.messageId,
        provider: 'smtp',
      };
    } else {
      // Usar Resend (default)
      const resend = getResendClient();
      const result = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      return {
        success: true,
        messageId: result.data?.id,
        provider: 'resend',
      };
    }
  } catch (error) {
    console.error(`Erro ao enviar email (${EMAIL_PROVIDER}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      provider: EMAIL_PROVIDER,
    };
  }
}

// ============================================
// TEMPLATES DE EMAIL
// ============================================

/**
 * Envia email de boas-vindas para novo usuário
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  const { to, name, tempPassword, role, tenantName } = data;

  const roleLabels: Record<string, string> = {
    TENANT_ADMIN: 'Administrador',
    TENANT_MANAGER: 'Gerente',
    SALES_AGENT: 'Vendedor',
    LOCATION_OWNER: 'Parceiro de Local',
    ADVERTISER: 'Anunciante',
    OPERATOR: 'Operador',
  };

  const roleLabel = roleLabels[role] || role;

  return sendEmail({
    to,
    subject: 'Bem-vindo ao BoxPratico!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .credentials { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .credentials p { margin: 8px 0; }
          .credentials strong { color: #111827; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bem-vindo ao BoxPratico!</h1>
          </div>
          <div class="content">
            <p>Ola <strong>${name}</strong>,</p>
            <p>Sua conta foi criada com sucesso${tenantName ? ` na empresa <strong>${tenantName}</strong>` : ''}.</p>
            <p>Voce foi cadastrado como <strong>${roleLabel}</strong>.</p>

            <div class="credentials">
              <p><strong>Email:</strong> ${to}</p>
              <p><strong>Senha temporaria:</strong> ${tempPassword}</p>
            </div>

            <p>Por seguranca, recomendamos que voce altere sua senha no primeiro acesso.</p>

            <a href="${APP_URL}/login" class="button">Acessar Plataforma</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BoxPratico. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Envia email de recuperacao de senha
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailResult> {
  const { to, name, resetToken, expiresIn } = data;
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  return sendEmail({
    to,
    subject: 'Recuperacao de Senha - BoxPratico',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #111827; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Recuperacao de Senha</h1>
          </div>
          <div class="content">
            <p>Ola <strong>${name}</strong>,</p>
            <p>Recebemos uma solicitacao para redefinir sua senha.</p>
            <p>Clique no botao abaixo para criar uma nova senha:</p>

            <a href="${resetUrl}" class="button">Redefinir Senha</a>

            <div class="warning">
              <p><strong>Este link expira em ${expiresIn}.</strong></p>
              <p>Se voce nao solicitou esta alteracao, ignore este email.</p>
            </div>

            <p style="font-size: 12px; color: #6b7280;">
              Se o botao nao funcionar, copie e cole este link no navegador:<br>
              <code>${resetUrl}</code>
            </p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BoxPratico. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Envia notificacao de contrato assinado para o anunciante
 */
export async function sendContractSignedEmail(data: ContractSignedEmailData): Promise<EmailResult> {
  const { to, name, contractName, advertiserName, totalValue, startDate, endDate } = data;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  return sendEmail({
    to,
    subject: `Contrato Assinado - ${contractName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .details p { margin: 8px 0; }
          .highlight { font-size: 24px; color: #10B981; font-weight: bold; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Contrato Assinado!</h1>
          </div>
          <div class="content">
            <p>Ola <strong>${name}</strong>,</p>
            <p>Parabens! O contrato <strong>${contractName}</strong> foi assinado com sucesso.</p>

            <div class="details">
              <p><strong>Anunciante:</strong> ${advertiserName}</p>
              <p><strong>Valor Total:</strong> <span class="highlight">${formatCurrency(totalValue)}</span></p>
              <p><strong>Periodo:</strong> ${formatDate(startDate)} a ${formatDate(endDate)}</p>
            </div>

            <p>Sua campanha esta sendo preparada. Voce recebera um email assim que ela estiver pronta para veiculacao.</p>

            <a href="${APP_URL}/admin?tab=campaigns" class="button">Ver Minhas Campanhas</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BoxPratico. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Envia notificacao de comissao para vendedor
 */
export async function sendCommissionNotificationEmail(
  data: CommissionNotificationEmailData
): Promise<EmailResult> {
  const { to, name, amount, contractName, referenceMonth } = data;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return sendEmail({
    to,
    subject: `Nova Comissao - ${formatCurrency(amount)}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .amount { text-align: center; padding: 30px; }
          .amount .value { font-size: 48px; color: #10B981; font-weight: bold; }
          .details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nova Comissao!</h1>
          </div>
          <div class="content">
            <p>Ola <strong>${name}</strong>,</p>
            <p>Voce tem uma nova comissao registrada!</p>

            <div class="amount">
              <p style="margin: 0; color: #6b7280;">Valor da Comissao</p>
              <p class="value">${formatCurrency(amount)}</p>
            </div>

            <div class="details">
              <p><strong>Contrato:</strong> ${contractName}</p>
              <p><strong>Referencia:</strong> ${referenceMonth}</p>
              <p><strong>Status:</strong> Pendente de Pagamento</p>
            </div>

            <a href="${APP_URL}/admin?tab=financial" class="button">Ver Minhas Comissoes</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BoxPratico. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

/**
 * Envia notificacao de fechamento mensal (Settlement)
 */
export async function sendSettlementEmail(data: SettlementEmailData): Promise<EmailResult> {
  const { to, name, amount, referenceMonth, totalPlays, beneficiaryType } = data;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const typeLabels = {
    LOCATION_OWNER: 'Parceiro de Local',
    SALES_AGENT: 'Vendedor',
  };

  return sendEmail({
    to,
    subject: `Fechamento Mensal - ${referenceMonth}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .amount { text-align: center; padding: 30px; background: #f0fdf4; border-radius: 8px; margin: 20px 0; }
          .amount .value { font-size: 48px; color: #10B981; font-weight: bold; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat { flex: 1; background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
          .stat .number { font-size: 24px; font-weight: bold; color: #111827; }
          .stat .label { font-size: 12px; color: #6b7280; }
          .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fechamento Mensal</h1>
          </div>
          <div class="content">
            <p>Ola <strong>${name}</strong>,</p>
            <p>O fechamento de <strong>${referenceMonth}</strong> esta disponivel.</p>

            <div class="amount">
              <p style="margin: 0; color: #6b7280;">Valor a Receber</p>
              <p class="value">${formatCurrency(amount)}</p>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
              <tr>
                <td width="50%" style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                  <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 0;">${totalPlays.toLocaleString('pt-BR')}</p>
                  <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">Total de Exibicoes</p>
                </td>
                <td width="10"></td>
                <td width="50%" style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
                  <p style="font-size: 18px; font-weight: bold; color: #111827; margin: 0;">${typeLabels[beneficiaryType]}</p>
                  <p style="font-size: 12px; color: #6b7280; margin: 5px 0 0 0;">Tipo de Comissao</p>
                </td>
              </tr>
            </table>

            <p>O pagamento sera processado conforme os termos do seu contrato.</p>

            <a href="${APP_URL}/admin?tab=financial" class="button">Ver Detalhes</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} BoxPratico. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ============================================
// HELPERS
// ============================================

/**
 * Verifica se o servico de email esta configurado
 */
export function isEmailServiceConfigured(): boolean {
  if (EMAIL_PROVIDER === 'smtp') {
    return !!process.env.SMTP_HOST;
  }
  return !!process.env.RESEND_API_KEY;
}

/**
 * Retorna o provider atual
 */
export function getEmailProvider(): EmailProvider {
  return EMAIL_PROVIDER;
}

/**
 * Envia email de teste
 */
export async function sendTestEmail(to: string): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Teste - BoxPratico Email Service',
    html: `
      <h1>Email de Teste</h1>
      <p>Se voce esta vendo esta mensagem, o servico de email esta funcionando corretamente!</p>
      <p><strong>Provider:</strong> ${EMAIL_PROVIDER}</p>
      <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    `,
  });
}

/**
 * Verifica conexao SMTP (util para health check)
 */
export async function verifySmtpConnection(): Promise<boolean> {
  if (EMAIL_PROVIDER !== 'smtp') {
    return true; // Resend nao precisa verificar
  }

  try {
    const transporter = getSmtpTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexao SMTP:', error);
    return false;
  }
}
