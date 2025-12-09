'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOfficeIcon,
  TvIcon,
  PhotoIcon,
  MegaphoneIcon,
  PlayIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface OnboardingWizardProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
  completedSteps: {
    hasCondominium: boolean;
    hasMonitor: boolean;
    hasMedia: boolean;
    hasCampaign: boolean;
  };
}

const steps = [
  {
    id: 1,
    title: 'Cadastrar Condomínio',
    description: 'Primeiro, cadastre o condomínio ou local onde as TVs serão instaladas.',
    icon: BuildingOfficeIcon,
    tab: 'condominiums',
    action: 'Ir para Condomínios',
    tips: [
      'Preencha o nome e slug do condomínio',
      'Adicione o endereço e cidade para organização',
      'Você pode adicionar uma foto do condomínio',
    ],
  },
  {
    id: 2,
    title: 'Cadastrar Monitor',
    description: 'Cadastre os monitores/TVs que exibirão o conteúdo no local.',
    icon: TvIcon,
    tab: 'monitors',
    action: 'Ir para Monitores',
    tips: [
      'Dê um nome identificável para cada TV (ex: TV Portaria)',
      'O slug será usado na URL do player',
      'Monitores enviam heartbeat para monitoramento',
    ],
  },
  {
    id: 3,
    title: 'Cadastrar Mídia',
    description: 'Adicione as imagens, vídeos ou PDFs que serão exibidos nas TVs.',
    icon: PhotoIcon,
    tab: 'media',
    action: 'Ir para Mídias',
    tips: [
      'Suporta imagens (JPG, PNG), vídeos (MP4) e PDFs',
      'Você pode adicionar vídeos do YouTube',
      'Defina a duração de exibição de cada mídia',
      'Câmeras RTMP também podem ser adicionadas',
    ],
  },
  {
    id: 4,
    title: 'Criar Campanha',
    description: 'Crie uma campanha para organizar e agendar suas mídias.',
    icon: MegaphoneIcon,
    tab: 'campaigns',
    action: 'Ir para Campanhas',
    tips: [
      'Campanhas agrupam mídias para exibição',
      'Defina datas de início e fim (opcional)',
      'Associe a campanha a um monitor específico',
      'Configure exibição de notícias entre mídias',
    ],
  },
  {
    id: 5,
    title: 'Ver Campanha',
    description: 'Pronto! Visualize sua campanha rodando em uma TV.',
    icon: PlayIcon,
    tab: 'dashboard',
    action: 'Ver Preview',
    tips: [
      'Use o botão "Ver Preview na TV" no Dashboard',
      'O player roda em tela cheia',
      'As mídias são exibidas em sequência automática',
      'Atualizações são refletidas em tempo real',
    ],
  },
];

export default function OnboardingWizard({ onClose, onNavigate, completedSteps }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const getStepStatus = (stepId: number) => {
    switch (stepId) {
      case 1:
        return completedSteps.hasCondominium;
      case 2:
        return completedSteps.hasMonitor;
      case 3:
        return completedSteps.hasMedia;
      case 4:
        return completedSteps.hasCampaign;
      case 5:
        return completedSteps.hasCondominium && completedSteps.hasMedia;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    const step = steps[currentStep];
    onNavigate(step.tab);
    onClose();
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isCompleted = getStepStatus(step.id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8" />
            <h2 className="text-2xl font-display font-bold">Guia de Início Rápido</h2>
          </div>
          <p className="text-white/80">
            Siga os passos abaixo para criar sua primeira campanha
          </p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 border-b">
          {steps.map((s, index) => {
            const completed = getStepStatus(s.id);
            const isCurrent = index === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-[#FEF3C7] text-[#B45309]'
                    : completed
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {completed ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCurrent ? 'bg-[#F59E0B] text-white' : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {s.id}
                  </span>
                )}
                <span className="hidden sm:inline text-sm font-medium">
                  {s.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  isCompleted
                    ? 'bg-green-100'
                    : 'bg-gradient-to-br from-[#FFCE00]/20 to-[#F59E0B]/20'
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                ) : (
                  <StepIcon className="w-8 h-8 text-[#D97706]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-500">Passo {step.id} de {steps.length}</span>
                  {isCompleted && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Concluído
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 mt-1">{step.description}</p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Dicas:</h4>
              <ul className="space-y-2">
                {step.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-[#F59E0B] mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAction}
              className="w-full bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {step.action}
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep ? 'bg-[#F59E0B] w-4' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              currentStep === steps.length - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Próximo
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
