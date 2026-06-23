import { api } from '@/lib/api';
import { stripHtml } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  const [recentPosts, currentMissions, allMissions, activeChars, npcChars] = await Promise.all([
    api.posts({ per_page: 50 }),
    api.missions({ status: 'current' }),
    api.missions({ per_page: 1 }),
    api.characters({ status: 'active', per_page: 200 }),
    api.characters({ status: 'npc', per_page: 1 }),
  ]);

  const currentMission = currentMissions.data[0] ?? null;

  const writers = new Set(activeChars.data.map(c => c.user_id).filter(Boolean)).size;

  const avgWords = recentPosts.data.reduce((sum, p) => {
    const text = stripHtml(p.content).trim();
    return sum + (text ? text.split(/\s+/).length : 0);
  }, 0) / (recentPosts.data.length || 1);
  const booksWritten = Math.floor((avgWords * recentPosts.total) / 50000);

  const stats = [
    { label: 'Books Written', value: booksWritten },
    { label: 'Posts', value: recentPosts.total },
    { label: 'Writers', value: writers },
    { label: 'Characters', value: activeChars.total },
    { label: 'NPCs', value: npcChars.total },
    { label: 'Missions', value: allMissions.total },
  ];

  return (
    <div className="space-y-8 pb-6">
      <div className="relative w-full aspect-[3/1]">
        <Image
          src="https://sojourner.simcentral.org/application/views/lcars/main/images/head-img.png"
          alt="USS Sojourner NCC-85748"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1024px"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
      </div>

      <div className="px-4 space-y-8">
        <section>
          <p className="text-sm leading-relaxed" style={{ color: '#BBAADD' }}>
            Set in the 25th century in the Delta Quadrant, the Sojourner is deployed as part of the Pathfinder II Project — establishing diplomatic ties with species near the Barzan wormhole, months between refuel and resupply.
          </p>
        </section>

        {currentMission && (
          <section>
            <h2 className="lcars-label mb-3">Current Mission</h2>
            <Link href={`/missions/${currentMission.id}`} className="lcars-card block p-4">
              <p className="font-semibold" style={{ color: '#FFCC99' }}>{currentMission.title}</p>
              {currentMission.description && (
                <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{stripHtml(currentMission.description)}</p>
              )}
            </Link>
          </section>
        )}

        <section>
          <h2 className="lcars-label mb-3">SOJO Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.map(({ label, value }) => (
              <div key={label} className="lcars-card p-4 text-center">
                <p className="text-3xl font-bold" style={{ color: '#FF9900' }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: '#9999CC' }}>{label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
