'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  DocumentIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  TagIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { LibraryItem, LibraryFileType } from '@/types';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';

// Categorias da biblioteca global
const GLOBAL_CATEGORIES = [
  { value: 'saude', label: 'Saude', emoji: '🏥', color: 'bg-green-100 text-green-800' },
  { value: 'financas', label: 'Financas', emoji: '💰', color: 'bg-blue-100 text-blue-800' },
  { value: 'entretenimento', label: 'Entretenimento', emoji: '🎭', color: 'bg-purple-100 text-purple-800' },
  { value: 'informativos', label: 'Informativos', emoji: '📰', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'datas', label: 'Datas Comemorativas', emoji: '🎉', color: 'bg-pink-100 text-pink-800' },
  { value: 'institucional', label: 'Institucional', emoji: '🏢', color: 'bg-gray-100 text-gray-800' },
];

const FileTypeIcon = ({ type, className = 'w-6 h-6' }: { type: LibraryFileType; className?: string }) => {
  switch (type) {
    case 'image': return <PhotoIcon className={className} />;
    case 'video': return <VideoCameraIcon className={className} />;
    case 'audio': return <MusicalNoteIcon className={className} />;
    case 'document': return <DocumentIcon className={className} />;
    default: return <PaperClipIcon className={className} />;
  }
};

function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GlobalLibraryTab() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<LibraryFileType | ''>('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileType, setFormFileType] = useState<LibraryFileType>('image');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formDuration, setFormDuration] = useState<number>(0);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/library/global');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (error) {
      console.error('Erro ao carregar biblioteca global:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formName,
      fileUrl: formFileUrl,
      fileType: formFileType,
      folder: formCategory ? `biblioteca-${formCategory}` : 'biblioteca-geral',
      tags: [
        ...formTags.split(',').map(t => t.trim()).filter(Boolean),
        formCategory ? `categoria:${formCategory}` : '',
        'biblioteca-global',
      ].filter(Boolean),
      description: formDescription,
      thumbnailUrl: formThumbnailUrl || undefined,
      duration: formDuration || undefined,
      isActive: true,
    };

    try {
      const url = editingItem ? `/api/library/global/${editingItem.id}` : '/api/library/global';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchItems();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar item');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item da biblioteca global?')) return;

    try {
      const res = await fetch(`/api/library/global/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    }
  };

  const handleEdit = (item: LibraryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormFileUrl(item.fileUrl);
    setFormFileType(item.fileType);
    setFormDescription(item.description || '');
    setFormThumbnailUrl(item.thumbnailUrl || '');
    setFormDuration(item.duration || 0);
    // Extrair categoria das tags
    const catTag = item.tags?.find(t => t.startsWith('categoria:'));
    setFormCategory(catTag ? catTag.replace('categoria:', '') : '');
    setFormTags(item.tags?.filter(t => !t.startsWith('categoria:') && t !== 'biblioteca-global').join(', ') || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormName('');
    setFormFileUrl('');
    setFormFileType('image');
    setFormCategory('');
    setFormDescription('');
    setFormTags('');
    setFormThumbnailUrl('');
    setFormDuration(0);
    setShowForm(false);
  };

  const getCategoryInfo = (item: LibraryItem) => {
    const catTag = item.tags?.find(t => t.startsWith('categoria:'));
    const catValue = catTag ? catTag.replace('categoria:', '') : '';
    return GLOBAL_CATEGORIES.find(c => c.value === catValue) || null;
  };

  const filteredItems = items.filter(item => {
    if (filterType && item.fileType !== filterType) return false;
    if (filterCategory) {
      const cat = getCategoryInfo(item);
      if (!cat || cat.value !== filterCategory) return false;
    }
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

  // Agrupar por categoria
  const itemsByCategory = GLOBAL_CATEGORIES.map(cat => ({
    ...cat,
    items: filteredItems.filter(item => {
      const catInfo = getCategoryInfo(item);
      return catInfo?.value === cat.value;
    }),
  }));

  const uncategorized = filteredItems.filter(item => !getCategoryInfo(item));

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca Global"
        helpTitle="Biblioteca Global"
        helpDescription="Gerencie midias pre-cadastradas disponiveis para todos os tenants. Organize por categorias como Saude, Financas, Datas Comemorativas."
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            Adicionar Midia
          </button>
        }
      />

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar na biblioteca global..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Todas categorias</option>
            {GLOBAL_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as LibraryFileType | '')}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Todos tipos</option>
            <option value="image">Imagens</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="document">Documentos</option>
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingItem ? 'Editar Midia' : 'Nova Midia Global'}
            </h3>
            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Dicas de Saude - Janeiro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">Selecione...</option>
                  {GLOBAL_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL do Arquivo *</label>
              <input
                type="url"
                value={formFileUrl}
                onChange={(e) => setFormFileUrl(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Arquivo</label>
                <select
                  value={formFileType}
                  onChange={(e) => setFormFileType(e.target.value as LibraryFileType)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="image">Imagem</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Documento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input
                  type="url"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duracao (s)</label>
                <input
                  type="number"
                  min={0}
                  value={formDuration}
                  onChange={(e) => setFormDuration(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                placeholder="Descricao da midia..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por virgula)</label>
              <input
                type="text"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="dengue, prevencao, saude"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {editingItem ? 'Atualizar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Lista por categoria */}
      {items.length === 0 ? (
        <EmptyState
          title="Biblioteca global vazia"
          description="Adicione midias que estarao disponiveis para todos os tenants da plataforma."
          primaryAction={{
            label: 'Adicionar primeira midia',
            onClick: () => setShowForm(true),
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Contadores */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {GLOBAL_CATEGORIES.map(cat => {
              const count = items.filter(i => getCategoryInfo(i)?.value === cat.value).length;
              return (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(filterCategory === cat.value ? '' : cat.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    filterCategory === cat.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <p className="text-xs font-medium text-gray-700 mt-1">{cat.label}</p>
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                </button>
              );
            })}
          </div>

          {/* Tabela de itens */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Midia</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tags</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map(item => {
                    const cat = getCategoryInfo(item);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileTypeIcon type={item.fileType} className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {cat ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cat.color}`}>
                              {cat.emoji} {cat.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Sem categoria</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 capitalize">{item.fileType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {item.tags?.filter(t => !t.startsWith('categoria:') && t !== 'biblioteca-global').slice(0, 3).map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {item.fileUrl && (
                              <a
                                href={item.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Visualizar"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Excluir"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Nenhum item encontrado com os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
