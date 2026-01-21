'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  CameraIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  PowerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Monitor, RemoteCommand, COMMAND_TYPE_LABELS, COMMAND_TYPE_ICONS, RemoteCommandType } from '@/types';
import { LabelWithTooltip } from '@/components/ui/Tooltip';

interface RemoteCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  monitor: Monitor | null;
}

interface CommandOption {
  type: RemoteCommandType;
  label: string;
  icon: string;
  description: string;
  hasPayload?: boolean;
  color: string;
}

const COMMAND_OPTIONS: CommandOption[] = [
  {
    type: 'refresh',
    label: 'Atualizar Conteudo',
    icon: '🔄',
    description: 'Recarrega a playlist e atualiza o conteudo exibido',
    color: 'blue',
  },
  {
    type: 'restart',
    label: 'Reiniciar Player',
    icon: '🔁',
    description: 'Reinicia o aplicativo player sem reiniciar o dispositivo',
    color: 'orange',
  },
  {
    type: 'screenshot',
    label: 'Capturar Tela',
    icon: '📸',
    description: 'Captura uma imagem da tela atual do terminal',
    color: 'purple',
  },
  {
    type: 'volume',
    label: 'Ajustar Volume',
    icon: '🔊',
    description: 'Altera o volume do som do terminal',
    hasPayload: true,
    color: 'green',
  },
  {
    type: 'message',
    label: 'Exibir Mensagem',
    icon: '💬',
    description: 'Exibe uma mensagem temporaria na tela',
    hasPayload: true,
    color: 'cyan',
  },
  {
    type: 'clear_cache',
    label: 'Limpar Cache',
    icon: '🗑️',
    description: 'Remove arquivos de cache do player',
    color: 'yellow',
  },
  {
    type: 'reboot',
    label: 'Reiniciar Dispositivo',
    icon: '🔌',
    description: 'Reinicia completamente o dispositivo (requer permissao root)',
    color: 'red',
  },
];

export default function RemoteCommandModal({
  isOpen,
  onClose,
  monitor,
}: RemoteCommandModalProps) {
  const [selectedCommand, setSelectedCommand] = useState<RemoteCommandType | null>(null);
  const [volumeValue, setVolumeValue] = useState(50);
  const [messageText, setMessageText] = useState('');
  const [messageDuration, setMessageDuration] = useState(10);
  const [commandHistory, setCommandHistory] = useState<RemoteCommand[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen && monitor) {
      fetchCommandHistory();
    }
  }, [isOpen, monitor]);

  const fetchCommandHistory = async () => {
    if (!monitor) return;
    try {
      const response = await fetch(`/api/commands?monitorId=${monitor.id}`);
      const data = await response.json();
      // Mostrar apenas os ultimos 10 comandos
      setCommandHistory(data.slice(0, 10));
    } catch (error) {
      console.error('Failed to fetch command history:', error);
    }
  };

  const handleSendCommand = async () => {
    if (!selectedCommand || !monitor) return;

    setSending(true);

    try {
      // Preparar payload baseado no tipo de comando
      let payload: Record<string, unknown> | undefined;

      if (selectedCommand === 'volume') {
        payload = { volume: volumeValue };
      } else if (selectedCommand === 'message') {
        payload = { text: messageText, duration: messageDuration };
      }

      const response = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitorId: monitor.id,
          type: selectedCommand,
          payload,
        }),
      });

      if (response.ok) {
        // Atualizar historico
        await fetchCommandHistory();
        // Limpar selecao
        setSelectedCommand(null);
        setMessageText('');
      }
    } catch (error) {
      console.error('Failed to send command:', error);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
      case 'sent':
        return <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'executed':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Aguardando';
      case 'sent':
        return 'Enviado';
      case 'executed':
        return 'Executado';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  if (!isOpen || !monitor) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Comandos Remotos</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Terminal: <span className="font-medium">{monitor.name}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                  monitor.isOnline
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    monitor.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  {monitor.isOnline ? 'Online' : 'Offline'}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Grid de comandos */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Selecione um comando:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {COMMAND_OPTIONS.map((cmd) => (
                    <button
                      key={cmd.type}
                      onClick={() => setSelectedCommand(cmd.type)}
                      disabled={!monitor.isOnline}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        selectedCommand === cmd.type
                          ? 'border-[#F59E0B] bg-[#FFFBEB]'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      } ${!monitor.isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-2xl mb-2">{cmd.icon}</div>
                      <div className="font-medium text-gray-900 text-sm">{cmd.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuracao do comando selecionado */}
              {selectedCommand && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">
                      {COMMAND_OPTIONS.find(c => c.type === selectedCommand)?.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {COMMAND_OPTIONS.find(c => c.type === selectedCommand)?.label}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {COMMAND_OPTIONS.find(c => c.type === selectedCommand)?.description}
                      </p>
                    </div>
                  </div>

                  {/* Campos especificos por tipo */}
                  {selectedCommand === 'volume' && (
                    <div className="space-y-3">
                      <LabelWithTooltip
                        label="Volume"
                        tooltip="Nivel de volume de 0 (mudo) a 100 (maximo)"
                      />
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={volumeValue}
                          onChange={(e) => setVolumeValue(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#F59E0B]"
                        />
                        <span className="w-12 text-center font-bold text-gray-900">
                          {volumeValue}%
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedCommand === 'message' && (
                    <div className="space-y-4">
                      <div>
                        <LabelWithTooltip
                          label="Mensagem"
                          tooltip="Texto que sera exibido na tela do terminal"
                          required
                        />
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={3}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                          placeholder="Digite a mensagem..."
                        />
                      </div>
                      <div>
                        <LabelWithTooltip
                          label="Duracao (segundos)"
                          tooltip="Tempo que a mensagem ficara visivel na tela"
                        />
                        <input
                          type="number"
                          min={5}
                          max={60}
                          value={messageDuration}
                          onChange={(e) => setMessageDuration(parseInt(e.target.value))}
                          className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSendCommand}
                    disabled={sending || (selectedCommand === 'message' && !messageText)}
                    className="mt-4 w-full py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <PowerIcon className="w-5 h-5" />
                        Enviar Comando
                      </>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Historico de comandos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Historico de Comandos
                  </h3>
                  <button
                    onClick={fetchCommandHistory}
                    className="text-sm text-[#F59E0B] hover:underline flex items-center gap-1"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Atualizar
                  </button>
                </div>

                {commandHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum comando enviado ainda
                  </div>
                ) : (
                  <div className="space-y-2">
                    {commandHistory.map((cmd) => (
                      <div
                        key={cmd.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {COMMAND_TYPE_ICONS[cmd.type]}
                          </span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {COMMAND_TYPE_LABELS[cmd.type]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(cmd.createdAt).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(cmd.status)}
                          <span className={`text-sm ${
                            cmd.status === 'executed' ? 'text-green-600' :
                            cmd.status === 'failed' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {getStatusLabel(cmd.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
