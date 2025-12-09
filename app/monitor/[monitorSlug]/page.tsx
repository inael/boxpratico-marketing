import { notFound } from 'next/navigation';
import MonitorPlayer from '@/components/MonitorPlayer';
import { getMonitorBySlug } from '@/lib/database';

export default async function MonitorPage({
  params,
}: {
  params: Promise<{ monitorSlug: string }>;
}) {
  const { monitorSlug } = await params;
  const monitor = await getMonitorBySlug(monitorSlug);

  if (!monitor) {
    notFound();
  }

  if (!monitor.isActive) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">Monitor Desativado</h1>
          <p className="text-gray-400 text-lg">{monitor.name}</p>
          {monitor.location && (
            <p className="text-gray-500 mt-2">{monitor.location}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <MonitorPlayer monitorId={monitor.id} monitorSlug={monitor.slug} condominiumId={monitor.condominiumId} />
    </div>
  );
}
