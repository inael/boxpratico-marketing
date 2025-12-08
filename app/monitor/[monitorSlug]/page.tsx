import { notFound } from 'next/navigation';
import MonitorPlayer from '@/components/MonitorPlayer';
import { promises as fs } from 'fs';
import path from 'path';
import { Monitor } from '@/types';

async function getMonitorBySlug(slug: string): Promise<Monitor | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'monitors.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const monitors: Monitor[] = JSON.parse(data);
    return monitors.find(m => m.slug === slug) || null;
  } catch {
    return null;
  }
}

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
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <div className="text-white text-4xl text-center">
          <p>Monitor desativado</p>
          <p className="text-xl mt-4 text-gray-400">{monitor.name}</p>
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
