'use client';

import {
  HomeIcon,
  BuildingOfficeIcon,
  PhotoIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'condominiums', label: 'Condomínios', icon: BuildingOfficeIcon },
    { id: 'media', label: 'Mídias', icon: PhotoIcon },
    { id: 'campaigns', label: 'Campanhas', icon: MegaphoneIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', label: 'Configurações', icon: CogIcon },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <nav className="flex-1 px-4 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
