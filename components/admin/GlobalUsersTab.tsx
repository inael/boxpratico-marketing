'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Calendar,
  Building2,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import PageHeader from './PageHeader';
import EmptyState from './EmptyState';

interface GlobalUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SUPPORT' | 'BILLING';
  status: 'active' | 'inactive';
  tenantsAccess: 'all' | number[]; // 'all' ou lista de IDs de tenants
  lastLoginAt?: string;
  createdAt: string;
}

// Dados mockados
const mockUsers: GlobalUser[] = [
  {
    id: '1',
    name: 'Admin Principal',
    email: 'admin@boxpratico.com',
    role: 'SUPER_ADMIN',
    status: 'active',
    tenantsAccess: 'all',
    lastLoginAt: '2026-01-27T10:00:00Z',
    createdAt: '2025-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Maria Suporte',
    email: 'maria.suporte@boxpratico.com',
    role: 'SUPPORT',
    status: 'active',
    tenantsAccess: 'all',
    lastLoginAt: '2026-01-26T15:30:00Z',
    createdAt: '2025-06-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Joao Financeiro',
    email: 'joao.financeiro@boxpratico.com',
    role: 'BILLING',
    status: 'active',
    tenantsAccess: 'all',
    lastLoginAt: '2026-01-25T09:00:00Z',
    createdAt: '2025-08-20T10:00:00Z',
  },
  {
    id: '4',
    name: 'Carlos Dev',
    email: 'carlos@boxpratico.com',
    role: 'SUPER_ADMIN',
    status: 'inactive',
    tenantsAccess: 'all',
    createdAt: '2025-03-10T10:00:00Z',
  },
];

export default function GlobalUsersTab() {
  const [users] = useState<GlobalUser[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck };
      case 'SUPPORT':
        return { label: 'Suporte', color: 'bg-blue-100 text-blue-700', icon: Shield };
      case 'BILLING':
        return { label: 'Financeiro', color: 'bg-green-100 text-green-700', icon: Shield };
      default:
        return { label: role, color: 'bg-gray-100 text-gray-700', icon: Shield };
    }
  };

  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <PageHeader
          title="Usuarios Globais"
          helpTitle="Usuarios Globais"
          helpDescription="Gerencie usuarios com acesso global a plataforma. Super admins e acessos especiais."
        />
        <EmptyState
          title="Nenhum usuario global"
          description="Usuarios globais tem acesso administrativo a toda a plataforma."
          icon={Users}
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
          title="Usuarios Globais"
          helpTitle="Usuarios Globais"
          helpDescription="Gerencie usuarios com acesso global a plataforma. Super admins e acessos especiais."
        />

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'SUPER_ADMIN').length}
              </p>
              <p className="text-sm text-gray-500">Super Admins</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray-500">Inativos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Lista */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Perfis</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="SUPPORT">Suporte</option>
                <option value="BILLING">Financeiro</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" />
              Novo Usuario
            </button>
          </div>
        </div>

        {/* Lista de Usuarios */}
        <div className="divide-y divide-gray-100">
          {filteredUsers.map((user) => {
            const roleConfig = getRoleConfig(user.role);
            const RoleIcon = roleConfig.icon;

            return (
              <div
                key={user.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        {user.status === 'inactive' && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {user.tenantsAccess === 'all' ? 'Todos os tenants' : `${(user.tenantsAccess as number[]).length} tenants`}
                      </p>
                      {user.lastLoginAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          Ultimo login: {formatDateTime(user.lastLoginAt)}
                        </p>
                      )}
                    </div>

                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${roleConfig.color}`}>
                      <RoleIcon className="w-4 h-4" />
                      {roleConfig.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Visualizar">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Remover">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum usuario encontrado com os filtros selecionados</p>
          </div>
        )}
      </div>

      {/* Alerta de Seguranca */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Usuarios com acesso elevado</p>
          <p className="text-sm text-amber-700 mt-1">
            Usuarios globais tem acesso administrativo a toda a plataforma. Tenha cuidado ao conceder este nivel de acesso.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
