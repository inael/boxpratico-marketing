'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Mail,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import PaginatedTable, { Column } from '@/components/admin/PaginatedTable';
import { EmptyDataState, ErrorState } from '@/components/admin/EmptyState';
import InviteMemberModal from '@/components/admin/InviteMemberModal';
import EditMemberModal from '@/components/admin/EditMemberModal';
import ConfirmRemoveModal from '@/components/admin/ConfirmRemoveModal';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';

// Tipos
interface TeamMember {
  [key: string]: unknown;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

const roleLabels: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  TENANT_ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  TENANT_MANAGER: { label: 'Gerente', color: 'bg-blue-100 text-blue-700' },
  LOCATION_OWNER: { label: 'Dono de Local', color: 'bg-green-100 text-green-700' },
  ADVERTISER: { label: 'Anunciante', color: 'bg-amber-100 text-amber-700' },
  OPERATOR: { label: 'Operador', color: 'bg-gray-100 text-gray-700' },
};

const statusLabels: Record<string, { label: string; color: string; icon: typeof UserCheck }> = {
  active: { label: 'Ativo', color: 'text-green-600 bg-green-50', icon: UserCheck },
  inactive: { label: 'Inativo', color: 'text-gray-500 bg-gray-100', icon: UserX },
  pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-50', icon: Mail },
};

export default function TeamPage() {
  const { hasPermission, user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);

  const canManageUsers = hasPermission('users:create') || hasPermission('users:update');
  const canDeleteUsers = hasPermission('users:delete');

  // Fetch members
  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/team');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao carregar equipe');
      }

      setMembers(data.members || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar equipe');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Stats calculados
  const stats = {
    total: members.length,
    active: members.filter(m => m.status === 'active').length,
    pending: members.filter(m => m.status === 'pending').length,
    inactive: members.filter(m => m.status === 'inactive').length,
  };

  const columns: Column<TeamMember>[] = [
    {
      key: 'name',
      header: 'Membro',
      sortable: true,
      render: (member) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
            {member.avatar ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {member.name}
              {member.id === user?.id && (
                <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Você
                </span>
              )}
            </p>
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
        const role = roleLabels[member.role] || { label: member.role, color: 'bg-gray-100 text-gray-700' };
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
        const status = statusLabels[member.status] || statusLabels.active;
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
      render: (member) => {
        // Não permitir editar/remover a si mesmo
        const isSelf = member.id === user?.id;

        return (
          <div className="flex items-center justify-end gap-1">
            {canManageUsers && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingMember(member);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {canDeleteUsers && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRemovingMember(member);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {isSelf && (
              <span className="text-xs text-gray-400 px-2">-</span>
            )}
          </div>
        );
      },
    },
  ];

  // Loading state
  if (loading && members.length === 0) {
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
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && members.length === 0) {
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
        />
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <ErrorState
            message={error}
            onRetry={fetchMembers}
          />
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMembers}
              disabled={loading}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {canManageUsers && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Convidar Membro
              </motion.button>
            )}
          </div>
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
          { label: 'Total de Membros', value: stats.total, color: 'bg-indigo-500' },
          { label: 'Ativos', value: stats.active, color: 'bg-green-500' },
          { label: 'Pendentes', value: stats.pending, color: 'bg-amber-500' },
          { label: 'Inativos', value: stats.inactive, color: 'bg-gray-400' },
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
            onAdd={() => setShowInviteModal(true)}
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
          onRowClick={(member) => {
            if (member.id !== user?.id && canManageUsers) {
              setEditingMember(member);
            }
          }}
        />
      )}

      {/* Modals */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          fetchMembers();
        }}
      />

      <EditMemberModal
        isOpen={!!editingMember}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onSuccess={() => {
          fetchMembers();
        }}
      />

      <ConfirmRemoveModal
        isOpen={!!removingMember}
        member={removingMember}
        onClose={() => setRemovingMember(null)}
        onConfirm={() => {
          fetchMembers();
        }}
      />
    </div>
  );
}
