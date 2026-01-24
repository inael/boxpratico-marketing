'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, ClockIcon, CurrencyDollarIcon, SunIcon } from '@heroicons/react/24/outline';
import { MediaItem, MediaType, MEDIA_TYPE_LABELS, MEDIA_TYPE_ICONS } from '@/types';
import { LabelWithTooltip } from '@/components/ui/Tooltip';

interface SpecialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (media: Partial<MediaItem>) => void;
  advertiserId: string;
}

type SpecialMediaType = 'clock' | 'currency' | 'weather';

interface SpecialMediaConfig {
  type: SpecialMediaType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const SPECIAL_MEDIA_TYPES: SpecialMediaConfig[] = [
  {
    type: 'clock',
    label: 'Hora Certa',
    icon: '🕐',
    description: 'Exibe um relogio digital em tempo real com data',
    color: 'blue',
  },
  {
    type: 'currency',
    label: 'Cotacao',
    icon: '💹',
    description: 'Exibe cotacoes de moedas (Dolar, Euro, Bitcoin)',
    color: 'green',
  },
  {
    type: 'weather',
    label: 'Previsao do Tempo',
    icon: '🌤️',
    description: 'Exibe previsao do tempo para uma cidade',
    color: 'orange',
  },
];

// Opcoes de gradiente de fundo
const BG_GRADIENTS = [
  { id: 'blue', name: 'Azul', value: 'from-blue-600 to-blue-900' },
  { id: 'purple', name: 'Roxo', value: 'from-purple-600 to-purple-900' },
  { id: 'green', name: 'Verde', value: 'from-green-600 to-green-900' },
  { id: 'orange', name: 'Laranja', value: 'from-orange-600 to-orange-900' },
  { id: 'red', name: 'Vermelho', value: 'from-red-600 to-red-900' },
  { id: 'gray', name: 'Cinza', value: 'from-gray-700 to-gray-900' },
  { id: 'black', name: 'Preto', value: 'from-black to-gray-900' },
];

export default function SpecialMediaModal({
  isOpen,
  onClose,
  onSave,
  advertiserId,
}: SpecialMediaModalProps) {
  const [selectedType, setSelectedType] = useState<SpecialMediaType | null>(null);
  const [title, setTitle] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(15);

  // Config para Clock
  const [clockTitle, setClockTitle] = useState('');
  const [clockBgGradient, setClockBgGradient] = useState('from-blue-600 to-blue-900');

  // Config para Currency
  const [currencyTitle, setCurrencyTitle] = useState('Cotacoes do Dia');
  const [currencyBgGradient, setCurrencyBgGradient] = useState('from-green-600 to-green-900');

  // Config para Weather
  const [weatherCity, setWeatherCity] = useState('Sao Paulo');
  const [weatherTitle, setWeatherTitle] = useState('Previsao do Tempo');
  const [weatherBgGradient, setWeatherBgGradient] = useState('from-blue-600 to-blue-900');

  const handleTypeSelect = (type: SpecialMediaType) => {
    setSelectedType(type);
    // Define titulo padrao baseado no tipo
    switch (type) {
      case 'clock':
        setTitle('Hora Certa');
        break;
      case 'currency':
        setTitle('Cotacoes do Dia');
        break;
      case 'weather':
        setTitle('Previsao do Tempo');
        break;
    }
  };

  const handleSave = () => {
    if (!selectedType || !title) return;

    let config: Record<string, unknown> = {};

    switch (selectedType) {
      case 'clock':
        config = {
          title: clockTitle || undefined,
          bgGradient: clockBgGradient,
        };
        break;
      case 'currency':
        config = {
          title: currencyTitle,
          bgGradient: currencyBgGradient,
        };
        break;
      case 'weather':
        config = {
          title: weatherTitle,
          city: weatherCity,
          bgGradient: weatherBgGradient,
        };
        break;
    }

    const media: Partial<MediaItem> = {
      title,
      type: selectedType as MediaType,
      sourceUrl: JSON.stringify(config),
      durationSeconds,
      advertiserId,
      isActive: true,
    };

    onSave(media);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedType(null);
    setTitle('');
    setDurationSeconds(15);
    setClockTitle('');
    setClockBgGradient('from-blue-600 to-blue-900');
    setCurrencyTitle('Cotacoes do Dia');
    setCurrencyBgGradient('from-green-600 to-green-900');
    setWeatherCity('Sao Paulo');
    setWeatherTitle('Previsao do Tempo');
    setWeatherBgGradient('from-blue-600 to-blue-900');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedType ? 'Configurar Midia Especial' : 'Adicionar Midia Especial'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {!selectedType ? (
                // Selecao do tipo de midia especial
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">
                    Selecione o tipo de midia especial que deseja adicionar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {SPECIAL_MEDIA_TYPES.map((mediaType) => (
                      <button
                        key={mediaType.type}
                        onClick={() => handleTypeSelect(mediaType.type)}
                        className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                          mediaType.color === 'blue'
                            ? 'border-blue-200 hover:border-blue-500 hover:bg-blue-50'
                            : mediaType.color === 'green'
                            ? 'border-green-200 hover:border-green-500 hover:bg-green-50'
                            : 'border-orange-200 hover:border-orange-500 hover:bg-orange-50'
                        }`}
                      >
                        <div className="text-4xl mb-3">{mediaType.icon}</div>
                        <h3 className="font-bold text-gray-900 mb-1">{mediaType.label}</h3>
                        <p className="text-sm text-gray-500">{mediaType.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Configuracao do tipo selecionado
                <div className="space-y-6">
                  {/* Botao para voltar */}
                  <button
                    onClick={() => setSelectedType(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar para selecao
                  </button>

                  {/* Preview do tipo */}
                  <div className={`p-4 rounded-xl flex items-center gap-4 ${
                    selectedType === 'clock'
                      ? 'bg-blue-50 border border-blue-200'
                      : selectedType === 'currency'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-orange-50 border border-orange-200'
                  }`}>
                    <div className="text-4xl">
                      {SPECIAL_MEDIA_TYPES.find(t => t.type === selectedType)?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {SPECIAL_MEDIA_TYPES.find(t => t.type === selectedType)?.label}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {SPECIAL_MEDIA_TYPES.find(t => t.type === selectedType)?.description}
                      </p>
                    </div>
                  </div>

                  {/* Campos comuns */}
                  <div className="space-y-4">
                    <div>
                      <LabelWithTooltip
                        label="Titulo da Midia"
                        tooltip="Nome que identifica esta midia no sistema"
                        required
                        htmlFor="title"
                      />
                      <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        placeholder="Ex: Hora Certa - Lobby"
                      />
                    </div>

                    <div>
                      <LabelWithTooltip
                        label="Duracao (segundos)"
                        tooltip="Tempo que a midia ficara na tela antes de passar para a proxima"
                        htmlFor="duration"
                      />
                      <input
                        id="duration"
                        type="number"
                        min={5}
                        max={120}
                        value={durationSeconds}
                        onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 15)}
                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Configuracoes especificas por tipo */}
                  {selectedType === 'clock' && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-blue-600" />
                        Configuracoes do Relogio
                      </h4>

                      <div>
                        <LabelWithTooltip
                          label="Titulo na Tela"
                          tooltip="Texto opcional exibido acima do relogio. Deixe vazio para nao mostrar."
                          htmlFor="clockTitle"
                        />
                        <input
                          id="clockTitle"
                          type="text"
                          value={clockTitle}
                          onChange={(e) => setClockTitle(e.target.value)}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="Ex: Bom dia! Seja bem-vindo"
                        />
                      </div>

                      <div>
                        <LabelWithTooltip
                          label="Cor de Fundo"
                          tooltip="Gradiente de cor para o fundo da tela"
                        />
                        <div className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {BG_GRADIENTS.map((gradient) => (
                            <button
                              key={gradient.id}
                              type="button"
                              onClick={() => setClockBgGradient(gradient.value)}
                              className={`h-10 rounded-lg bg-gradient-to-br ${gradient.value} ${
                                clockBgGradient === gradient.value
                                  ? 'ring-2 ring-indigo-500 ring-offset-2'
                                  : ''
                              }`}
                              title={gradient.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedType === 'currency' && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                        Configuracoes de Cotacao
                      </h4>

                      <div>
                        <LabelWithTooltip
                          label="Titulo na Tela"
                          tooltip="Texto exibido no topo da tela de cotacoes"
                          htmlFor="currencyTitle"
                        />
                        <input
                          id="currencyTitle"
                          type="text"
                          value={currencyTitle}
                          onChange={(e) => setCurrencyTitle(e.target.value)}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="Ex: Cotacoes do Dia"
                        />
                      </div>

                      <div>
                        <LabelWithTooltip
                          label="Cor de Fundo"
                          tooltip="Gradiente de cor para o fundo da tela"
                        />
                        <div className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {BG_GRADIENTS.map((gradient) => (
                            <button
                              key={gradient.id}
                              type="button"
                              onClick={() => setCurrencyBgGradient(gradient.value)}
                              className={`h-10 rounded-lg bg-gradient-to-br ${gradient.value} ${
                                currencyBgGradient === gradient.value
                                  ? 'ring-2 ring-indigo-500 ring-offset-2'
                                  : ''
                              }`}
                              title={gradient.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        <strong>Moedas exibidas:</strong> Dolar (USD), Euro (EUR) e Bitcoin (BTC)
                        <br />
                        <span className="text-xs">Dados atualizados em tempo real via AwesomeAPI</span>
                      </div>
                    </div>
                  )}

                  {selectedType === 'weather' && (
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <SunIcon className="w-5 h-5 text-orange-600" />
                        Configuracoes de Previsao do Tempo
                      </h4>

                      <div>
                        <LabelWithTooltip
                          label="Cidade"
                          tooltip="Nome da cidade para buscar a previsao do tempo"
                          required
                          htmlFor="weatherCity"
                        />
                        <input
                          id="weatherCity"
                          type="text"
                          value={weatherCity}
                          onChange={(e) => setWeatherCity(e.target.value)}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="Ex: Sao Paulo"
                        />
                      </div>

                      <div>
                        <LabelWithTooltip
                          label="Titulo na Tela"
                          tooltip="Texto exibido no topo da tela de previsao"
                          htmlFor="weatherTitle"
                        />
                        <input
                          id="weatherTitle"
                          type="text"
                          value={weatherTitle}
                          onChange={(e) => setWeatherTitle(e.target.value)}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                          placeholder="Ex: Previsao do Tempo"
                        />
                      </div>

                      <div>
                        <LabelWithTooltip
                          label="Cor de Fundo"
                          tooltip="Gradiente de cor para o fundo da tela"
                        />
                        <div className="mt-2 grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {BG_GRADIENTS.map((gradient) => (
                            <button
                              key={gradient.id}
                              type="button"
                              onClick={() => setWeatherBgGradient(gradient.value)}
                              className={`h-10 rounded-lg bg-gradient-to-br ${gradient.value} ${
                                weatherBgGradient === gradient.value
                                  ? 'ring-2 ring-indigo-500 ring-offset-2'
                                  : ''
                              }`}
                              title={gradient.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedType && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar Midia
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
