'use client';

import { useSession, signOut } from 'next-auth/react';
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo - hidden on mobile since menu button is there */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pl-10 lg:pl-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center shadow-md">
              <span className="text-black font-bold text-sm sm:text-lg">BP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-display font-bold text-gray-900">BoxPratico</h1>
              <p className="text-xs text-gray-500">Marketing Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900">
                {session?.user?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <UserCircleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="Sair"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
