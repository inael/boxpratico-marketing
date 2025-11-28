'use client';

export default function AdminFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>© {currentYear} BoxPrático Marketing.</span>
            <span className="hidden sm:inline">Sistema de digital signage para condomínios.</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="hover:text-primary-600 transition-colors"
            >
              Documentação
            </a>
            <a
              href="#"
              className="hover:text-primary-600 transition-colors"
            >
              Suporte
            </a>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
