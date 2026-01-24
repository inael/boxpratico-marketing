'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BuildingOfficeIcon,
  TvIcon,
  PhotoIcon,
  MegaphoneIcon,
  PlayIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface OnboardingWizardProps {
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

const steps = [
  {
    id: 1,
    title: 'Cadastrar Local',
    description: 'Primeiro, cadastre o local onde as TVs serão instaladas (academia, condomínio, mercado, clínica...).',
    icon: BuildingOfficeIcon,
    tab: 'condominiums',
    action: 'Ir para Locais',
    tips: [
      'Preencha o nome e slug do local',
      'Adicione o endereço e cidade para organização',
      'Você pode adicionar uma foto do local',
    ],
  },
  {
    id: 2,
    title: 'Cadastrar Tela',
    description: 'Cadastre as telas/TVs que exibirão o conteúdo no local.',
    icon: TvIcon,
    tab: 'monitors',
    action: 'Ir para Telas',
    tips: [
      'Dê um nome identificável para cada TV (ex: TV Portaria)',
      'O slug será usado na URL do player',
      'Telas enviam heartbeat para monitoramento',
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
    title: 'Criar Playlist',
    description: 'Crie uma playlist para organizar e agendar suas mídias.',
    icon: MegaphoneIcon,
    tab: 'campaigns',
    action: 'Ir para Playlists',
    tips: [
      'Playlists agrupam mídias para exibição',
      'Defina datas de início e fim (opcional)',
      'Associe a playlist a uma tela específica',
      'Configure exibição de notícias entre mídias',
    ],
  },
  {
    id: 5,
    title: 'Ver Playlist',
    description: 'Pronto! Visualize sua playlist rodando em uma TV.',
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

export default function OnboardingWizard({ onClose, onNavigate }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="w-8 h-8" />
            <h2 className="text-2xl font-display font-bold">Criar Nova Playlist</h2>
          </div>
          <p className="text-white/80">
            Siga os 5 passos abaixo para configurar sua playlist
          </p>
          {/* Step Counter */}
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-semibold">
              Passo {step.id} de {steps.length}
            </span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 border-b">
          {steps.map((s, index) => {
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-indigo-100 text-indigo-800 ring-2 ring-indigo-500'
                    : isPast
                    ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isPast
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s.id}
                </span>
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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-400/20 to-indigo-500/20 relative">
                <StepIcon className="w-8 h-8 text-indigo-700" />
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                  {step.id}
                </span>
              </div>
              <div className="flex-1">
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
                    <span className="text-indigo-600 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAction}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
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
                  index === currentStep ? 'bg-indigo-600 w-4' : 'bg-gray-300'
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
