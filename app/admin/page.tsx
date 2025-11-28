'use client';

import { useState, useEffect } from 'react';
import { Condominium, MediaItem } from '@/types';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminFooter from '@/components/admin/AdminFooter';
import {
  BuildingOfficeIcon,
  PhotoIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TvIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showCondoForm, setShowCondoForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);
  const [previewWindow, setPreviewWindow] = useState<Window | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadCondominiums();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedCondominium) {
      loadMediaItems();
    }
  }, [selectedCondominium]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const adminPassword = 'admin123';
    if (password === adminPassword) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta');
    }
  }

  async function loadCondominiums() {
    const res = await fetch('/api/condominiums');
    const data = await res.json();
    setCondominiums(data);
    if (data.length > 0 && !selectedCondominium) {
      setSelectedCondominium(data[0].id);
    }
  }

  async function loadMediaItems() {
    const res = await fetch(`/api/media-items?condominiumId=${selectedCondominium}`);
    const data = await res.json();
    setMediaItems(data);
  }

  async function handleCreateCondominium(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      cnpj: formData.get('cnpj') as string,
      address: formData.get('address') as string,
      isActive: true,
    };

    const res = await fetch('/api/condominiums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setShowCondoForm(false);
      loadCondominiums();
    }
  }

  async function handleUpdateCondominium(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingCondo) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      cnpj: formData.get('cnpj') as string,
      address: formData.get('address') as string,
    };

    const res = await fetch(`/api/condominiums/${editingCondo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setEditingCondo(null);
      loadCondominiums();
    }
  }

  async function handleDeleteCondominium(id: string) {
    const res = await fetch(`/api/condominiums/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadCondominiums();
      if (selectedCondominium === id) {
        setSelectedCondominium('');
      }
    }
  }

  async function toggleCondominiumActive(condo: Condominium) {
    await fetch(`/api/condominiums/${condo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !condo.isActive }),
    });
    loadCondominiums();
  }

  async function handleCreateMedia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let sourceUrl = formData.get('sourceUrl') as string;
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;

    if (file && file.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadData = await uploadRes.json();
      sourceUrl = uploadData.url;
    }

    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      type,
      sourceUrl,
      durationSeconds: parseInt(formData.get('durationSeconds') as string) || 10,
      isActive: true,
      order: mediaItems.length,
      condominiumId: selectedCondominium,
    };

    const res = await fetch('/api/media-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setShowMediaForm(false);
      loadMediaItems();
    }
  }

  async function handleDeleteMedia(id: string) {
    const res = await fetch(`/api/media-items/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadMediaItems();
    }
  }

  async function toggleMediaActive(item: MediaItem) {
    await fetch(`/api/media-items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    loadMediaItems();
  }

  async function toggleNews(condo: Condominium) {
    await fetch(`/api/condominiums/${condo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showNews: !condo.showNews }),
    });
    loadCondominiums();
  }

  function handleRefreshPreview() {
    if (previewWindow && !previewWindow.closed) {
      previewWindow.postMessage('refresh-player', '*');
    }
  }

  function handleOpenPreview() {
    if (selectedCondoData) {
      const url = `/admin/${encodeURIComponent(selectedCondoData.slug)}/preview`;
      const newWindow = window.open(url, 'preview', 'width=1920,height=1080');
      setPreviewWindow(newWindow);
    }
  }

  const selectedCondoData = condominiums.find(c => c.id === selectedCondominium);
  const activeCondos = condominiums.filter(c => c.isActive !== false);
  const inactiveCondos = condominiums.filter(c => c.isActive === false);
  const activeMedia = mediaItems.filter(m => m.isActive);
  const inactiveMedia = mediaItems.filter(m => !m.isActive);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-96"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">BP</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Admin Login</h1>
            <p className="text-gray-600 mt-2">BoxPrático Marketing</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Entrar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col">
        <AdminHeader />

        <main className="flex-1 p-8 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600 mt-1">Visão geral do sistema</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <BuildingOfficeIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
                      Ativos
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{activeCondos.length}</h3>
                  <p className="text-gray-600 text-sm mt-1">Condomínios Ativos</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                      <PhotoIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                      Total
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{activeMedia.length}</h3>
                  <p className="text-gray-600 text-sm mt-1">Mídias Ativas</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                      <XCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">
                      Inativos
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{inactiveMedia.length}</h3>
                  <p className="text-gray-600 text-sm mt-1">Mídias Inativas</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <TvIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-full font-medium">
                      Status
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {previewWindow && !previewWindow.closed ? '1' : '0'}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Preview Aberto</p>
                </motion.div>
              </div>

              {selectedCondominium && selectedCondoData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
                >
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-4">Ações Rápidas</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={handleOpenPreview}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all font-semibold"
                    >
                      <EyeIcon className="w-5 h-5" />
                      Ver Preview na TV
                    </button>
                    <button
                      onClick={handleRefreshPreview}
                      className="flex items-center gap-2 bg-white border-2 border-primary-500 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-all font-semibold"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      Atualizar Preview
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Condomínios Tab */}
          {activeTab === 'condominiums' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold text-gray-900">Condomínios</h2>
                  <p className="text-gray-600 mt-1">Gerencie todos os condomínios cadastrados</p>
                </div>
                <button
                  onClick={() => setShowCondoForm(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <PlusIcon className="w-5 h-5" />
                  Novo Condomínio
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {condominiums.map((condo, index) => (
                  <motion.div
                    key={condo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-display font-bold text-gray-900">{condo.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{condo.slug}</p>
                        {condo.cnpj && (
                          <p className="text-xs text-gray-400 mt-1">CNPJ: {condo.cnpj}</p>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${condo.isActive !== false ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <button
                        onClick={() => toggleNews(condo)}
                        className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                          condo.showNews !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Notícias: {condo.showNews !== false ? 'Ativadas' : 'Desativadas'}
                      </button>

                      <button
                        onClick={() => setSelectedCondominium(condo.id)}
                        className={`w-full text-xs px-3 py-2 rounded-lg font-medium transition-all ${
                          selectedCondominium === condo.id
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {selectedCondominium === condo.id ? 'Selecionado' : 'Selecionar'}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCondominiumActive(condo)}
                        className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          condo.isActive !== false
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title={condo.isActive !== false ? 'Desativar' : 'Ativar'}
                      >
                        {condo.isActive !== false ? (
                          <XCircleIcon className="w-4 h-4" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setEditingCondo(condo)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-sm font-medium"
                        title="Editar"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este condomínio?')) {
                            handleDeleteCondominium(condo.id);
                          }
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all text-sm font-medium"
                        title="Excluir"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {condominiums.length === 0 && (
                <div className="text-center py-12">
                  <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum condomínio cadastrado ainda</p>
                </div>
              )}
            </div>
          )}

          {/* Mídias Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-display font-bold text-gray-900">Mídias</h2>
                  <p className="text-gray-600 mt-1">Gerencie o conteúdo exibido nas TVs</p>
                </div>
                {selectedCondominium && (
                  <button
                    onClick={() => setShowMediaForm(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-secondary-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Nova Mídia
                  </button>
                )}
              </div>

              {!selectedCondominium ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Selecione um condomínio na aba Condomínios</p>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Condomínio Selecionado
                    </label>
                    <select
                      value={selectedCondominium}
                      onChange={(e) => setSelectedCondominium(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-medium"
                    >
                      {condominiums.map((condo) => (
                        <option key={condo.id} value={condo.id}>
                          {condo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mediaItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-display font-bold text-gray-900">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          <div className={`w-3 h-3 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium">
                            {item.type.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.durationSeconds}s
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleMediaActive(item)}
                            className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              item.isActive
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {item.isActive ? (
                              <>
                                <XCircleIcon className="w-4 h-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="w-4 h-4" />
                                Ativar
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir esta mídia?')) {
                                handleDeleteMedia(item.id);
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {mediaItems.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                      <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma mídia cadastrada para este condomínio</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Analytics Tab (Placeholder) */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Analytics</h2>
                <p className="text-gray-600 mt-1">Estatísticas e métricas do sistema</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
                <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Analytics em desenvolvimento</p>
              </div>
            </div>
          )}

          {/* Settings Tab (Placeholder) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-display font-bold text-gray-900">Configurações</h2>
                <p className="text-gray-600 mt-1">Ajuste as configurações do sistema</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100 text-center">
                <PhotoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Configurações em desenvolvimento</p>
              </div>
            </div>
          )}
        </main>

        <AdminFooter />
      </div>

      {/* Condominium Form Modal */}
      {(showCondoForm || editingCondo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">
              {editingCondo ? 'Editar Condomínio' : 'Novo Condomínio'}
            </h2>
            <form onSubmit={editingCondo ? handleUpdateCondominium : handleCreateCondominium}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome</label>
                  <input
                    name="name"
                    defaultValue={editingCondo?.name}
                    placeholder="Nome do condomínio"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Slug</label>
                  <input
                    name="slug"
                    defaultValue={editingCondo?.slug}
                    placeholder="meu-condominio"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CNPJ (opcional)</label>
                  <input
                    name="cnpj"
                    defaultValue={editingCondo?.cnpj}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço (opcional)</label>
                  <input
                    name="address"
                    defaultValue={editingCondo?.address}
                    placeholder="Rua, número, bairro"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCondoForm(false);
                    setEditingCondo(null);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Media Form Modal */}
      {showMediaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full my-8"
          >
            <h2 className="text-2xl font-display font-bold text-gray-900 mb-6">Nova Mídia</h2>
            <form onSubmit={handleCreateMedia}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Título</label>
                  <input
                    name="title"
                    placeholder="Título da mídia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição (opcional)</label>
                  <textarea
                    name="description"
                    placeholder="Descrição da mídia"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo</label>
                  <select
                    name="type"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    required
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                    <option value="youtube">YouTube</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Upload de arquivo</label>
                  <input
                    type="file"
                    name="file"
                    accept="image/*,video/*,.pdf"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ou preencha a URL abaixo para YouTube ou arquivos externos
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">URL (opcional)</label>
                  <input
                    name="sourceUrl"
                    placeholder="https://..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Duração (segundos)</label>
                  <input
                    name="durationSeconds"
                    type="number"
                    placeholder="10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
