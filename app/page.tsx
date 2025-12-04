import Link from 'next/link';
import { PlayIcon, TvIcon, ChartBarIcon, SparklesIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-pink-500/10 to-teal-500/10 animate-gradient"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full mb-8">
              <SparklesIcon className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                Sistema de Marketing Digital
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-display font-bold text-gray-900 mb-6 animate-slide-up">
              BoxPrático
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-pink-600 to-teal-600">
                Marketing
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
              Transforme a comunicação do seu condomínio com um sistema completo de
              <span className="font-semibold text-indigo-600"> digital signage </span>
              profissional
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{animationDelay: '0.2s'}}>
              <Link
                href="/admin"
                className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-lg px-8 py-4 inline-flex items-center gap-2"
              >
                <TvIcon className="w-6 h-6" />
                Acessar Painel Admin
              </Link>

              <a
                href="#features"
                className="border-2 border-gray-800 text-gray-900 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-all duration-200 text-lg px-8 py-4"
              >
                Conhecer Recursos
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Recursos Poderosos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para criar uma experiência visual incrível
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 group hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PlayIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
                Player Inteligente
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Sistema de reprodução em loop infinito com suporte para imagens, vídeos, PDFs e YouTube
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 group hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TvIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
                Gestão Completa
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Painel administrativo intuitivo para gerenciar todos os condomínios e suas mídias
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 group hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ChartBarIcon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-display font-semibold text-gray-900 mb-3">
                Notícias em Tempo Real
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Integração automática com Google News para manter os moradores informados
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-indigo-600 via-pink-600 to-teal-600 animate-gradient">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-display font-bold text-white mb-6">
            Pronto para começar?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Configure seu primeiro condomínio em menos de 5 minutos
          </p>
          <Link
            href="/admin"
            className="inline-block px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 transform"
          >
            Iniciar Agora
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} BoxPrático Marketing. Sistema de digital signage para condomínios.
          </p>
        </div>
      </footer>
    </div>
  );
}
