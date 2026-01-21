'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  PhotoIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowsUpDownIcon,
  CalendarDaysIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaGroup, MediaItem, Advertiser, MEDIA_GROUP_COLORS, MEDIA_GROUP_DISPLAY_LABELS, MediaSchedule } from '@/types';
import Tooltip, { LabelWithTooltip } from '@/components/ui/Tooltip';

// Gerar slug a partir do nome
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function MediaGroupsTab() {
  const [groups, setGroups] = useState<MediaGroup[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MediaGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    tags: '',
    advertiserId: '',
    displayMode: 'sequential' as 'sequential' | 'random' | 'weighted',
    mediaIds: [] as string[],
    isActive: true,
    // Schedule
    scheduleEnabled: false,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, mediaRes, advertisersRes] = await Promise.all([
        fetch('/api/media-groups'),
        fetch('/api/media'),
        fetch('/api/advertisers'),
      ]);

      if (groupsRes.ok) setGroups(await groupsRes.json());
      if (mediaRes.ok) setMediaItems(await mediaRes.json());
      if (advertisersRes.ok) setAdvertisers(await advertisersRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const schedule: MediaSchedule = {
      enabled: formData.scheduleEnabled,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      startTime: formData.startTime || undefined,
      endTime: formData.endTime || undefined,
      daysOfWeek: formData.daysOfWeek,
    };

    const payload = {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      advertiserId: formData.advertiserId || undefined,
      displayMode: formData.displayMode,
      mediaIds: formData.mediaIds,
      schedule,
      isActive: formData.isActive,
    };

    try {
      const url = editingGroup ? `/api/media-groups/${editingGroup.id}` : '/api/media-groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar grupo');
      }
    } catch (error) {
      console.error('Erro ao salvar grupo:', error);
      alert('Erro ao salvar grupo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este grupo?')) return;

    try {
      const response = await fetch(`/api/media-groups/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
    }
  };

  const handleEdit = (group: MediaGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      slug: group.slug,
      description: group.description || '',
      color: group.color || '#3B82F6',
      icon: group.icon || '',
      tags: group.tags?.join(', ') || '',
      advertiserId: group.advertiserId || '',
      displayMode: group.displayMode || 'sequential',
      mediaIds: group.mediaIds || [],
      isActive: group.isActive,
      scheduleEnabled: group.schedule?.enabled || false,
      startDate: group.schedule?.startDate || '',
      endDate: group.schedule?.endDate || '',
      startTime: group.schedule?.startTime || '',
      endTime: group.schedule?.endTime || '',
      daysOfWeek: group.schedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#3B82F6',
      icon: '',
      tags: '',
      advertiserId: '',
      displayMode: 'sequential',
      mediaIds: [],
      isActive: true,
      scheduleEnabled: false,
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });
    setEditingGroup(null);
    setShowForm(false);
  };

  const toggleMediaInGroup = (mediaId: string) => {
    setFormData(prev => ({
      ...prev,
      mediaIds: prev.mediaIds.includes(mediaId)
        ? prev.mediaIds.filter(id => id !== mediaId)
        : [...prev.mediaIds, mediaId],
    }));
  };

  const toggleDayOfWeek = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getMediaForGroup = (group: MediaGroup) => {
    return mediaItems.filter(m => group.mediaIds.includes(m.id));
  };

  const getAdvertiserName = (advertiserId?: string) => {
    if (!advertiserId) return 'Sistema';
    return advertisers.find(a => a.id === advertiserId)?.name || 'Desconhecido';
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderIcon className="w-7 h-7 text-amber-500" />
            Grupos de Mídias
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Organize suas mídias em grupos para facilitar a gestão e reutilização em playlists
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="font-medium">Novo Grupo</span>
        </button>
      </div>

      {/* Search and View Mode */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar grupos por nome, descrição ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <Tooltip content="Visualização em grade" position="top">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-colors ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip content="Visualização em lista" position="top">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-colors ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Groups Display */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">Nenhum grupo encontrado</h3>
          <p className="text-sm text-gray-500 mt-2">
            {searchTerm ? 'Tente buscar com outros termos' : 'Crie seu primeiro grupo de mídias para organizar seu conteúdo'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map(group => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Card Header with Color */}
              <div
                className="h-2"
                style={{ backgroundColor: group.color || '#3B82F6' }}
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{group.icon || '📁'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <p className="text-xs text-gray-500">
                        {getAdvertiserName(group.advertiserId)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    group.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {group.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {group.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {group.description}
                  </p>
                )}

                {/* Tags */}
                {group.tags && group.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {group.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {group.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                        +{group.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <PhotoIcon className="w-4 h-4" />
                    <span>{group.mediaIds.length} mídias</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowsUpDownIcon className="w-4 h-4" />
                    <span>{MEDIA_GROUP_DISPLAY_LABELS[group.displayMode || 'sequential']}</span>
                  </div>
                </div>

                {/* Schedule Badge */}
                {group.schedule?.enabled && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg mb-3">
                    <CalendarDaysIcon className="w-3 h-3" />
                    <span>Agendamento ativo</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(group)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredGroups.map((group, index) => (
            <div
              key={group.id}
              className={`${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              >
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: group.color || '#3B82F6' }}
                />
                <span className="text-2xl">{group.icon || '📁'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      group.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {group.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {group.description || 'Sem descrição'}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                  <span>{group.mediaIds.length} mídias</span>
                  <span>{getAdvertiserName(group.advertiserId)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(group); }}
                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  {expandedGroup === group.id ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedGroup === group.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-16 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                      {getMediaForGroup(group).map(media => (
                        <div
                          key={media.id}
                          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden"
                        >
                          {media.thumbnailUrl ? (
                            <img
                              src={media.thumbnailUrl}
                              alt={media.title}
                              className="w-full h-full object-cover"
                            />
                          ) : media.type === 'video' ? (
                            <div className="flex items-center justify-center h-full">
                              <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <PhotoIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-1">
                            <p className="text-xs text-white truncate">{media.title}</p>
                          </div>
                        </div>
                      ))}
                      {group.mediaIds.length === 0 && (
                        <p className="col-span-full text-sm text-gray-500 py-4">
                          Nenhuma mídia neste grupo
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={() => resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-4xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingGroup ? 'Editar Grupo' : 'Novo Grupo de Mídias'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingGroup
                    ? 'Modifique as informações do grupo'
                    : 'Crie um grupo para organizar suas mídias e reutilizar em várias playlists'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <LabelWithTooltip
                      label="Nome do Grupo"
                      tooltip="Nome que identifica este grupo de mídias"
                      required
                      htmlFor="name"
                    />
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          name: e.target.value,
                          slug: !editingGroup ? generateSlug(e.target.value) : prev.slug,
                        }));
                      }}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Slug"
                      tooltip="Identificador único para URLs e integrações"
                      required
                      htmlFor="slug"
                    />
                    <input
                      id="slug"
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <LabelWithTooltip
                    label="Descrição"
                    tooltip="Descreva o propósito ou conteúdo deste grupo"
                    htmlFor="description"
                  />
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="Ex: Mídias de promoções de verão 2024"
                  />
                </div>

                {/* Color, Icon, Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <LabelWithTooltip
                      label="Cor"
                      tooltip="Cor para identificação visual do grupo"
                      htmlFor="color"
                    />
                    <div className="mt-1 flex flex-wrap gap-2">
                      {MEDIA_GROUP_COLORS.map(color => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color: color.hex }))}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            formData.color === color.hex
                              ? 'ring-2 ring-offset-2 ring-amber-500'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Ícone (emoji)"
                      tooltip="Emoji para representar visualmente o grupo"
                      htmlFor="icon"
                    />
                    <input
                      id="icon"
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="📁"
                      maxLength={2}
                    />
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Tags"
                      tooltip="Palavras-chave para facilitar a busca (separadas por vírgula)"
                      htmlFor="tags"
                    />
                    <input
                      id="tags"
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="verão, promoção, 2024"
                    />
                  </div>
                </div>

                {/* Advertiser and Display Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <LabelWithTooltip
                      label="Anunciante"
                      tooltip="Anunciante dono deste grupo. Deixe vazio para grupos do sistema"
                      htmlFor="advertiserId"
                    />
                    <select
                      id="advertiserId"
                      value={formData.advertiserId}
                      onChange={(e) => setFormData(prev => ({ ...prev, advertiserId: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Sistema (todos)</option>
                      {advertisers.map(adv => (
                        <option key={adv.id} value={adv.id}>{adv.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Modo de Exibição"
                      tooltip="Como as mídias do grupo serão exibidas: em ordem, aleatório ou por peso"
                      htmlFor="displayMode"
                    />
                    <select
                      id="displayMode"
                      value={formData.displayMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayMode: e.target.value as 'sequential' | 'random' | 'weighted' }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="sequential">Sequencial - Na ordem definida</option>
                      <option value="random">Aleatório - Ordem embaralhada</option>
                      <option value="weighted">Por Peso - Maior peso = mais exibições</option>
                    </select>
                  </div>
                </div>

                {/* Schedule */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-5 h-5 text-amber-500" />
                      <span className="font-semibold text-gray-900">Agendamento</span>
                      <Tooltip content="Defina quando este grupo estará disponível para exibição" position="top" iconOnly />
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scheduleEnabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduleEnabled: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {formData.scheduleEnabled && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data Início</label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hora Início</label>
                          <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Hora Fim</label>
                          <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                            className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dias da Semana</label>
                        <div className="flex flex-wrap gap-2">
                          {dayNames.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleDayOfWeek(index)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                formData.daysOfWeek.includes(index)
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <LabelWithTooltip
                      label="Mídias do Grupo"
                      tooltip="Selecione as mídias que farão parte deste grupo"
                    />
                    <span className="text-sm text-gray-500">
                      {formData.mediaIds.length} selecionada(s)
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {mediaItems.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Nenhuma mídia disponível. Crie mídias primeiro.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {mediaItems.map(media => (
                          <div
                            key={media.id}
                            onClick={() => toggleMediaInGroup(media.id)}
                            className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all ${
                              formData.mediaIds.includes(media.id)
                                ? 'ring-2 ring-amber-500 ring-offset-2'
                                : 'hover:opacity-80'
                            }`}
                          >
                            {media.thumbnailUrl ? (
                              <img
                                src={media.thumbnailUrl}
                                alt={media.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                {media.type === 'video' ? (
                                  <VideoCameraIcon className="w-8 h-8 text-gray-400" />
                                ) : (
                                  <PhotoIcon className="w-8 h-8 text-gray-400" />
                                )}
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-1.5">
                              <p className="text-xs text-white truncate">{media.title}</p>
                            </div>
                            {formData.mediaIds.includes(media.id) && (
                              <div className="absolute top-1 right-1 bg-amber-500 rounded-full p-0.5">
                                <CheckCircleIcon className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <span className="font-medium text-gray-900">Status do Grupo</span>
                    <p className="text-sm text-gray-500">Grupos inativos não são exibidos nas telas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      {formData.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
                  >
                    {editingGroup ? 'Salvar Alterações' : 'Criar Grupo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
