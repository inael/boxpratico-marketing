import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          BoxPrático Marketing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de marketing digital para condomínios
        </p>
        <div className="space-x-4">
          <Link
            href="/admin"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Acessar Painel Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
