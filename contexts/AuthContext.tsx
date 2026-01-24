'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Role, Tenant, Permission, UserRole, TenantType } from '@/types';

// Mapeamento de roles legados para o novo sistema RBAC
const LEGACY_ROLE_MAP: Record<string, Role> = {
  'admin': 'SUPER_ADMIN',
  'manager': 'TENANT_ADMIN',
  'editor': 'TENANT_MANAGER',
  'sales': 'SALES_AGENT',
  'vendedor': 'SALES_AGENT',
  'operator': 'OPERATOR',
  'viewer': 'OPERATOR',
};

// Função para normalizar role (legado -> novo RBAC)
function normalizeRole(role: string | undefined, isAdmin?: boolean): Role {
  // Se é admin legado, é SUPER_ADMIN
  if (isAdmin) return 'SUPER_ADMIN';

  // Se não tem role, assume OPERATOR
  if (!role) return 'OPERATOR';

  // Se já é um role do novo sistema, retorna ele
  const newRoles: Role[] = ['SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_MANAGER', 'SALES_AGENT', 'LOCATION_OWNER', 'ADVERTISER', 'OPERATOR'];
  if (newRoles.includes(role as Role)) {
    return role as Role;
  }

  // Mapeia role legado para novo
  return LEGACY_ROLE_MAP[role.toLowerCase()] || 'OPERATOR';
}

// Mapeamento de permissões por papel
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'platform:manage',
    'tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete',
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'screens:read', 'screens:create', 'screens:update', 'screens:delete',
    'advertisers:read', 'advertisers:create', 'advertisers:update', 'advertisers:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'playlists:read', 'playlists:create', 'playlists:update', 'playlists:delete',
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete',
    'contracts:read', 'contracts:create', 'contracts:update', 'contracts:delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'financial:read', 'financial:manage',
    'affiliates:read', 'affiliates:manage',
    'settings:read', 'settings:update',
  ],
  TENANT_ADMIN: [
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'screens:read', 'screens:create', 'screens:update', 'screens:delete',
    'advertisers:read', 'advertisers:create', 'advertisers:update', 'advertisers:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'playlists:read', 'playlists:create', 'playlists:update', 'playlists:delete',
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete',
    'contracts:read', 'contracts:create', 'contracts:update', 'contracts:delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'financial:read', 'financial:manage',
    'affiliates:read', 'affiliates:manage',
    'settings:read', 'settings:update',
  ],
  TENANT_MANAGER: [
    'locations:read', 'locations:create', 'locations:update',
    'screens:read', 'screens:create', 'screens:update',
    'advertisers:read', 'advertisers:create', 'advertisers:update',
    'media:read', 'media:create', 'media:update',
    'playlists:read', 'playlists:create', 'playlists:update',
    'campaigns:read', 'campaigns:create', 'campaigns:update',
    'contracts:read', 'contracts:create', 'contracts:update',
    'users:read',
    'financial:read',
    'affiliates:read',
    'settings:read',
  ],
  SALES_AGENT: [
    // Vendedor: prospecção, contratos e comissões (apenas dele)
    'advertisers:read', 'advertisers:create', 'advertisers:update',
    'contracts:read', 'contracts:create', 'contracts:update',
    'campaigns:read', 'campaigns:create',
    'screens:read',       // Ver telas para mostrar ao cliente
    'locations:read',     // Ver locais para mostrar ao cliente
    'financial:read',     // Ver comissões próprias
  ],
  LOCATION_OWNER: [
    'locations:read',
    'screens:read',
    'media:read',
    'playlists:read',
    'financial:read',
  ],
  ADVERTISER: [
    'campaigns:read', 'campaigns:create', 'campaigns:update',
    'media:read', 'media:create',
  ],
  OPERATOR: [
    'screens:read', 'screens:update',
    'media:read', 'media:create', 'media:update',
    'playlists:read', 'playlists:create', 'playlists:update',
  ],
};

// Contexto ativo (para role-switcher)
export interface ActiveContext {
  id: string;
  role: Role;
  tenantId?: string;
  tenant?: Tenant;
  label: string;
}

// Contextos disponíveis para o usuário - mesma estrutura de ActiveContext
export type AvailableContext = ActiveContext;

interface AuthContextType {
  // Dados do usuário
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: Role;
    tenantId?: string;
  } | null;

  // Contexto ativo (pode ser diferente do papel real do usuário)
  activeContext: ActiveContext | null;

  // Contextos disponíveis para switch
  availableContexts: AvailableContext[];

  // Funções de autorização
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Funções de contexto
  switchContext: (contextId: string) => Promise<void>;
  isSuperAdmin: () => boolean;
  isTenantAdmin: () => boolean;
  isViewingAsTenant: () => boolean;

  // Tipo do tenant atual (para adaptar interface)
  tenantType: TenantType | null;
  isNetworkOperator: () => boolean;
  isCorporateClient: () => boolean;

  // Estado
  loading: boolean;
  isFirstLogin: boolean;
  dismissFirstLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [activeContext, setActiveContext] = useState<ActiveContext | null>(null);
  const [availableContexts, setAvailableContexts] = useState<AvailableContext[]>([]);
  const [tenantType, setTenantType] = useState<TenantType | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Inicializar contexto baseado no usuário logado
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      setActiveContext(null);
      setAvailableContexts([]);
      setLoading(false);
      return;
    }

    // Normalizar role (compatibilidade com sistema legado)
    const userRole = normalizeRole(session.user.role as string, session.user.isAdmin);
    const tenantId = session.user.tenantId;

    console.log('[AuthContext] User role:', session.user.role, '-> normalized:', userRole, 'isAdmin:', session.user.isAdmin);

    // Verificar primeiro login
    const firstLoginKey = `bp_first_login_${session.user.id}`;
    const hasSeenWelcome = localStorage.getItem(firstLoginKey);
    setIsFirstLogin(!hasSeenWelcome);

    // Definir contexto padrão
    const defaultContext: ActiveContext = {
      id: userRole === 'SUPER_ADMIN' ? 'super-admin' : 'default',
      role: userRole,
      tenantId,
      label: userRole === 'SUPER_ADMIN' ? 'Visão Super Admin' : 'Minha Organização',
    };
    setActiveContext(defaultContext);

    // Construir contextos disponíveis
    const contexts: AvailableContext[] = [];

    if (userRole === 'SUPER_ADMIN') {
      // Super Admin pode ver como Super Admin ou "encarnar" tenants
      contexts.push({
        id: 'super-admin',
        role: 'SUPER_ADMIN',
        label: 'Visão Super Admin (Global)',
      });

      // Buscar lista de tenants para o switcher
      fetchTenants().then((tenants) => {
        const tenantContexts = tenants.map((t: Tenant) => ({
          id: `tenant-${t.id}`,
          role: 'TENANT_ADMIN' as Role,
          tenantId: t.id,
          tenant: t,
          label: `${t.name}`,
        }));
        setAvailableContexts([...contexts, ...tenantContexts]);
      });
    } else {
      // Usuários normais só veem seu próprio contexto
      contexts.push({
        id: 'default',
        role: userRole,
        tenantId,
        label: 'Minha Organização',
      });
      setAvailableContexts(contexts);

      // Buscar tipo do tenant atual
      if (tenantId) {
        fetchTenantType(tenantId);
      }
    }

    setLoading(false);
  }, [session, status]);

  // Buscar tipo do tenant
  const fetchTenantType = async (tenantId: string) => {
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (res.ok) {
        const tenant = await res.json();
        setTenantType(tenant.type || 'NETWORK_OPERATOR');
      }
    } catch (err) {
      console.error('[AuthContext] Error fetching tenant type:', err);
      // Default para NETWORK_OPERATOR se não conseguir buscar
      setTenantType('NETWORK_OPERATOR');
    }
  };

  // Buscar lista de tenants (apenas para Super Admin)
  const fetchTenants = async (): Promise<Tenant[]> => {
    try {
      const res = await fetch('/api/accounts');
      if (!res.ok) return [];
      const data = await res.json();
      // A API retorna array diretamente ou objeto com accounts
      const accounts = Array.isArray(data) ? data : (data.accounts || []);
      return accounts.map((a: { id: string; name: string; slug?: string; email?: string; plan?: string }) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        email: a.email,
        plan: a.plan,
      })) as Tenant[];
    } catch (err) {
      console.error('[AuthContext] Error fetching tenants:', err);
      return [];
    }
  };

  // Verificar se tem permissão
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!activeContext) return false;
    const permissions = ROLE_PERMISSIONS[activeContext.role] || [];
    return permissions.includes(permission);
  }, [activeContext]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  }, [hasPermission]);

  // Trocar contexto (role-switcher)
  const switchContext = useCallback(async (contextId: string) => {
    const context = availableContexts.find((c) => c.id === contextId);
    if (!context) return;

    setActiveContext(context);

    // Salvar preferência no backend
    try {
      await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextId, tenantId: context.tenantId }),
      });
    } catch {
      // Silenciar erro
    }
  }, [availableContexts]);

  // Helpers
  const isSuperAdmin = useCallback((): boolean => {
    // Verifica se é SUPER_ADMIN pelo role normalizado ou pelo isAdmin legado
    const role = normalizeRole(session?.user?.role as string, session?.user?.isAdmin);
    return role === 'SUPER_ADMIN' || session?.user?.isAdmin === true;
  }, [session]);

  const isTenantAdmin = useCallback((): boolean => {
    return activeContext?.role === 'TENANT_ADMIN';
  }, [activeContext]);

  const isViewingAsTenant = useCallback((): boolean => {
    return isSuperAdmin() && activeContext?.role !== 'SUPER_ADMIN';
  }, [isSuperAdmin, activeContext]);

  // Helpers para tipo de tenant
  const isNetworkOperator = useCallback((): boolean => {
    return tenantType === 'NETWORK_OPERATOR';
  }, [tenantType]);

  const isCorporateClient = useCallback((): boolean => {
    return tenantType === 'CORPORATE_CLIENT';
  }, [tenantType]);

  // Dispensar tela de primeiro login
  const dismissFirstLogin = useCallback(() => {
    if (session?.user?.id) {
      const firstLoginKey = `bp_first_login_${session.user.id}`;
      localStorage.setItem(firstLoginKey, 'true');
      setIsFirstLogin(false);
    }
  }, [session]);

  const user = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    avatarUrl: session.user.image || undefined,
    role: normalizeRole(session.user.role as string, session.user.isAdmin),
    tenantId: session.user.tenantId,
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        activeContext,
        availableContexts,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        switchContext,
        isSuperAdmin,
        isTenantAdmin,
        isViewingAsTenant,
        tenantType,
        isNetworkOperator,
        isCorporateClient,
        loading,
        isFirstLogin,
        dismissFirstLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
