'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SettingTooltipProps {
  title: string;
  description: string;
  details?: string[];
  examples?: string[];
  affectedAreas?: string[];
}

export default function SettingTooltip({
  title,
  description,
  details,
  examples,
  affectedAreas,
}: SettingTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        title="Clique para mais informacoes"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-50 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 flex items-center justify-between border-b border-indigo-100">
                <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-600">{description}</p>

                {details && details.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Detalhes</p>
                    <ul className="space-y-1">
                      {details.map((detail, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-indigo-400 mt-1">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {examples && examples.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Exemplos</p>
                    <ul className="space-y-1">
                      {examples.map((example, index) => (
                        <li key={index} className="text-xs text-gray-700 font-mono">
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {affectedAreas && affectedAreas.length > 0 && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Reflete em</p>
                    <div className="flex flex-wrap gap-1">
                      {affectedAreas.map((area, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Pre-configured tooltips for common settings
export const SETTING_TOOLTIPS = {
  pricePerDisplayMonth: {
    title: 'Preco por Display/Mes',
    description: 'Valor base cobrado por cada tela/display por mes. Este valor e usado como referencia para calcular orcamentos.',
    details: [
      'Valor em Reais (BRL)',
      'Usado no calculo de orcamentos de campanhas',
      'Pode ser ajustado por multiplicadores de local',
    ],
    affectedAreas: ['Simulador', 'Orcamentos', 'Contratos'],
  },
  insertionsPerHour: {
    title: 'Insercoes por Hora',
    description: 'Quantidade de vezes que cada midia/anuncio sera exibido por hora na grade de programacao.',
    details: [
      'Valor padrao: 4 insercoes/hora',
      'Cada insercao = 1 play da midia',
      'Usado para calcular valor total de exibicoes',
    ],
    examples: ['4 insercoes × 12h = 48 plays/dia', '48 plays × 30 dias = 1.440 plays/mes'],
    affectedAreas: ['Grade de Programacao', 'Relatorios', 'Proof of Play'],
  },
  avgInsertionDurationSeconds: {
    title: 'Duracao Media da Insercao',
    description: 'Duracao padrao de cada midia/anuncio em segundos. Midias individuais podem ter duracoes diferentes.',
    details: [
      'Valor padrao: 15 segundos',
      'Midias podem ter duracao customizada',
      'Afeta calculo de tempo de grade',
    ],
    affectedAreas: ['Player', 'Grade de Programacao'],
  },
  operatingHoursPerDay: {
    title: 'Horas de Operacao/Dia',
    description: 'Quantidade de horas que as telas operam por dia em media. Usado para calcular valor mensal.',
    details: [
      'Valor padrao: 12 horas',
      'Multiplica pelas insercoes/hora',
      'Representa horario comercial tipico',
    ],
    affectedAreas: ['Simulador', 'Orcamentos', 'Relatorios'],
  },
  basePricePerPlay: {
    title: 'Preco Base por Play',
    description: 'Valor cobrado por cada exibicao (play) de 15 segundos. E o valor unitario usado para calcular campanhas.',
    details: [
      'Valor em Reais (BRL)',
      'Multiplicado pela duracao do slot',
      'Pode receber descontos por volume',
    ],
    examples: ['R$ 0,10 × 30s = R$ 0,20', 'R$ 0,10 × 1.440 plays = R$ 144/mes'],
    affectedAreas: ['Simulador', 'Contratos', 'Cobrancas'],
  },
  volumeDiscounts: {
    title: 'Descontos por Volume',
    description: 'Descontos automaticos aplicados quando o cliente contrata multiplas telas.',
    details: [
      'Configurado por faixas de quantidade',
      'Desconto progressivo',
      'Aplicado no valor total',
    ],
    examples: ['5-9 telas: 5% off', '10-19 telas: 10% off', '20+ telas: 15% off'],
    affectedAreas: ['Simulador', 'Orcamentos', 'Contratos'],
  },
  premiumMultipliers: {
    title: 'Multiplicadores Premium',
    description: 'Fatores que aumentam o preco em locais de alto trafego ou horarios nobres.',
    details: [
      'Multiplicador de trafego do local',
      'Multiplicador de horario (prime time)',
      'Aplicado sobre o preco base',
    ],
    examples: ['Shopping: 1.5x', 'Horario nobre: 1.3x', 'Local GOLD: 2.0x'],
    affectedAreas: ['Orcamentos', 'Contratos'],
  },
  rssUrl: {
    title: 'URL do Feed RSS',
    description: 'Endereco do feed RSS que sera usado para buscar noticias e conteudo dinamico.',
    details: [
      'Deve ser uma URL valida de feed RSS',
      'Conteudo atualizado automaticamente',
      'Pode usar feeds de noticias publicos',
    ],
    examples: ['https://rss.uol.com.br/feed/noticias.xml', 'https://g1.globo.com/rss/g1/'],
    affectedAreas: ['Player', 'Widget de Noticias'],
  },
  evolutionApi: {
    title: 'Evolution API',
    description: 'Configuracao da Evolution API para integracao com WhatsApp Business.',
    details: [
      'Permite envio de mensagens automaticas',
      'Requer instancia configurada',
      'Usado para notificacoes de cobranca',
    ],
    affectedAreas: ['Notificacoes', 'Lembretes', 'Alertas'],
  },
  affiliateCommissions: {
    title: 'Comissoes de Afiliados',
    description: 'Configuracao das taxas de comissao para o programa de indicacao.',
    details: [
      'Nivel 1 (direto): 10% padrao',
      'Nivel 2 (indireto): 5% padrao',
      'Comissao recorrente mensal',
    ],
    affectedAreas: ['Extrato Afiliado', 'Pagamentos'],
  },
};
