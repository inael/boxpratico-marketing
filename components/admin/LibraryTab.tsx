'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  FolderIcon,
  FolderPlusIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentIcon,
  PaperClipIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  TagIcon,
  ClockIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { LibraryItem, LibraryFolder, LibraryFileType, LIBRARY_FILE_TYPE_LABELS, Advertiser } from '@/types';
import Tooltip, { LabelWithTooltip } from '@/components/ui/Tooltip';
import EmptyState from './EmptyState';
import PageHeader from './PageHeader';
import { FolderOpen, Plus, Upload } from 'lucide-react';

// Ícone por tipo de arquivo
const FileTypeIcon = ({ type, className = 'w-6 h-6' }: { type: LibraryFileType; className?: string }) => {
  switch (type) {
    case 'image': return <PhotoIcon className={className} />;
    case 'video': return <VideoCameraIcon className={className} />;
    case 'audio': return <MusicalNoteIcon className={className} />;
    case 'document': return <DocumentIcon className={className} />;
    default: return <PaperClipIcon className={className} />;
  }
};

// Gerar slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Formatar tamanho de arquivo
function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// Formatar duração
function formatDuration(seconds?: number): string {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function LibraryTab() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LibraryFileType | ''>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [editingFolder, setEditingFolder] = useState<LibraryFolder | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [showGlobalLibrary, setShowGlobalLibrary] = useState(false);
  const [globalItems, setGlobalItems] = useState<LibraryItem[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [copyingItemId, setCopyingItemId] = useState<string | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    fileUrl: '',
    fileType: 'image' as LibraryFileType,
    mimeType: '',
    fileSize: 0,
    width: 0,
    height: 0,
    duration: 0,
    thumbnailUrl: '',
    folder: '',
    tags: '',
    description: '',
    advertiserId: '',
  });

  // Folder form state
  const [folderForm, setFolderForm] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
    icon: '📁',
    advertiserId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [libraryRes, advertisersRes] = await Promise.all([
        fetch('/api/library'),
        fetch('/api/advertisers'),
      ]);

      if (libraryRes.ok) {
        const data = await libraryRes.json();
        setItems(data.items || []);
        setFolders(data.folders || []);
      }
      if (advertisersRes.ok) {
        setAdvertisers(await advertisersRes.json());
      }
    } catch (error) {
      console.error('Erro ao carregar biblioteca:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get breadcrumb path
  const getBreadcrumb = (): { id: string | null; name: string }[] => {
    const path: { id: string | null; name: string }[] = [{ id: null, name: 'Biblioteca' }];
    if (currentFolder) {
      const folder = folders.find(f => f.id === currentFolder);
      if (folder) {
        path.push({ id: folder.id, name: folder.name });
      }
    }
    return path;
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // Folder filter
    if (currentFolder && item.folder !== currentFolder) return false;
    if (!currentFolder && item.folder) return false;

    // Type filter
    if (filterType && item.fileType !== filterType) return false;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        item.name.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.tags?.some(t => t.toLowerCase().includes(search))
      );
    }

    return true;
  });

  // Filter folders for current view
  const currentFolders = folders.filter(f => {
    if (currentFolder) return f.parentId === currentFolder;
    return !f.parentId;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: uploadForm.name,
      fileUrl: uploadForm.fileUrl,
      fileType: uploadForm.fileType,
      mimeType: uploadForm.mimeType,
      fileSize: uploadForm.fileSize || undefined,
      width: uploadForm.width || undefined,
      height: uploadForm.height || undefined,
      duration: uploadForm.duration || undefined,
      thumbnailUrl: uploadForm.thumbnailUrl || undefined,
      folder: currentFolder || undefined,
      tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: uploadForm.description,
      advertiserId: uploadForm.advertiserId || undefined,
    };

    try {
      const url = editingItem ? `/api/library/${editingItem.id}` : '/api/library';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetUploadForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar item');
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
    }
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      createFolder: !editingFolder,
      updateFolder: !!editingFolder,
      name: folderForm.name,
      slug: folderForm.slug,
      color: folderForm.color,
      icon: folderForm.icon,
      parentId: currentFolder || undefined,
      advertiserId: folderForm.advertiserId || undefined,
    };

    try {
      const url = editingFolder ? `/api/library/${editingFolder.id}` : '/api/library';
      const method = editingFolder ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetFolderForm();
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar pasta');
      }
    } catch (error) {
      console.error('Erro ao salvar pasta:', error);
    }
  };

  const handleDelete = async (id: string, isFolder = false) => {
    if (!confirm(`Tem certeza que deseja excluir ${isFolder ? 'esta pasta' : 'este item'}?`)) return;

    try {
      const url = isFolder ? `/api/library/${id}?type=folder` : `/api/library/${id}`;
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} itens?`)) return;

    try {
      await Promise.all(
        Array.from(selectedItems).map(id =>
          fetch(`/api/library/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir itens:', error);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      name: '',
      fileUrl: '',
      fileType: 'image',
      mimeType: '',
      fileSize: 0,
      width: 0,
      height: 0,
      duration: 0,
      thumbnailUrl: '',
      folder: '',
      tags: '',
      description: '',
      advertiserId: '',
    });
    setEditingItem(null);
    setShowUploadModal(false);
  };

  const resetFolderForm = () => {
    setFolderForm({
      name: '',
      slug: '',
      color: '#3B82F6',
      icon: '📁',
      advertiserId: '',
    });
    setEditingFolder(null);
    setShowFolderModal(false);
  };

  const handleEditItem = (item: LibraryItem) => {
    setEditingItem(item);
    setUploadForm({
      name: item.name,
      fileUrl: item.fileUrl,
      fileType: item.fileType,
      mimeType: item.mimeType || '',
      fileSize: item.fileSize || 0,
      width: item.width || 0,
      height: item.height || 0,
      duration: item.duration || 0,
      thumbnailUrl: item.thumbnailUrl || '',
      folder: item.folder || '',
      tags: item.tags?.join(', ') || '',
      description: item.description || '',
      advertiserId: item.advertiserId || '',
    });
    setShowUploadModal(true);
  };

  const handleEditFolder = (folder: LibraryFolder) => {
    setEditingFolder(folder);
    setFolderForm({
      name: folder.name,
      slug: folder.slug,
      color: folder.color || '#3B82F6',
      icon: folder.icon || '📁',
      advertiserId: folder.advertiserId || '',
    });
    setShowFolderModal(true);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(i => i.id)));
    }
  };

  const getAdvertiserName = (id?: string) => {
    if (!id) return 'Sistema';
    return advertisers.find(a => a.id === id)?.name || 'Desconhecido';
  };

  // Carregar biblioteca global
  const fetchGlobalItems = async () => {
    setLoadingGlobal(true);
    try {
      const res = await fetch('/api/library/global');
      if (res.ok) {
        setGlobalItems(await res.json());
      }
    } catch (error) {
      console.error('Erro ao carregar biblioteca global:', error);
    } finally {
      setLoadingGlobal(false);
    }
  };

  // Copiar item global para biblioteca do tenant
  const handleCopyGlobalItem = async (item: LibraryItem) => {
    setCopyingItemId(item.id);
    try {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          fileUrl: item.fileUrl,
          fileType: item.fileType,
          mimeType: item.mimeType,
          fileSize: item.fileSize,
          width: item.width,
          height: item.height,
          duration: item.duration,
          thumbnailUrl: item.thumbnailUrl,
          tags: item.tags?.filter(t => t !== 'biblioteca-global'),
          description: item.description,
        }),
      });
      if (res.ok) {
        fetchData();
        alert('Midia copiada para sua biblioteca!');
      }
    } catch (error) {
      console.error('Erro ao copiar item:', error);
    } finally {
      setCopyingItemId(null);
    }
  };

  const fileTypes: LibraryFileType[] = ['image', 'video', 'audio', 'document', 'other'];
  const folderColors = ['#3B82F6', '#22C55E', '#EAB308', '#F97316', '#EF4444', '#A855F7', '#EC4899', '#6B7280'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de Mídia"
        helpTitle="Biblioteca de Mídia"
        helpDescription="Faça upload de imagens, vídeos, configure feeds RSS e câmeras RTMP. Organize sua biblioteca de conteúdo para usar em campanhas e grades."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFolderModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
            >
              <FolderPlusIcon className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Nova Pasta</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span className="font-medium">Adicionar Arquivo</span>
            </button>
          </div>
        }
      />

      {/* Toggle Biblioteca Global */}
      <div className="flex gap-2">
        <button
          onClick={() => { setShowGlobalLibrary(false); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showGlobalLibrary ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Minha Biblioteca
        </button>
        <button
          onClick={() => { setShowGlobalLibrary(true); if (globalItems.length === 0) fetchGlobalItems(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showGlobalLibrary ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Biblioteca BoxPratico
        </button>
      </div>

      {showGlobalLibrary ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Midias pre-cadastradas disponiveis para uso. Clique em &quot;Copiar&quot; para adicionar a sua biblioteca.
          </p>
          {loadingGlobal ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : globalItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <p className="text-gray-500">Nenhuma midia global disponivel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {globalItems.map(item => {
                const catTag = item.tags?.find(t => t.startsWith('categoria:'));
                const catLabel = catTag ? catTag.replace('categoria:', '') : '';
                return (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center">
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileTypeIcon type={item.fileType} className="w-10 h-10 text-gray-300" />
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      {catLabel && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{catLabel}</span>
                      )}
                      <button
                        onClick={() => handleCopyGlobalItem(item)}
                        disabled={copyingItemId === item.id}
                        className="mt-2 w-full py-2 text-sm font-medium text-amber-600 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50"
                      >
                        {copyingItemId === item.id ? 'Copiando...' : 'Copiar para minha biblioteca'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        {getBreadcrumb().map((crumb, index, arr) => (
          <div key={crumb.id || 'root'} className="flex items-center gap-2">
            <button
              onClick={() => setCurrentFolder(crumb.id)}
              className={`hover:text-amber-600 transition-colors ${
                index === arr.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-500'
              }`}
            >
              {crumb.name}
            </button>
            {index < arr.length - 1 && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, descrição ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as LibraryFileType | '')}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
          >
            <option value="">Todos os tipos</option>
            {fileTypes.map(type => (
              <option key={type} value={type}>{LIBRARY_FILE_TYPE_LABELS[type]}</option>
            ))}
          </select>

          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <Tooltip content="Grade" position="top">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow text-amber-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </Tooltip>
            <Tooltip content="Lista" position="top">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow text-amber-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-3 bg-amber-50 border border-amber-200 rounded-xl"
        >
          <span className="text-sm font-medium text-amber-800">
            {selectedItems.size} {selectedItems.size === 1 ? 'item selecionado' : 'itens selecionados'}
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Excluir
          </button>
          <button
            onClick={() => setSelectedItems(new Set())}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Limpar seleção
          </button>
        </motion.div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Folders */}
        {currentFolders.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pastas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {currentFolders.map(folder => (
                <div
                  key={folder.id}
                  className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
                  onDoubleClick={() => setCurrentFolder(folder.id)}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-2"
                      style={{ backgroundColor: `${folder.color}20` }}
                    >
                      {folder.icon || '📁'}
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate w-full">
                      {folder.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {items.filter(i => i.folder === folder.id).length} itens
                    </p>
                  </div>
                  {/* Actions on hover */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <PencilIcon className="w-3.5 h-3.5 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, true); }}
                      className="p-1.5 bg-white rounded-lg shadow hover:bg-red-50"
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">
            {searchTerm || filterType ? (
              <EmptyState
                variant="filter"
                title="Nenhum arquivo encontrado"
                description="Nenhum arquivo corresponde aos filtros selecionados. Tente ajustar os filtros."
                mascotImage="/images/mascot-search.png"
              />
            ) : (
              <EmptyState
                title="Biblioteca vazia"
                description="Faça upload de imagens, vídeos e outros arquivos para usar em suas campanhas e grades de programação."
                icon={FolderOpen}
                mascotImage="/images/mascot-empty.png"
                primaryAction={{
                  label: 'Fazer Upload',
                  onClick: () => document.getElementById('file-upload')?.click(),
                  icon: Upload,
                }}
              />
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div>
            {currentFolders.length > 0 && (
              <h3 className="text-sm font-medium text-gray-500 mb-2">Arquivos</h3>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredItems.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all ${
                    selectedItems.has(item.id) ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
                  }`}
                >
                  {/* Thumbnail */}
                  <div
                    className="aspect-square bg-gray-100 relative cursor-pointer"
                    onClick={() => toggleSelectItem(item.id)}
                  >
                    {item.thumbnailUrl || (item.fileType === 'image' && item.fileUrl) ? (
                      <img
                        src={item.thumbnailUrl || item.fileUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileTypeIcon type={item.fileType} className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Selection checkbox */}
                    <div className={`absolute top-2 left-2 ${selectedItems.has(item.id) || 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedItems.has(item.id)
                          ? 'bg-amber-500 border-amber-500'
                          : 'bg-white/80 border-gray-300'
                      }`}>
                        {selectedItems.has(item.id) && (
                          <CheckCircleIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Type badge */}
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded-full uppercase">
                        {item.fileType}
                      </span>
                    </div>

                    {/* Duration for video/audio */}
                    {item.duration && (
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded">
                          {formatDuration(item.duration)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatFileSize(item.fileSize)}
                      {item.width && item.height && ` • ${item.width}x${item.height}`}
                    </p>
                  </div>

                  {/* Actions on hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-center gap-2">
                      <Tooltip content="Visualizar" position="top">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <EyeIcon className="w-4 h-4 text-gray-700" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Editar" position="top">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-700" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Excluir" position="top">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                      onChange={selectAll}
                      className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Arquivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Tamanho</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden xl:table-cell">Tags</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {item.thumbnailUrl || (item.fileType === 'image' && item.fileUrl) ? (
                            <img src={item.thumbnailUrl || item.fileUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileTypeIcon type={item.fileType} className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 truncate">{item.description || 'Sem descrição'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {LIBRARY_FILE_TYPE_LABELS[item.fileType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                      {formatFileSize(item.fileSize)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {item.tags && item.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{item.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload/Edit Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={resetUploadForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Editar Arquivo' : 'Adicionar Arquivo'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Adicione arquivos de mídia à sua biblioteca
                </p>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <LabelWithTooltip
                      label="Nome do Arquivo"
                      tooltip="Nome para identificação do arquivo na biblioteca"
                      required
                      htmlFor="name"
                    />
                    <input
                      id="name"
                      type="text"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <LabelWithTooltip
                      label="URL do Arquivo"
                      tooltip="Link direto para o arquivo de mídia (pode ser do Cloudinary, S3, etc)"
                      required
                      htmlFor="fileUrl"
                    />
                    <input
                      id="fileUrl"
                      type="url"
                      value={uploadForm.fileUrl}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://..."
                      required
                    />
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Tipo de Arquivo"
                      tooltip="Categoria do arquivo para organização"
                      required
                      htmlFor="fileType"
                    />
                    <select
                      id="fileType"
                      value={uploadForm.fileType}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, fileType: e.target.value as LibraryFileType }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      {fileTypes.map(type => (
                        <option key={type} value={type}>{LIBRARY_FILE_TYPE_LABELS[type]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Anunciante"
                      tooltip="Proprietário do arquivo. Deixe vazio para arquivos do sistema"
                      htmlFor="advertiserId"
                    />
                    <select
                      id="advertiserId"
                      value={uploadForm.advertiserId}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, advertiserId: e.target.value }))}
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
                      label="URL da Thumbnail"
                      tooltip="Miniatura para exibição. Se não informada, será usada a imagem principal"
                      htmlFor="thumbnailUrl"
                    />
                    <input
                      id="thumbnailUrl"
                      type="url"
                      value={uploadForm.thumbnailUrl}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Tags"
                      tooltip="Palavras-chave para busca e organização (separadas por vírgula)"
                      htmlFor="tags"
                    />
                    <input
                      id="tags"
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="promoção, verão, 2024"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <LabelWithTooltip
                      label="Descrição"
                      tooltip="Descrição detalhada do arquivo"
                      htmlFor="description"
                    />
                    <textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Optional dimensions */}
                  <div className="sm:col-span-2 border-t border-gray-100 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">Informações Técnicas (opcional)</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Largura (px)</label>
                        <input
                          type="number"
                          value={uploadForm.width || ''}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Altura (px)</label>
                        <input
                          type="number"
                          value={uploadForm.height || ''}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Duração (s)</label>
                        <input
                          type="number"
                          value={uploadForm.duration || ''}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tamanho (bytes)</label>
                        <input
                          type="number"
                          value={uploadForm.fileSize || ''}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, fileSize: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={resetUploadForm}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
                  >
                    {editingItem ? 'Salvar Alterações' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folder Modal */}
      <AnimatePresence>
        {showFolderModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={resetFolderForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingFolder ? 'Editar Pasta' : 'Nova Pasta'}
                </h3>
              </div>

              <form onSubmit={handleFolderSubmit} className="p-6 space-y-4">
                <div>
                  <LabelWithTooltip
                    label="Nome da Pasta"
                    tooltip="Nome para identificar a pasta"
                    required
                    htmlFor="folderName"
                  />
                  <input
                    id="folderName"
                    type="text"
                    value={folderForm.name}
                    onChange={(e) => setFolderForm(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: !editingFolder ? generateSlug(e.target.value) : prev.slug,
                    }))}
                    className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                    <div className="flex flex-wrap gap-2">
                      {folderColors.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFolderForm(prev => ({ ...prev, color }))}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            folderForm.color === color ? 'ring-2 ring-offset-2 ring-amber-500' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ícone</label>
                    <input
                      type="text"
                      value={folderForm.icon}
                      onChange={(e) => setFolderForm(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-16 px-3 py-2 border border-gray-200 rounded-lg text-center text-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={resetFolderForm}
                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
                  >
                    {editingFolder ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewItem(null)}
          >
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-8 h-8" />
            </button>

            <div className="max-w-4xl max-h-[80vh] w-full" onClick={(e) => e.stopPropagation()}>
              {previewItem.fileType === 'image' ? (
                <img
                  src={previewItem.fileUrl}
                  alt={previewItem.name}
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg"
                />
              ) : previewItem.fileType === 'video' ? (
                <video
                  src={previewItem.fileUrl}
                  controls
                  className="max-w-full max-h-[70vh] mx-auto rounded-lg"
                />
              ) : previewItem.fileType === 'audio' ? (
                <div className="bg-white rounded-xl p-8 max-w-md mx-auto">
                  <MusicalNoteIcon className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                  <p className="text-center font-medium mb-4">{previewItem.name}</p>
                  <audio src={previewItem.fileUrl} controls className="w-full" />
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 max-w-md mx-auto text-center">
                  <FileTypeIcon type={previewItem.fileType} className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="font-medium mb-2">{previewItem.name}</p>
                  <a
                    href={previewItem.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-600 hover:underline"
                  >
                    Abrir arquivo
                  </a>
                </div>
              )}

              {/* File info */}
              <div className="mt-4 text-center text-white/80 text-sm">
                <p className="font-medium text-white">{previewItem.name}</p>
                <p>
                  {LIBRARY_FILE_TYPE_LABELS[previewItem.fileType]}
                  {previewItem.fileSize && ` • ${formatFileSize(previewItem.fileSize)}`}
                  {previewItem.width && previewItem.height && ` • ${previewItem.width}x${previewItem.height}`}
                  {previewItem.duration && ` • ${formatDuration(previewItem.duration)}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
