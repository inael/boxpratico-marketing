import { notFound } from 'next/navigation';
import { getCondominiumBySlug } from '@/lib/db';
import PlaylistPlayer from '@/components/PlaylistPlayer';

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ condominiumSlug: string }>;
}) {
  const { condominiumSlug } = await params;
  const condominium = getCondominiumBySlug(condominiumSlug);

  if (!condominium) {
    notFound();
  }

  return (
    <div className="w-full h-screen overflow-hidden">
      <PlaylistPlayer condominiumId={condominium.id} />
    </div>
  );
}
