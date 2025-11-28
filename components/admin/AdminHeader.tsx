'use client';

import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function AdminHeader() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">BP</span>
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-gray-900">BoxPrático</h1>
              <p className="text-xs text-gray-500">Marketing Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <BellIcon className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <UserCircleIcon className="w-10 h-10 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
