'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  ChevronRightIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  GiftIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { signOut, useSession } from 'next-auth/react';

interface Breadcrumb {
  label: string;
  id?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success';
}

interface AdminHeaderV2Props {
  breadcrumbs: Breadcrumb[];
  onNavigate?: (id: string) => void;
  sidebarExpanded: boolean;
}

// Mock notifications - em produção viria da API
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Novo pagamento',
    message: 'Você recebeu um pagamento de R$ 350,00',
    time: '5 min',
    read: false,
    type: 'success',
  },
  {
    id: '2',
    title: 'Contrato pendente',
    message: 'O contrato #123 aguarda assinatura',
    time: '1h',
    read: false,
    type: 'warning',
  },
];

export default function AdminHeaderV2({
  breadcrumbs,
  onNavigate,
  sidebarExpanded,
}: AdminHeaderV2Props) {
  const { data: session } = useSession();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-30 transition-all duration-300 left-0 lg:left-[var(--sidebar-width)]`}
      style={{
        '--sidebar-width': sidebarExpanded ? '280px' : '80px',
      } as React.CSSProperties}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronRightIcon className="w-4 h-4 text-gray-400" />}
            {crumb.id && onNavigate ? (
              <button
                onClick={() => onNavigate(crumb.id!)}
                className={`hover:text-[#F59E0B] transition-colors ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}
              >
                {crumb.label}
              </button>
            ) : (
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                }
              >
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 rounded-full transition-colors ${
              showNotifications
                ? 'bg-[#FEF3C7] text-[#D97706]'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <BellIcon className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Alertas</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-[#F59E0B] hover:text-[#D97706]"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                          !notification.read ? 'bg-[#FFFBEB]' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              notification.type === 'success'
                                ? 'bg-green-100 text-green-600'
                                : notification.type === 'warning'
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-blue-100 text-blue-600'
                            }`}
                          >
                            <BellIcon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-gray-500 text-sm truncate">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[#F59E0B] rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-2 p-1.5 rounded-full transition-colors ${
              showUserMenu
                ? 'bg-[#FEF3C7]'
                : 'hover:bg-gray-100'
            }`}
          >
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </button>

          {/* User Menu Dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
              >
                {/* User Info */}
                <div className="p-4 border-b border-gray-100">
                  <p className="font-medium text-gray-900 truncate">
                    {session?.user?.email || 'usuario@email.com'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {session?.user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Usuário'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                    <UserCircleIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Minha conta</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                    <GiftIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Meus Beneficios</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                    <CreditCardIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Planos</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                    <Cog6ToothIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Configurações</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors">
                    <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">Ajuda</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
