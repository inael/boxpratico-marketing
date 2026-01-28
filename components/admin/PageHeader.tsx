'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ChevronRight, ExternalLink } from 'lucide-react';
import FeatureExplainer from './FeatureExplainer';

// Textos de ajuda padrao por pagina
export const PAGE_HELP_TEXTS: Record<string, { title: string; description: string }> = {
  companies: {
    title: 'Meus Clientes',
    description: 'Cadastre e gerencie seus clientes (anunciantes). Aqui voce vincula empresas a contratos e campanhas de publicidade.',
  },
  contracts: {
    title: 'Contratos',
    description: 'Crie e gerencie contratos de publicidade. Defina valores, prazos, terminais e acompanhe o status de cada negociacao.',
  },
  campaigns: {
    title: 'Campanhas',
    description: 'Configure campanhas publicitarias com midias, horarios de exibicao e terminais. Monitore o desempenho em tempo real.',
  },
  monitors: {
    title: 'Minhas Telas',
    description: 'Cadastre e monitore suas telas de exibicao. Veja status online/offline, configure playlists e gerencie a operacao.',
  },
  playlists: {
    title: 'Grades de Programacao',
    description: 'Monte grades de programacao com a sequencia de midias para cada tela. Defina horarios e duracao de cada conteudo.',
  },
  library: {
    title: 'Biblioteca de Midia',
    description: 'Faca upload de imagens, videos, configure feeds RSS e cameras RTMP. Organize sua biblioteca de conteudo.',
  },
  financial: {
    title: 'Cobrancas',
    description: 'Acompanhe cobrancas, pagamentos e inadimplencia. Gere boletos, envie lembretes e visualize o fluxo de caixa.',
  },
  receivables: {
    title: 'Recebiveis',
    description: 'Visualize recebiveis futuros e projecao de faturamento. Acompanhe valores a receber por periodo.',
  },
  'sales-commissions': {
    title: 'Comissoes de Venda',
    description: 'Acompanhe comissoes de vendas. Veja valores pendentes, pagos e historico de ganhos por contrato.',
  },
  affiliate: {
    title: 'Indicar Amigo',
    description: 'Compartilhe seu link de indicacao e ganhe comissoes. Acompanhe suas indicacoes e beneficios.',
  },
  'affiliate-earnings': {
    title: 'Extrato Afiliado',
    description: 'Veja o extrato de comissoes de afiliado. Acompanhe ganhos, saques e historico completo.',
  },
  team: {
    title: 'Minha Equipe',
    description: 'Gerencie sua equipe. Adicione usuarios, defina permissoes e acompanhe atividades.',
  },
  accounts: {
    title: 'Contas',
    description: 'Gerencie contas e tenants. Visualize planos, status e configuracoes de cada conta.',
  },
  settings: {
    title: 'Configuracoes',
    description: 'Configure parametros do sistema: precos, comissoes, integracoes, notificacoes e preferencias.',
  },
  reports: {
    title: 'Relatorios',
    description: 'Visualize relatorios de desempenho, audiencia, financeiro e operacional do seu negocio.',
  },
  tenants: {
    title: 'Tenants / Afiliados',
    description: 'Gerencie tenants e afiliados da plataforma. Ative, suspenda e acompanhe cada operacao.',
  },
  'subscription-plans': {
    title: 'Planos de Assinatura',
    description: 'Configure planos de assinatura. Defina limites, precos e recursos de cada plano.',
  },
  'global-users': {
    title: 'Usuarios Globais',
    description: 'Gerencie usuarios com acesso global a plataforma. Super admins e acessos especiais.',
  },
  simulator: {
    title: 'Simulador de Orcamento',
    description: 'Simule orcamentos de campanhas. Selecione terminais, configure parametros e veja o valor estimado.',
  },
};

interface Breadcrumb {
  label: string;
  href?: string;
}

interface HelpLink {
  label: string;
  href: string;
  external?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  // Help Drawer Props
  helpTitle?: string;
  helpDescription?: string;
  helpVideoSrc?: string;
  helpLinks?: HelpLink[];
  helpContent?: ReactNode;
  mascotImage?: string;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  helpTitle,
  helpDescription,
  helpVideoSrc,
  helpLinks,
  helpContent,
  mascotImage = '/images/mascot-help.png',
}: PageHeaderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [mascotError, setMascotError] = useState(false);

  const hasHelp = helpTitle || helpDescription || helpVideoSrc || helpLinks || helpContent;

  return (
    <>
      <div className="mb-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="w-3 h-3" />}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-indigo-600 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 font-medium' : ''}>
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {hasHelp && (
                <button
                  onClick={() => setIsHelpOpen(true)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Precisa de ajuda?"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              )}
            </div>
            {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
          </div>

          {/* Actions */}
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </div>

      {/* Help Drawer */}
      <AnimatePresence>
        {isHelpOpen && hasHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setIsHelpOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Ajuda</h2>
                </div>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Mascot */}
                {!mascotError && (
                  <div className="flex justify-center mb-6">
                    <img
                      src={mascotImage}
                      alt="Mascote BoxPratico"
                      className="w-32 h-32 object-contain"
                      onError={() => setMascotError(true)}
                    />
                  </div>
                )}

                {/* Fallback mascot placeholder */}
                {mascotError && (
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <HelpCircle className="w-12 h-12 text-indigo-400" />
                    </div>
                  </div>
                )}

                {/* Help Title & Description */}
                {helpTitle && (
                  <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{helpTitle}</h3>
                )}
                {helpDescription && (
                  <p className="text-gray-600 text-center mb-6">{helpDescription}</p>
                )}

                {/* Video Explainer */}
                {helpVideoSrc && (
                  <div className="mb-6">
                    <FeatureExplainer
                      videoSrc={helpVideoSrc}
                      title="Como funciona"
                      compact
                    />
                  </div>
                )}

                {/* Custom Help Content */}
                {helpContent && <div className="mb-6">{helpContent}</div>}

                {/* Help Links */}
                {helpLinks && helpLinks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                      Links Uteis
                    </h4>
                    {helpLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                      >
                        <span className="text-gray-700 group-hover:text-indigo-600">{link.label}</span>
                        {link.external ? (
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500 text-center">
                  Ainda precisa de ajuda?{' '}
                  <a href="/admin/suporte" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Fale conosco
                  </a>
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
