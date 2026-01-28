'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ListVideo,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit3,
  Copy,
  MoreVertical,
  Clock,
  Monitor,
  Search,
  Filter,
  GripVertical,
  Calendar,
  Image,
  Video,
  Rss,
  Camera,
  Eye,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';
// Tipos removidos pois usamos mocks locais
// import { MediaItem, Campaign, Condominium, Monitor as MonitorType } from '@/types';

interface PlaylistItem {
  id: string;
  mediaId?: string;
  mediaGroupId?: string;
  type: 'media' | 'group' | 'rss' | 'camera';
  duration: number; // em segundos
  order: number;
  // Dados enriquecidos do media/grupo
  title?: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video' | 'rss' | 'camera';
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  totalDuration: number; // calculado
  monitorIds: string[];
  isActive: boolean;
  schedule?: {
    enabled: boolean;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };
  createdAt: string;
  updatedAt: string;
}

// Dados mockados para demonstração
const mockPlaylists: Playlist[] = [
  {
    id: 'pl-001',
    name: 'Grade Shopping Center',
    description: 'Grade padrão para telas do shopping',
    items: [
      { id: 'item-1', mediaId: 'media-1', type: 'media', duration: 15, order: 0, title: 'Coca-Cola Natal', thumbnailUrl: '/placeholder-video.jpg', mediaType: 'video' },
      { id: 'item-2', mediaId: 'media-2', type: 'media', duration: 15, order: 1, title: 'Nike Verão 2026', thumbnailUrl: '/placeholder-video.jpg', mediaType: 'video' },
      { id: 'item-3', type: 'rss', duration: 20, order: 2, title: 'Feed de Notícias', mediaType: 'rss' },
      { id: 'item-4', mediaId: 'media-3', type: 'media', duration: 10, order: 3, title: 'Institucional BoxPratico', thumbnailUrl: '/placeholder-image.jpg', mediaType: 'image' },
    ],
    totalDuration: 60,
    monitorIds: ['monitor-001', 'monitor-002', 'monitor-003'],
    isActive: true,
    schedule: { enabled: true, startTime: '08:00', endTime: '22:00', daysOfWeek: [1, 2, 3, 4, 5, 6] },
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-20T15:30:00Z',
  },
  {
    id: 'pl-002',
    name: 'Grade Academia FitLife',
    description: 'Conteúdo motivacional e anúncios fitness',
    items: [
      { id: 'item-5', mediaId: 'media-4', type: 'media', duration: 15, order: 0, title: 'Nike Running 2026', thumbnailUrl: '/placeholder-video.jpg', mediaType: 'video' },
      { id: 'item-6', type: 'camera', duration: 30, order: 1, title: 'Câmera ao Vivo', mediaType: 'camera' },
      { id: 'item-7', mediaId: 'media-5', type: 'media', duration: 10, order: 2, title: 'Dica de Saúde', thumbnailUrl: '/placeholder-image.jpg', mediaType: 'image' },
    ],
    totalDuration: 55,
    monitorIds: ['monitor-004'],
    isActive: true,
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-01-22T09:15:00Z',
  },
  {
    id: 'pl-003',
    name: 'Grade Padaria Pinheiros',
    description: 'Grade para as telas da padaria',
    items: [
      { id: 'item-8', mediaId: 'media-1', type: 'media', duration: 15, order: 0, title: 'Coca-Cola Natal', thumbnailUrl: '/placeholder-video.jpg', mediaType: 'video' },
      { id: 'item-9', type: 'rss', duration: 15, order: 1, title: 'Notícias do Dia', mediaType: 'rss' },
    ],
    totalDuration: 30,
    monitorIds: ['monitor-005', 'monitor-006'],
    isActive: false,
    createdAt: '2026-01-10T14:00:00Z',
    updatedAt: '2026-01-10T14:00:00Z',
  },
];

interface MockMediaItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  thumbnailUrl?: string;
  duration: number;
}

const mockMediaItems: MockMediaItem[] = [
  { id: 'media-1', title: 'Coca-Cola Natal', type: 'video', thumbnailUrl: '/placeholder-video.jpg', duration: 15 },
  { id: 'media-2', title: 'Nike Verão 2026', type: 'video', thumbnailUrl: '/placeholder-video.jpg', duration: 15 },
  { id: 'media-3', title: 'Institucional BoxPratico', type: 'image', thumbnailUrl: '/placeholder-image.jpg', duration: 10 },
  { id: 'media-4', title: 'Nike Running 2026', type: 'video', thumbnailUrl: '/placeholder-video.jpg', duration: 15 },
  { id: 'media-5', title: 'Dica de Saúde', type: 'image', thumbnailUrl: '/placeholder-image.jpg', duration: 10 },
];

export default function PlaylistsTab() {
  const [playlists, setPlaylists] = useState<Playlist[]>(mockPlaylists);
  const [mediaItems] = useState<MockMediaItem[]>(mockMediaItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    items: [] as PlaylistItem[],
    monitorIds: [] as string[],
    isActive: true,
    scheduleEnabled: false,
    startTime: '',
    endTime: '',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[],
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  // Filtrar playlists
  const filteredPlaylists = useMemo(() => {
    let filtered = [...playlists];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p =>
        statusFilter === 'active' ? p.isActive : !p.isActive
      );
    }

    return filtered.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [playlists, searchQuery, statusFilter]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = playlists.length;
    const active = playlists.filter(p => p.isActive).length;
    const totalItems = playlists.reduce((sum, p) => sum + p.items.length, 0);
    const totalMonitors = new Set(playlists.flatMap(p => p.monitorIds)).size;

    return { total, active, totalItems, totalMonitors };
  }, [playlists]);

  const getMediaIcon = (type?: string) => {
    switch (type) {
      case 'video': return Video;
      case 'image': return Image;
      case 'rss': return Rss;
      case 'camera': return Camera;
      default: return Image;
    }
  };

  const handleToggleActive = (playlistId: string) => {
    setPlaylists(prev =>
      prev.map(p =>
        p.id === playlistId ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const handleDelete = (playlistId: string) => {
    if (confirm('Tem certeza que deseja excluir esta grade?')) {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    }
  };

  const handleDuplicate = (playlist: Playlist) => {
    const newPlaylist: Playlist = {
      ...playlist,
      id: `pl-${Date.now()}`,
      name: `${playlist.name} (cópia)`,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPlaylists(prev => [newPlaylist, ...prev]);
  };

  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
      items: [...playlist.items],
      monitorIds: [...playlist.monitorIds],
      isActive: playlist.isActive,
      scheduleEnabled: playlist.schedule?.enabled || false,
      startTime: playlist.schedule?.startTime || '',
      endTime: playlist.schedule?.endTime || '',
      daysOfWeek: playlist.schedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    });
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingPlaylist(null);
    setFormData({
      name: '',
      description: '',
      items: [],
      monitorIds: [],
      isActive: true,
      scheduleEnabled: false,
      startTime: '',
      endTime: '',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });
    setShowForm(true);
  };

  const handleReorderItems = (newItems: PlaylistItem[]) => {
    setFormData(prev => ({
      ...prev,
      items: newItems.map((item, index) => ({ ...item, order: index })),
    }));
  };

  const handleAddMediaToPlaylist = (media: MockMediaItem) => {
    const newItem: PlaylistItem = {
      id: `item-${Date.now()}`,
      mediaId: media.id,
      type: 'media',
      duration: media.duration || 15,
      order: formData.items.length,
      title: media.title,
      thumbnailUrl: media.thumbnailUrl,
      mediaType: media.type as 'image' | 'video',
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const handleRemoveItemFromPlaylist = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== itemId).map((item, index) => ({ ...item, order: index })),
    }));
  };

  const handleSavePlaylist = () => {
    const totalDuration = formData.items.reduce((sum, item) => sum + item.duration, 0);
    const now = new Date().toISOString();

    if (editingPlaylist) {
      setPlaylists(prev =>
        prev.map(p =>
          p.id === editingPlaylist.id
            ? {
                ...p,
                name: formData.name,
                description: formData.description,
                items: formData.items,
                totalDuration,
                monitorIds: formData.monitorIds,
                isActive: formData.isActive,
                schedule: {
                  enabled: formData.scheduleEnabled,
                  startTime: formData.startTime,
                  endTime: formData.endTime,
                  daysOfWeek: formData.daysOfWeek,
                },
                updatedAt: now,
              }
            : p
        )
      );
    } else {
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        items: formData.items,
        totalDuration,
        monitorIds: formData.monitorIds,
        isActive: formData.isActive,
        schedule: {
          enabled: formData.scheduleEnabled,
          startTime: formData.startTime,
          endTime: formData.endTime,
          daysOfWeek: formData.daysOfWeek,
        },
        createdAt: now,
        updatedAt: now,
      };
      setPlaylists(prev => [newPlaylist, ...prev]);
    }

    setShowForm(false);
    setEditingPlaylist(null);
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (playlists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader
          title="Grades de Programação"
          helpTitle="Grades de Programação"
          helpDescription="Monte grades de programação definindo a sequência de mídias, vídeos, feeds RSS e câmeras que serão exibidos em cada tela. Arraste para reordenar e defina a duração de cada item."
        />
        <EmptyState
          title="Nenhuma grade criada"
          description="Grades de programação definem quais mídias serão exibidas em cada tela e em qual ordem. Crie sua primeira grade para começar."
          icon={ListVideo}
          primaryAction={{
            label: 'Criar Grade',
            onClick: handleCreateNew,
            icon: Plus,
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Grades de Programação"
        helpTitle="Grades de Programação"
        helpDescription="Monte grades de programação definindo a sequência de mídias, vídeos, feeds RSS e câmeras que serão exibidos em cada tela. Arraste para reordenar e defina a duração de cada item."
      />

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <ListVideo className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Grades</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-sm text-gray-500">Grades Ativas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
              <p className="text-sm text-gray-500">Itens nas Grades</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMonitors}</p>
              <p className="text-sm text-gray-500">Telas Vinculadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar grades..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativas</option>
                <option value="inactive">Inativas</option>
              </select>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Grade
            </button>
          </div>
        </div>

        {/* Lista de Grades */}
        <div className="divide-y divide-gray-100">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <ListVideo className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{playlist.name}</p>
                    <p className="text-sm text-gray-500">{playlist.description || 'Sem descrição'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        {playlist.items.length} itens
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(playlist.totalDuration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        {playlist.monitorIds.length} telas
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Preview dos itens */}
                  <div className="hidden md:flex items-center -space-x-2">
                    {playlist.items.slice(0, 4).map((item, idx) => {
                      const Icon = getMediaIcon(item.mediaType);
                      return (
                        <div
                          key={item.id}
                          className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center"
                          title={item.title}
                        >
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                      );
                    })}
                    {playlist.items.length > 4 && (
                      <div className="w-8 h-8 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                        +{playlist.items.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                    playlist.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {playlist.isActive ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Ativa
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Inativa
                      </>
                    )}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewPlaylist(playlist)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(playlist)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(playlist)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(playlist.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        playlist.isActive
                          ? 'text-amber-500 hover:bg-amber-50'
                          : 'text-green-500 hover:bg-green-50'
                      }`}
                      title={playlist.isActive ? 'Pausar' : 'Ativar'}
                    >
                      {playlist.isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(playlist.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPlaylists.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <ListVideo className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma grade encontrada com os filtros selecionados</p>
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPlaylist ? 'Editar Grade' : 'Nova Grade de Programação'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Monte a sequência de mídias que será exibida nas telas
                </p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coluna Esquerda - Informações */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Grade *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ex: Grade Shopping Center"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        rows={2}
                        placeholder="Descrição opcional da grade"
                      />
                    </div>

                    {/* Agendamento */}
                    <div className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-indigo-500" />
                          <span className="font-medium text-gray-900">Agendamento</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.scheduleEnabled}
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduleEnabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>

                      {formData.scheduleEnabled && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Início</label>
                              <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Fim</label>
                              <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-2">Dias da Semana</label>
                            <div className="flex flex-wrap gap-1">
                              {dayNames.map((day, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      daysOfWeek: prev.daysOfWeek.includes(index)
                                        ? prev.daysOfWeek.filter(d => d !== index)
                                        : [...prev.daysOfWeek, index].sort(),
                                    }));
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    formData.daysOfWeek.includes(index)
                                      ? 'bg-indigo-500 text-white'
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

                    {/* Biblioteca de Mídias Disponíveis */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Biblioteca de Mídias
                      </label>
                      <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                          {mediaItems.map((media) => (
                            <button
                              key={media.id}
                              type="button"
                              onClick={() => handleAddMediaToPlaylist(media)}
                              className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all group"
                            >
                              {media.thumbnailUrl ? (
                                <img
                                  src={media.thumbnailUrl}
                                  alt={media.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  {media.type === 'video' ? (
                                    <Video className="w-6 h-6 text-gray-400" />
                                  ) : (
                                    <Image className="w-6 h-6 text-gray-400" />
                                  )}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Plus className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-1">
                                <p className="text-[10px] text-white truncate">{media.title}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita - Itens da Grade */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Itens da Grade ({formData.items.length})
                      </label>
                      <span className="text-sm text-gray-500">
                        Duração total: {formatDuration(formData.items.reduce((sum, i) => sum + i.duration, 0))}
                      </span>
                    </div>

                    <div className="border border-gray-200 rounded-xl min-h-[300px] max-h-[400px] overflow-y-auto">
                      {formData.items.length === 0 ? (
                        <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                          <ListVideo className="w-12 h-12 mb-2" />
                          <p className="text-sm">Adicione mídias da biblioteca</p>
                          <p className="text-xs">Clique nas mídias à esquerda</p>
                        </div>
                      ) : (
                        <Reorder.Group
                          axis="y"
                          values={formData.items}
                          onReorder={handleReorderItems}
                          className="p-2 space-y-2"
                        >
                          {formData.items.map((item) => {
                            const Icon = getMediaIcon(item.mediaType);
                            return (
                              <Reorder.Item
                                key={item.id}
                                value={item}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-move hover:bg-gray-100 transition-colors"
                              >
                                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                  {item.thumbnailUrl ? (
                                    <img
                                      src={item.thumbnailUrl}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Icon className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {item.title || 'Sem título'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.mediaType} • {formatDuration(item.duration)}
                                  </p>
                                </div>
                                <input
                                  type="number"
                                  value={item.duration}
                                  onChange={(e) => {
                                    const newDuration = parseInt(e.target.value) || 5;
                                    setFormData(prev => ({
                                      ...prev,
                                      items: prev.items.map(i =>
                                        i.id === item.id ? { ...i, duration: newDuration } : i
                                      ),
                                    }));
                                  }}
                                  className="w-16 px-2 py-1 text-sm border border-gray-200 rounded text-center"
                                  min={5}
                                  max={120}
                                />
                                <span className="text-xs text-gray-400">seg</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromPlaylist(item.id)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </Reorder.Item>
                            );
                          })}
                        </Reorder.Group>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePlaylist}
                  disabled={!formData.name || formData.items.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPlaylist ? 'Salvar Alterações' : 'Criar Grade'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Preview */}
      <AnimatePresence>
        {previewPlaylist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewPlaylist(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">{previewPlaylist.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {previewPlaylist.description || 'Sem descrição'}
                </p>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Duração: {formatDuration(previewPlaylist.totalDuration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Monitor className="w-4 h-4" />
                    {previewPlaylist.monitorIds.length} tela(s)
                  </span>
                  {previewPlaylist.schedule?.enabled && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {previewPlaylist.schedule.startTime} - {previewPlaylist.schedule.endTime}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-medium text-gray-700 mb-3">Sequência de Exibição:</h4>
                <div className="space-y-2">
                  {previewPlaylist.items.map((item, index) => {
                    const Icon = getMediaIcon(item.mediaType);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div className="w-16 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.mediaType}</p>
                        </div>
                        <span className="text-sm text-gray-600">{formatDuration(item.duration)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setPreviewPlaylist(null)}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
