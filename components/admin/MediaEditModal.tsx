'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { MediaItem, MediaSchedule } from '@/types';
import { LabelWithTooltip } from '@/components/ui/Tooltip';

interface MediaEditModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (media: MediaItem) => void;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terca' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sab', fullLabel: 'Sabado' },
];

export default function MediaEditModal({
  media,
  isOpen,
  onClose,
  onSave,
}: MediaEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [trackStatistics, setTrackStatistics] = useState(true);

  // Agendamento
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleEndDate, setScheduleEndDate] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (media) {
      setTitle(media.title);
      setDescription(media.description || '');
      setDurationSeconds(media.durationSeconds || 10);
      setIsActive(media.isActive);
      setTrackStatistics(media.trackStatistics !== false);

      if (media.schedule) {
        setScheduleEnabled(media.schedule.enabled);
        setScheduleStartDate(media.schedule.startDate || '');
        setScheduleEndDate(media.schedule.endDate || '');
        setScheduleStartTime(media.schedule.startTime || '');
        setScheduleEndTime(media.schedule.endTime || '');
        setScheduleDays(media.schedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
      } else {
        setScheduleEnabled(false);
        setScheduleStartDate('');
        setScheduleEndDate('');
        setScheduleStartTime('');
        setScheduleEndTime('');
        setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      }
    }
  }, [media]);

  const handleDayToggle = (day: number) => {
    if (scheduleDays.includes(day)) {
      setScheduleDays(scheduleDays.filter(d => d !== day));
    } else {
      setScheduleDays([...scheduleDays, day].sort((a, b) => a - b));
    }
  };

  const handleSelectAllDays = () => {
    setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleSelectWeekdays = () => {
    setScheduleDays([1, 2, 3, 4, 5]);
  };

  const handleSelectWeekend = () => {
    setScheduleDays([0, 6]);
  };

  const handleSave = () => {
    if (!media) return;

    const schedule: MediaSchedule | undefined = scheduleEnabled
      ? {
          enabled: true,
          startDate: scheduleStartDate || undefined,
          endDate: scheduleEndDate || undefined,
          startTime: scheduleStartTime || undefined,
          endTime: scheduleEndTime || undefined,
          daysOfWeek: scheduleDays.length < 7 ? scheduleDays : undefined,
        }
      : undefined;

    const updatedMedia: MediaItem = {
      ...media,
      title,
      description: description || undefined,
      durationSeconds,
      isActive,
      trackStatistics,
      schedule,
    };

    onSave(updatedMedia);
    onClose();
  };

  if (!isOpen || !media) return null;

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
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Editar Midia</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Preview da mídia */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                  {media.thumbnailUrl ? (
                    <img
                      src={media.thumbnailUrl}
                      alt={media.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">
                        {media.type === 'video' ? '🎬' : media.type === 'image' ? '🖼️' : '📄'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Tipo: {media.type}</p>
                    <p className="text-sm text-gray-500 truncate">
                      Arquivo: {media.sourceUrl?.split('/').pop()}
                    </p>
                  </div>
                </div>

                {/* Informações básicas */}
                <div className="space-y-4">
                  <div>
                    <LabelWithTooltip
                      label="Titulo"
                      tooltip="Nome que identifica esta midia no sistema"
                      required
                      htmlFor="title"
                    />
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                      placeholder="Ex: Promocao de Verao"
                    />
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Descricao"
                      tooltip="Observacoes internas sobre esta midia (nao aparece na TV)"
                      htmlFor="description"
                    />
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none resize-none"
                      placeholder="Anotacoes sobre esta midia..."
                    />
                  </div>

                  {media.type !== 'video' && (
                    <div>
                      <LabelWithTooltip
                        label="Duracao (segundos)"
                        tooltip="Tempo que a midia ficara na tela. Para videos, a duracao e automatica."
                        htmlFor="duration"
                      />
                      <input
                        id="duration"
                        type="number"
                        min={1}
                        max={300}
                        value={durationSeconds}
                        onChange={(e) => setDurationSeconds(parseInt(e.target.value) || 10)}
                        className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                      />
                      <span className="text-sm text-gray-700">Midia ativa</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trackStatistics}
                        onChange={(e) => setTrackStatistics(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                      />
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <ChartBarIcon className="w-4 h-4" />
                        Gravar estatisticas
                      </span>
                    </label>
                  </div>
                </div>

                {/* Agendamento */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5 text-[#F59E0B]" />
                      <LabelWithTooltip
                        label="Agendamento"
                        tooltip="Define quando esta midia deve aparecer. Fora do agendamento, ela nao sera exibida."
                      />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleEnabled}
                        onChange={(e) => setScheduleEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#F59E0B]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F59E0B]"></div>
                    </label>
                  </div>

                  {scheduleEnabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pl-7"
                    >
                      {/* Período de datas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <LabelWithTooltip
                            label="Data inicio"
                            tooltip="A midia so aparece a partir desta data. Deixe vazio para comecar imediatamente."
                            htmlFor="startDate"
                          />
                          <input
                            id="startDate"
                            type="date"
                            value={scheduleStartDate}
                            onChange={(e) => setScheduleStartDate(e.target.value)}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                          />
                        </div>
                        <div>
                          <LabelWithTooltip
                            label="Data fim"
                            tooltip="A midia para de aparecer apos esta data. Deixe vazio para nao ter fim."
                            htmlFor="endDate"
                          />
                          <input
                            id="endDate"
                            type="date"
                            value={scheduleEndDate}
                            onChange={(e) => setScheduleEndDate(e.target.value)}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                          />
                        </div>
                      </div>

                      {/* Horário */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <LabelWithTooltip
                            label="Horario inicio"
                            tooltip="A midia so aparece a partir deste horario. Ex: 08:00 para comecar as 8h."
                            htmlFor="startTime"
                          />
                          <div className="relative mt-1">
                            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              id="startTime"
                              type="time"
                              value={scheduleStartTime}
                              onChange={(e) => setScheduleStartTime(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <LabelWithTooltip
                            label="Horario fim"
                            tooltip="A midia para de aparecer apos este horario. Ex: 18:00 para parar as 18h."
                            htmlFor="endTime"
                          />
                          <div className="relative mt-1">
                            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              id="endTime"
                              type="time"
                              value={scheduleEndTime}
                              onChange={(e) => setScheduleEndTime(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dias da semana */}
                      <div>
                        <LabelWithTooltip
                          label="Dias da semana"
                          tooltip="Selecione em quais dias a midia deve aparecer. Por padrao, aparece todos os dias."
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => handleDayToggle(day.value)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                scheduleDays.includes(day.value)
                                  ? 'bg-[#F59E0B] text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              title={day.fullLabel}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllDays}
                            className="text-xs text-[#F59E0B] hover:underline"
                          >
                            Todos os dias
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={handleSelectWeekdays}
                            className="text-xs text-[#F59E0B] hover:underline"
                          >
                            Seg a Sex
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={handleSelectWeekend}
                            className="text-xs text-[#F59E0B] hover:underline"
                          >
                            Fim de semana
                          </button>
                        </div>
                      </div>

                      {/* Resumo do agendamento */}
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <strong>Resumo:</strong>{' '}
                        {scheduleStartDate || scheduleEndDate ? (
                          <>
                            {scheduleStartDate && `A partir de ${new Date(scheduleStartDate).toLocaleDateString('pt-BR')}`}
                            {scheduleStartDate && scheduleEndDate && ' '}
                            {scheduleEndDate && `ate ${new Date(scheduleEndDate).toLocaleDateString('pt-BR')}`}
                            {(scheduleStartDate || scheduleEndDate) && ', '}
                          </>
                        ) : (
                          'Sem restricao de data, '
                        )}
                        {scheduleStartTime || scheduleEndTime ? (
                          <>
                            das {scheduleStartTime || '00:00'} as {scheduleEndTime || '23:59'}
                          </>
                        ) : (
                          'o dia todo'
                        )}
                        {scheduleDays.length < 7 && (
                          <>
                            , apenas {scheduleDays.map(d => DAYS_OF_WEEK[d].label).join(', ')}
                          </>
                        )}
                        .
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg hover:shadow-lg transition-all"
              >
                Salvar
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
