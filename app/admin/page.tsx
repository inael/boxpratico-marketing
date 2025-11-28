'use client';

import { useState, useEffect } from 'react';
import { Condominium, MediaItem } from '@/types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [showCondoForm, setShowCondoForm] = useState(false);
  const [showMediaForm, setShowMediaForm] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);

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
    if (!confirm('Tem certeza que deseja excluir este condomínio?')) return;

    const res = await fetch(`/api/condominiums/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadCondominiums();
      if (selectedCondominium === id) {
        setSelectedCondominium('');
      }
    }
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
    if (!confirm('Tem certeza que deseja excluir esta mídia?')) return;

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

  const selectedCondoData = condominiums.find(c => c.id === selectedCondominium);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a senha"
            className="w-full px-4 py-2 border rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <div className="flex items-center gap-4">
              <select
                value={selectedCondominium}
                onChange={(e) => setSelectedCondominium(e.target.value)}
                className="px-4 py-2 border rounded"
              >
                <option value="">Selecione um condomínio</option>
                {condominiums.map((condo) => (
                  <option key={condo.id} value={condo.id}>
                    {condo.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowCondoForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Novo Condomínio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Condomínios</h2>
            <div className="space-y-2">
              {condominiums.map((condo) => (
                <div key={condo.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-semibold">{condo.name}</div>
                    <div className="text-sm text-gray-600">{condo.slug}</div>
                    <div className="mt-2">
                      <button
                        onClick={() => toggleNews(condo)}
                        className={`text-xs px-3 py-1 rounded-full ${
                          condo.showNews !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Notícias: {condo.showNews !== false ? 'Ativadas' : 'Desativadas'}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingCondo(condo)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteCondominium(condo.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Mídias</h2>
              {selectedCondominium && (
                <button
                  onClick={() => setShowMediaForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Nova Mídia
                </button>
              )}
            </div>
            {!selectedCondominium ? (
              <p className="text-gray-500">Selecione um condomínio</p>
            ) : (
              <div className="space-y-2">
                {mediaItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-gray-600">
                        {item.type} - {item.isActive ? 'Ativo' : 'Inativo'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMediaActive(item)}
                        className={item.isActive ? 'text-orange-600' : 'text-green-600'}
                      >
                        {item.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => handleDeleteMedia(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedCondominium && selectedCondoData && (
          <div className="mt-8 text-center">
            <a
              href={`/admin/${selectedCondoData.slug}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700"
            >
              Ver como ficará na TV
            </a>
          </div>
        )}
      </div>

      {(showCondoForm || editingCondo) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              {editingCondo ? 'Editar Condomínio' : 'Novo Condomínio'}
            </h2>
            <form onSubmit={editingCondo ? handleUpdateCondominium : handleCreateCondominium}>
              <div className="space-y-4">
                <input
                  name="name"
                  defaultValue={editingCondo?.name}
                  placeholder="Nome"
                  className="w-full px-4 py-2 border rounded"
                  required
                />
                <input
                  name="slug"
                  defaultValue={editingCondo?.slug}
                  placeholder="Slug (ex: meu-condominio)"
                  className="w-full px-4 py-2 border rounded"
                  required
                />
                <input
                  name="cnpj"
                  defaultValue={editingCondo?.cnpj}
                  placeholder="CNPJ (opcional)"
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  name="address"
                  defaultValue={editingCondo?.address}
                  placeholder="Endereço (opcional)"
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCondoForm(false);
                    setEditingCondo(null);
                  }}
                  className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMediaForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-md w-full my-8">
            <h2 className="text-xl font-bold mb-4">Nova Mídia</h2>
            <form onSubmit={handleCreateMedia}>
              <div className="space-y-4">
                <input
                  name="title"
                  placeholder="Título"
                  className="w-full px-4 py-2 border rounded"
                  required
                />
                <textarea
                  name="description"
                  placeholder="Descrição (opcional)"
                  className="w-full px-4 py-2 border rounded"
                  rows={3}
                />
                <select name="type" className="w-full px-4 py-2 border rounded" required>
                  <option value="">Selecione o tipo</option>
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                  <option value="youtube">YouTube</option>
                  <option value="pdf">PDF</option>
                </select>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Upload de arquivo</label>
                  <input
                    type="file"
                    name="file"
                    accept="image/*,video/*,.pdf"
                    className="w-full px-4 py-2 border rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ou preencha a URL abaixo para YouTube ou arquivos externos
                  </p>
                </div>
                <input
                  name="sourceUrl"
                  placeholder="URL (para YouTube ou arquivos externos)"
                  className="w-full px-4 py-2 border rounded"
                />
                <input
                  name="durationSeconds"
                  type="number"
                  placeholder="Duração em segundos (padrão: 10)"
                  className="w-full px-4 py-2 border rounded"
                />
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaForm(false)}
                  className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
