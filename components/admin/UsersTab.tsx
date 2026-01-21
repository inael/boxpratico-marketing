'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { User, UserRole, USER_ROLE_LABELS, Monitor, Advertiser } from '@/types';
import { LabelWithTooltip } from '@/components/ui/Tooltip';

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700' },
  operator: { bg: 'bg-blue-100', text: 'text-blue-700' },
  viewer: { bg: 'bg-gray-100', text: 'text-gray-700' },
};

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [isActive, setIsActive] = useState(true);
  const [restrictContent, setRestrictContent] = useState(false);
  const [allowedTerminals, setAllowedTerminals] = useState<string[]>([]);
  const [allowedAdvertisers, setAllowedAdvertisers] = useState<string[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [emailFrequency, setEmailFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadUsers();
    loadMonitors();
    loadAdvertisers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMonitors() {
    try {
      const res = await fetch('/api/monitors');
      const data = await res.json();
      setMonitors(data);
    } catch (error) {
      console.error('Failed to load monitors:', error);
    }
  }

  async function loadAdvertisers() {
    try {
      const res = await fetch('/api/advertisers');
      const data = await res.json();
      setAdvertisers(data);
    } catch (error) {
      console.error('Failed to load advertisers:', error);
    }
  }

  function resetForm() {
    setName('');
    setEmail('');
    setPassword('');
    setRole('operator');
    setIsActive(true);
    setRestrictContent(false);
    setAllowedTerminals([]);
    setAllowedAdvertisers([]);
    setEmailNotifications(false);
    setEmailFrequency('weekly');
    setEditingUser(null);
    setShowForm(false);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setIsActive(user.isActive);
    setRestrictContent(user.restrictContent || false);
    setAllowedTerminals(user.allowedTerminals || []);
    setAllowedAdvertisers(user.allowedAdvertisers || []);
    setEmailNotifications(user.emailNotifications || false);
    setEmailFrequency(user.emailFrequency || 'weekly');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const data = {
      name,
      email,
      password: password || undefined,
      role,
      isActive,
      restrictContent,
      allowedTerminals: allowedTerminals.length > 0 ? allowedTerminals : undefined,
      allowedAdvertisers: allowedAdvertisers.length > 0 ? allowedAdvertisers : undefined,
      emailNotifications,
      emailFrequency,
    };

    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await loadUsers();
          resetForm();
        } else {
          const error = await res.json();
          alert(error.error || 'Erro ao atualizar usuario');
        }
      } else {
        if (!password) {
          alert('Senha e obrigatoria para novos usuarios');
          return;
        }

        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          await loadUsers();
          resetForm();
        } else {
          const error = await res.json();
          alert(error.error || 'Erro ao criar usuario');
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Deseja realmente excluir o usuario ${user.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }

  async function toggleActive(user: User) {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F59E0B]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie quem pode acessar o sistema e suas permissoes
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg hover:shadow-lg transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Novo Usuario</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUser ? 'Editar Usuario' : 'Novo Usuario'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados basicos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelWithTooltip
                  label="Nome"
                  tooltip="Nome completo do usuario"
                  required
                  htmlFor="name"
                />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                  placeholder="Ex: Joao Silva"
                />
              </div>
              <div>
                <LabelWithTooltip
                  label="Email"
                  tooltip="Email para login e notificacoes"
                  required
                  htmlFor="email"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                  placeholder="joao@empresa.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <LabelWithTooltip
                  label="Senha"
                  tooltip={editingUser ? "Deixe vazio para manter a senha atual" : "Senha de acesso ao sistema"}
                  required={!editingUser}
                  htmlFor="password"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUser}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                  placeholder={editingUser ? "Deixe vazio para manter" : "********"}
                />
              </div>
              <div>
                <LabelWithTooltip
                  label="Perfil"
                  tooltip="Admin: acesso total. Operador: pode gerenciar conteudo. Visualizador: apenas visualiza."
                  required
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {(['admin', 'operator', 'viewer'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        role === r
                          ? 'bg-[#F59E0B] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {USER_ROLE_LABELS[r]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Permissoes */}
            {role !== 'admin' && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Restricoes de Acesso</h3>

                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={restrictContent}
                      onChange={(e) => setRestrictContent(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                    />
                    <span className="text-sm text-gray-700">
                      Restringir conteudo (so ve o que ele criou)
                    </span>
                  </label>

                  <div>
                    <LabelWithTooltip
                      label="Terminais permitidos"
                      tooltip="Se vazio, pode acessar todos. Selecione para restringir a terminais especificos."
                    />
                    <select
                      multiple
                      value={allowedTerminals}
                      onChange={(e) => setAllowedTerminals(Array.from(e.target.selectedOptions, o => o.value))}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none min-h-[100px]"
                    >
                      {monitors.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Ctrl+clique para selecionar multiplos</p>
                  </div>

                  <div>
                    <LabelWithTooltip
                      label="Anunciantes permitidos"
                      tooltip="Se vazio, pode acessar todos. Selecione para restringir a anunciantes especificos."
                    />
                    <select
                      multiple
                      value={allowedAdvertisers}
                      onChange={(e) => setAllowedAdvertisers(Array.from(e.target.selectedOptions, o => o.value))}
                      className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none min-h-[100px]"
                    >
                      {advertisers.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Notificacoes */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Notificacoes</h3>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                  />
                  <span className="text-sm text-gray-700">Receber por email</span>
                </label>

                {emailNotifications && (
                  <select
                    value={emailFrequency}
                    onChange={(e) => setEmailFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                />
                <span className="text-sm text-gray-700">Usuario ativo</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg hover:shadow-lg transition-all"
              >
                {editingUser ? 'Salvar Alteracoes' : 'Criar Usuario'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <UserIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuario cadastrado</h3>
            <p className="text-gray-500 text-sm mb-4">
              Comece criando o primeiro usuario do sistema
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg hover:shadow-lg transition-all"
            >
              Criar primeiro usuario
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Perfil
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role].bg} ${ROLE_COLORS[user.role].text}`}>
                        {user.role === 'admin' && <ShieldCheckIcon className="w-3 h-3" />}
                        {user.role === 'viewer' && <EyeIcon className="w-3 h-3" />}
                        {USER_ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <button
                        onClick={() => toggleActive(user)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
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
    </motion.div>
  );
}
