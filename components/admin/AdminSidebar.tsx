'use client';

import {
  HomeIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon,
  TvIcon,
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  UsersIcon,
  FolderIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'condominiums', label: 'Locais', icon: BuildingOfficeIcon },
    { id: 'monitors', label: 'Telas', icon: TvIcon },
    { id: 'advertisers', label: 'Anunciantes', icon: UserGroupIcon },
    { id: 'media', label: 'Mídias', icon: PhotoIcon },
    { id: 'media-groups', label: 'Grupos de Mídias', icon: FolderIcon },
    { id: 'library', label: 'Biblioteca', icon: CloudArrowUpIcon },
    { id: 'campaigns', label: 'Playlists', icon: MegaphoneIcon },
    { id: 'contracts', label: 'Contratos', icon: DocumentTextIcon },
    { id: 'users', label: 'Usuários', icon: UsersIcon },
    { id: 'reports', label: 'Relatórios', icon: DocumentChartBarIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Configurações', icon: CogIcon },
  ];

  // Close mobile menu when tab changes
  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Abrir menu"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">BP</span>
            </div>
            <span className="font-bold text-gray-900">Menu</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fechar menu"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-lg shadow-[#F59E0B]/30'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
