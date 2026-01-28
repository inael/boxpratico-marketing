'use client';

import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  FileSignature,
  Megaphone,
  Banknote,
  Receipt,
  TrendingUp,
  BadgePercent,
  Tv,
  Monitor,
  ListVideo,
  FolderOpen,
  Gift,
  UserPlus,
  ScrollText,
  Settings,
  ShieldCheck,
  Sliders,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Plus,
  Database,
  Building2,
  CreditCard,
  UsersRound,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemName } from '@/contexts/SettingsContext';
import type { Role, Permission, TenantType } from '@/types';

interface SubMenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  permission?: Permission;
  // Restrições por tipo de tenant
  networkOnly?: boolean;     // Só aparece para NETWORK_OPERATOR
  corporateOnly?: boolean;   // Só aparece para CORPORATE_CLIENT
}

interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  badge?: boolean;
  badgeCount?: number;
  submenu?: SubMenuItem[];
  permission?: Permission;
  roles?: Role[]; // Papéis que podem ver este item
  // Restrições por tipo de tenant
  networkOnly?: boolean;     // Só aparece para NETWORK_OPERATOR
  corporateOnly?: boolean;   // Só aparece para CORPORATE_CLIENT
}

interface AdminSidebarV2Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

// Menu base - visível para todos os papéis autorizados
// networkOnly: só NETWORK_OPERATOR (vende publicidade)
// corporateOnly: só CORPORATE_CLIENT (TV interna)
const baseMenuStructure: MenuItem[] = [
  // DASHBOARD - Visão geral (todos)
  { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },

  // COMERCIAL - Apenas NETWORK_OPERATOR (vendedor de publicidade)
  {
    id: 'comercial',
    icon: Briefcase,
    label: 'Comercial',
    permission: 'advertisers:read',
    networkOnly: true,  // Oculto para CORPORATE_CLIENT
    submenu: [
      { id: 'companies', label: 'Meus Clientes', icon: Users, permission: 'advertisers:read' },
      { id: 'contracts', label: 'Contratos', icon: FileSignature, permission: 'contracts:read' },
      { id: 'campaigns', label: 'Campanhas', icon: Megaphone, permission: 'campaigns:read' },
      { id: 'simulator', label: 'Simulador', icon: Megaphone, permission: 'campaigns:create' },
    ],
  },

  // FINANCEIRO - Apenas NETWORK_OPERATOR (cobra de terceiros)
  {
    id: 'financeiro',
    icon: Banknote,
    label: 'Financeiro',
    permission: 'financial:read',
    networkOnly: true,  // Oculto para CORPORATE_CLIENT
    submenu: [
      { id: 'financial', label: 'Cobranças', icon: Receipt, permission: 'financial:read' },
      { id: 'receivables', label: 'Recebíveis', icon: TrendingUp, permission: 'financial:read' },
      { id: 'sales-commissions', label: 'Comissões de Venda', icon: BadgePercent, permission: 'financial:manage' },
    ],
  },

  // OPERAÇÃO - Todos (telas, grades/playlists, biblioteca de mídia)
  {
    id: 'operacao',
    icon: Tv,
    label: 'Operação',
    permission: 'screens:read',
    submenu: [
      { id: 'monitors', label: 'Minhas Telas', icon: Monitor, permission: 'screens:read' },
      { id: 'playlists', label: 'Grades', icon: ListVideo, permission: 'playlists:read' },
      { id: 'library', label: 'Biblioteca de Mídia', icon: FolderOpen, permission: 'media:read' },
    ],
  },

  // GROWTH/PARCERIAS - Apenas NETWORK_OPERATOR (afiliados)
  {
    id: 'growth',
    icon: Rocket,
    label: 'Parcerias',
    badge: true,
    badgeCount: 1,
    permission: 'affiliates:read',
    networkOnly: true,  // Oculto para CORPORATE_CLIENT
    submenu: [
      { id: 'affiliate', label: 'Indicar Amigo', icon: UserPlus, permission: 'affiliates:read' },
      { id: 'affiliate-earnings', label: 'Extrato Afiliado', icon: ScrollText, permission: 'affiliates:read' },
    ],
  },

  // ADMINISTRAÇÃO - Todos (configurações do sistema)
  {
    id: 'admin',
    icon: Settings,
    label: 'Administração',
    permission: 'users:read',
    submenu: [
      { id: 'team', label: 'Minha Equipe', icon: ShieldCheck, permission: 'users:read' },
      { id: 'accounts', label: 'Contas', icon: Users, permission: 'users:read' },
      { id: 'settings', label: 'Configurações', icon: Sliders, permission: 'settings:read' },
      { id: 'reports', label: 'Relatórios', icon: BarChart3, permission: 'financial:read' },
    ],
  },
];

// Menu exclusivo SUPER ADMIN - Gestão da Plataforma
const superAdminMenu: MenuItem = {
  id: 'platform',
  icon: Database,
  label: 'Gestão da Plataforma',
  roles: ['SUPER_ADMIN'],
  submenu: [
    { id: 'tenants', label: 'Tenants / Filiados', icon: Building2 },
    { id: 'subscription-plans', label: 'Planos de Assinatura', icon: CreditCard },
    { id: 'global-users', label: 'Usuários Globais', icon: UsersRound },
  ],
};

// Ações rápidas baseadas em permissões
const quickActionsConfig = [
  { id: 'new-company', label: 'Novo Cliente', permission: 'advertisers:create' as Permission },
  { id: 'new-contract', label: 'Novo Contrato', permission: 'contracts:create' as Permission },
  { id: 'new-invoice', label: 'Nova Cobrança', permission: 'financial:manage' as Permission },
  { id: 'new-playlist', label: 'Nova Grade', permission: 'playlists:create' as Permission },
];

// Menu Item Component - memoizado para evitar re-renders
const MenuItemComponent = memo(function MenuItemComponent({
  item,
  isActive,
  isSubmenuOpen,
  isExpanded,
  activeTab,
  onItemClick,
  onSubmenuClick,
  hasPermission,
}: {
  item: MenuItem;
  isActive: boolean;
  isSubmenuOpen: boolean;
  isExpanded: boolean;
  activeTab: string;
  onItemClick: (item: MenuItem) => void;
  onSubmenuClick: (subId: string) => void;
  hasPermission: (permission: Permission) => boolean;
}) {
  const IconComponent = item.icon;

  // Filtrar submenus baseado em permissões
  const visibleSubmenu = item.submenu?.filter(
    (sub) => !sub.permission || hasPermission(sub.permission)
  );

  return (
    <div className="mb-1">
      <button
        onClick={() => onItemClick(item)}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
          isActive
            ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50'
        }`}
      >
        <div className="relative flex-shrink-0">
          <IconComponent className="w-6 h-6" />
          {item.badge && !isExpanded && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {item.badgeCount || '!'}
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <span className="font-medium whitespace-nowrap">{item.label}</span>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badgeCount || '!'}
                </span>
              )}
              {visibleSubmenu && visibleSubmenu.length > 0 && (
                <ChevronRight
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isSubmenuOpen ? 'rotate-90' : ''
                  }`}
                />
              )}
            </div>
          </div>
        )}
      </button>

      {/* Submenu */}
      {visibleSubmenu && visibleSubmenu.length > 0 && isSubmenuOpen && isExpanded && (
        <div className="ml-6 pl-4 border-l-2 border-gray-200 mt-1 space-y-1">
          {visibleSubmenu.map((sub) => {
            const SubIcon = sub.icon;
            return (
              <button
                key={sub.id}
                onClick={() => onSubmenuClick(sub.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === sub.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {SubIcon && <SubIcon className="w-4 h-4 flex-shrink-0" />}
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default function AdminSidebarV2({
  activeTab,
  onTabChange,
  isExpanded,
  onExpandChange,
}: AdminSidebarV2Props) {
  const { activeContext, hasPermission, isSuperAdmin, isViewingAsTenant, tenantType, isNetworkOperator, isCorporateClient } = useAuth();
  const systemName = useSystemName();

  // Construir menu baseado nas permissões e tipo de tenant
  const menuStructure = useMemo(() => {
    const menu: MenuItem[] = [];

    // Filtrar menu base por permissões e tipo de tenant
    baseMenuStructure.forEach((item) => {
      // Se não tem permissão requerida, não mostra
      if (item.permission && !hasPermission(item.permission)) return;

      // Se tem restrição de papel, verificar
      if (item.roles && activeContext && !item.roles.includes(activeContext.role)) return;

      // Filtrar por tipo de tenant
      // networkOnly: só aparece para NETWORK_OPERATOR
      if (item.networkOnly && !isNetworkOperator() && !isSuperAdmin()) return;
      // corporateOnly: só aparece para CORPORATE_CLIENT
      if (item.corporateOnly && !isCorporateClient() && !isSuperAdmin()) return;

      menu.push(item);
    });

    // Adicionar menu de Super Admin se aplicável
    if (isSuperAdmin() && !isViewingAsTenant()) {
      menu.push(superAdminMenu);
    }

    return menu;
  }, [activeContext, hasPermission, isSuperAdmin, isViewingAsTenant, tenantType, isNetworkOperator, isCorporateClient]);

  // Ações rápidas filtradas por permissão
  const quickActions = useMemo(() => {
    return quickActionsConfig.filter((action) => hasPermission(action.permission));
  }, [hasPermission]);

  const [openSubmenus, setOpenSubmenus] = useState<string[]>(() => {
    const initialOpen: string[] = [];
    menuStructure.forEach((item) => {
      if (item.submenu?.some((sub) => sub.id === activeTab)) {
        initialOpen.push(item.id);
      }
    });
    return initialOpen;
  });
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Abrir submenu do item ativo automaticamente
  useEffect(() => {
    menuStructure.forEach((item) => {
      if (item.submenu?.some((sub) => sub.id === activeTab)) {
        setOpenSubmenus((prev) => {
          if (!prev.includes(item.id)) {
            return [...prev, item.id];
          }
          return prev;
        });
      }
    });
  }, [activeTab, menuStructure]);

  const toggleSubmenu = useCallback((menuId: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  }, []);

  const handleItemClick = useCallback((item: MenuItem) => {
    if (item.submenu && item.submenu.length > 0) {
      toggleSubmenu(item.id);
    } else {
      onTabChange(item.id);
      if (isMobile) setIsMobileMenuOpen(false);
    }
  }, [toggleSubmenu, onTabChange, isMobile]);

  const handleSubmenuClick = useCallback((subId: string) => {
    onTabChange(subId);
    if (isMobile) setIsMobileMenuOpen(false);
  }, [onTabChange, isMobile]);

  const handleQuickAction = useCallback((actionId: string) => {
    setShowQuickActions(false);
    if (actionId === 'new-company') onTabChange('companies');
    if (actionId === 'new-contract') onTabChange('contracts');
    if (actionId === 'new-invoice') onTabChange('financial');
    if (actionId === 'new-playlist') onTabChange('playlists');
  }, [onTabChange]);

  const isItemActive = useCallback((item: MenuItem) => {
    if (item.id === activeTab) return true;
    if (item.submenu?.some((sub) => sub.id === activeTab)) return true;
    return false;
  }, [activeTab]);

  // Sidebar content - inline para evitar re-criação de componente
  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <span className="text-white font-bold text-lg">BP</span>
          </div>
          {isExpanded && (
            <div className="overflow-hidden">
              <span className="font-bold text-gray-900 text-lg whitespace-nowrap block">
                {systemName}
              </span>
              {activeContext && isViewingAsTenant() && (
                <span className="text-xs text-indigo-600 truncate block">
                  Visualizando: {activeContext.tenant?.name || 'Tenant'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Botão de Ação Rápida */}
      {quickActions.length > 0 && (
        <div className="p-4">
          <div className="relative">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl transition-shadow hover:shadow-lg hover:shadow-indigo-500/30 ${
                isExpanded ? 'px-4 py-3' : 'p-3'
              }`}
            >
              <Plus className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <>
                  <span className="font-semibold whitespace-nowrap">Criar</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${showQuickActions ? 'rotate-180' : ''}`}
                  />
                </>
              )}
            </button>

            {/* Dropdown de ações */}
            <AnimatePresence>
              {showQuickActions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 ${
                    isExpanded ? 'left-0 right-0' : 'left-0 w-48'
                  }`}
                >
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.id)}
                      className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      {action.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {menuStructure.map((item) => (
          <MenuItemComponent
            key={item.id}
            item={item}
            isActive={isItemActive(item)}
            isSubmenuOpen={openSubmenus.includes(item.id)}
            isExpanded={isExpanded}
            activeTab={activeTab}
            onItemClick={handleItemClick}
            onSubmenuClick={handleSubmenuClick}
            hasPermission={hasPermission}
          />
        ))}
      </nav>

      {/* Toggle Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => onExpandChange(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Recolher</span>
            </>
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </>
  );

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <aside
        className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40 transition-[width] duration-300 ease-in-out"
        style={{ width: isExpanded ? 280 : 80 }}
      >
        {sidebarContent}
      </aside>
    );
  }

  // Mobile Sidebar
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-xl shadow-lg border border-gray-200"
      >
        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-gray-200 flex flex-col z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
