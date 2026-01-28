'use client';

import { motion } from 'framer-motion';
import { Check, ChevronRight, Tv, Upload, ListVideo, Users, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action?: () => void;
  networkOnly?: boolean;
}

interface OnboardingCardProps {
  monitors: number;
  mediaItems: number;
  playlists: number;
  advertisers: number;
  onNavigate: (tab: string) => void;
}

export default function OnboardingCard({
  monitors,
  mediaItems,
  playlists,
  advertisers,
  onNavigate,
}: OnboardingCardProps) {
  const { isNetworkOperator, isSuperAdmin } = useAuth();

  const steps: OnboardingStep[] = [
    {
      id: 'account',
      label: 'Criar a conta',
      description: 'Sua conta foi criada com sucesso',
      icon: Check,
      completed: true,
    },
    {
      id: 'monitor',
      label: 'Cadastrar primeira tela',
      description: 'Configure suas telas de exibicao',
      icon: Tv,
      completed: monitors > 0,
      action: () => onNavigate('monitors'),
    },
    {
      id: 'media',
      label: 'Fazer upload de midia',
      description: 'Adicione imagens, videos ou cameras',
      icon: Upload,
      completed: mediaItems > 0,
      action: () => onNavigate('library'),
    },
    {
      id: 'playlist',
      label: 'Criar primeira grade',
      description: 'Monte sua programacao de conteudo',
      icon: ListVideo,
      completed: playlists > 0,
      action: () => onNavigate('playlists'),
    },
    {
      id: 'client',
      label: 'Cadastrar primeiro cliente',
      description: 'Adicione anunciantes para suas campanhas',
      icon: Users,
      completed: advertisers > 0,
      action: () => onNavigate('companies'),
      networkOnly: true,
    },
  ];

  // Filtrar steps por tipo de tenant
  const visibleSteps = steps.filter(
    (step) => !step.networkOnly || isNetworkOperator() || isSuperAdmin()
  );

  const completedSteps = visibleSteps.filter((s) => s.completed).length;
  const totalSteps = visibleSteps.length;
  const progress = (completedSteps / totalSteps) * 100;
  const isComplete = completedSteps === totalSteps;

  // Nao mostrar se ja completou tudo
  if (isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Para comecar, finalize seu cadastro. Vamos la?
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Complete os passos para ter acesso a gestao completa do seu negocio.
            </p>
          </div>
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
            {completedSteps}/{totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-100">
        {visibleSteps.map((step, index) => {
          const Icon = step.icon;
          const isClickable = !step.completed && step.action;

          return (
            <button
              key={step.id}
              onClick={() => isClickable && step.action?.()}
              disabled={step.completed}
              className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                isClickable
                  ? 'hover:bg-gray-50 cursor-pointer'
                  : step.completed
                  ? 'bg-gray-50/50'
                  : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`font-medium ${
                    step.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                  }`}
                >
                  {step.label}
                </p>
                {!step.completed && (
                  <p className="text-sm text-gray-500 truncate">{step.description}</p>
                )}
              </div>

              {/* Arrow */}
              {isClickable && (
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
