'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  HomeIcon,
  CameraIcon,
  CreditCardIcon,
  GiftIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  PlusIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  UsersIcon,
  TvIcon,
  PhotoIcon,
  FolderIcon,
  CloudArrowUpIcon,
  MegaphoneIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: boolean;
  badgeCount?: number;
  submenu?: { id: string; label: string }[];
}

interface AdminSidebarV2Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isExpanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const menuStructure: MenuItem[] = [
  { id: 'dashboard', icon: HomeIcon, label: 'Inicio' },
  {
    id: 'receber',
    icon: CameraIcon,
    label: 'Receber',
    submenu: [
      { id: 'companies', label: 'Meus Clientes' },
      { id: 'contracts', label: 'Contratos' },
      { id: 'financial', label: 'Cobranças' },
      { id: 'campaigns', label: 'Campanhas' },
    ],
  },
  {
    id: 'conta',
    icon: CreditCardIcon,
    label: 'Conta',
    submenu: [
      { id: 'monitors', label: 'Telas' },
      { id: 'media', label: 'Midias' },
      { id: 'media-groups', label: 'Grupos de Midias' },
      { id: 'library', label: 'Biblioteca' },
    ],
  },
  {
    id: 'beneficios',
    icon: GiftIcon,
    label: 'Beneficios',
    badge: true,
    badgeCount: 1,
    submenu: [
      { id: 'affiliate', label: 'Indicar Amigo' },
      { id: 'affiliate-earnings', label: 'Minhas Comissões' },
    ],
  },
  {
    id: 'admin',
    icon: Cog6ToothIcon,
    label: 'Administração',
    submenu: [
      { id: 'users', label: 'Usuários' },
      { id: 'accounts', label: 'Contas' },
      { id: 'reports', label: 'Relatórios' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'settings', label: 'Configurações' },
    ],
  },
];

const quickActions = [
  { id: 'new-company', label: 'Nova Empresa' },
  { id: 'new-contract', label: 'Novo Contrato' },
  { id: 'new-invoice', label: 'Nova Cobrança' },
];

export default function AdminSidebarV2({
  activeTab,
  onTabChange,
  isExpanded,
  onExpandChange,
}: AdminSidebarV2Props) {
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
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
        if (!openSubmenus.includes(item.id)) {
          setOpenSubmenus((prev) => [...prev, item.id]);
        }
      }
    });
  }, [activeTab]);

  const toggleSubmenu = (menuId: string) => {
    setOpenSubmenus((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.submenu) {
      toggleSubmenu(item.id);
    } else {
      onTabChange(item.id);
      if (isMobile) setIsMobileMenuOpen(false);
    }
  };

  const handleSubmenuClick = (subId: string) => {
    onTabChange(subId);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const handleQuickAction = (actionId: string) => {
    setShowQuickActions(false);
    // Mapear ações para tabs
    if (actionId === 'new-company') onTabChange('companies');
    if (actionId === 'new-contract') onTabChange('contracts');
    if (actionId === 'new-invoice') onTabChange('financial');
  };

  const isItemActive = (item: MenuItem) => {
    if (item.id === activeTab) return true;
    if (item.submenu?.some((sub) => sub.id === activeTab)) return true;
    return false;
  };

  // Sidebar content
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center shadow-lg shadow-[#F59E0B]/20">
            <span className="text-white font-bold text-lg">BP</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <span className="font-bold text-gray-900 text-lg whitespace-nowrap">
                  BoxPratico
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Botão de Ação Rápida */}
      <div className="p-4">
        <div className="relative">
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-xl transition-all hover:shadow-lg hover:shadow-[#F59E0B]/30 ${
              isExpanded ? 'px-4 py-3' : 'p-3'
            }`}
          >
            <PlusIcon className="w-5 h-5" />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-semibold whitespace-nowrap overflow-hidden"
                >
                  Criar
                </motion.span>
              )}
            </AnimatePresence>
            {isExpanded && (
              <ChevronDownIcon
                className={`w-4 h-4 transition-transform ${showQuickActions ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {/* Dropdown de ações */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {menuStructure.map((item) => (
          <div key={item.id} className="mb-1">
            {/* Item principal */}
            <button
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isItemActive(item)
                  ? 'bg-gradient-to-r from-[#FEF3C7] to-[#FDE68A] text-[#D97706]'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="relative">
                <item.icon className="w-6 h-6 flex-shrink-0" />
                {item.badge && !isExpanded && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {item.badgeCount || '!'}
                  </span>
                )}
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 flex items-center justify-between overflow-hidden"
                  >
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {item.badge && (
                        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.badgeCount || '!'}
                        </span>
                      )}
                      {item.submenu && (
                        <ChevronRightIcon
                          className={`w-4 h-4 transition-transform ${
                            openSubmenus.includes(item.id) ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Submenu */}
            <AnimatePresence>
              {item.submenu && openSubmenus.includes(item.id) && isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-6 pl-4 border-l-2 border-gray-200 mt-1 space-y-1">
                    {item.submenu.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubmenuClick(sub.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                          activeTab === sub.id
                            ? 'bg-[#F59E0B]/10 text-[#D97706] font-medium'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              <ChevronLeftIcon className="w-5 h-5" />
              <span className="text-sm">Recolher</span>
            </>
          ) : (
            <ChevronRightIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </>
  );

  // Desktop Sidebar
  if (!isMobile) {
    return (
      <motion.aside
        animate={{ width: isExpanded ? 280 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-40"
      >
        <SidebarContent />
      </motion.aside>
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
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
