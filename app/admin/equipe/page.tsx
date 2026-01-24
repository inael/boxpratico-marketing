'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Mail,
  Phone,
  MoreVertical,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import PaginatedTable, { Column } from '@/components/admin/PaginatedTable';
import EmptyState, { EmptyDataState } from '@/components/admin/EmptyState';
import { useAuth } from '@/contexts/AuthContext';

// Tipos
interface TeamMember {
  [key: string]: unknown;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'OPERATOR';
  status: 'active' | 'inactive' | 'pending';
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

// Dados de exemplo
const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@empresa.com',
    phone: '(11) 99999-0001',
    role: 'TENANT_ADMIN',
    status: 'active',
    createdAt: '2024-01-15',
    lastLogin: '2024-01-20T14:30:00',
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    phone: '(11) 99999-0002',
    role: 'TENANT_MANAGER',
    status: 'active',
    createdAt: '2024-01-10',
    lastLogin: '2024-01-19T09:15:00',
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    email: 'carlos@empresa.com',
    role: 'OPERATOR',
    status: 'pending',
    createdAt: '2024-01-18',
  },
  {
    id: '4',
    name: 'Ana Costa',
    email: 'ana@empresa.com',
    phone: '(11) 99999-0004',
    role: 'OPERATOR',
    status: 'inactive',
    createdAt: '2024-01-05',
    lastLogin: '2024-01-10T16:45:00',
  },
];

const roleLabels: Record<string, { label: string; color: string }> = {
  TENANT_ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  TENANT_MANAGER: { label: 'Gerente', color: 'bg-blue-100 text-blue-700' },
  OPERATOR: { label: 'Operador', color: 'bg-gray-100 text-gray-700' },
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof UserCheck }> = {
  active: { label: 'Ativo', color: 'text-green-600 bg-green-50', icon: UserCheck },
  inactive: { label: 'Inativo', color: 'text-gray-500 bg-gray-100', icon: UserX },
  pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-50', icon: Mail },
};

export default function TeamPage() {
  const { hasPermission } = useAuth();
  const [members] = useState<TeamMember[]>(mockTeamMembers);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const canManageUsers = hasPermission('users:create') || hasPermission('users:update');
  const canDeleteUsers = hasPermission('users:delete');

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Membro',
      sortable: true,
      render: (member) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{member.name}</p>
            <p className="text-sm text-gray-500">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Papel',
      sortable: true,
      render: (member) => {
        const role = roleLabels[member.role];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
            <Shield className="w-3 h-3" />
            {role.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (member) => {
        const status = statusLabels[member.status];
        const StatusIcon = status.icon;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        );
      },
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (member) => (
        <span className="text-gray-600">{member.phone || '-'}</span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Último Acesso',
      sortable: true,
      render: (member) => (
        <span className="text-gray-500 text-sm">
          {member.lastLogin
            ? new Date(member.lastLogin).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Nunca acessou'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (member) => (
        <div className="flex items-center justify-end gap-1">
          {canManageUsers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMember(member);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {canDeleteUsers && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle delete
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Remover"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Minha Equipe"
        subtitle="Gerencie os membros da sua organização"
        breadcrumbs={[
          { label: 'Início', href: '/admin' },
          { label: 'Administração' },
          { label: 'Minha Equipe' },
        ]}
        actions={
          canManageUsers && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Convidar Membro
            </motion.button>
          )
        }
        helpTitle="Gerenciamento de Equipe"
        helpDescription="Adicione membros à sua equipe e defina permissões de acesso para cada um."
        helpVideoSrc="/videos/team-management.mp4"
        helpLinks={[
          { label: 'Entendendo os papéis de usuário', href: '/docs/roles', external: true },
          { label: 'Como convidar novos membros', href: '/docs/invite', external: true },
          { label: 'Gerenciando permissões', href: '/docs/permissions', external: true },
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Membros', value: members.length, color: 'bg-indigo-500' },
          { label: 'Ativos', value: members.filter(m => m.status === 'active').length, color: 'bg-green-500' },
          { label: 'Pendentes', value: members.filter(m => m.status === 'pending').length, color: 'bg-amber-500' },
          { label: 'Inativos', value: members.filter(m => m.status === 'inactive').length, color: 'bg-gray-400' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-8 rounded-full ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table or Empty State */}
      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyDataState
            entityName="membro"
            onAdd={() => setShowAddModal(true)}
          />
        </div>
      ) : (
        <PaginatedTable
          data={members}
          columns={columns}
          getRowKey={(member) => member.id}
          searchable
          searchPlaceholder="Buscar por nome ou email..."
          searchKeys={['name', 'email']}
          emptyMessage="Nenhum membro encontrado"
          onRowClick={(member) => setSelectedMember(member)}
        />
      )}

      {/* Add Member Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Convidar Novo Membro</h3>
            <p className="text-gray-500 mb-6">
              Esta funcionalidade será implementada em breve.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
