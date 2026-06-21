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

  return (
    <div className="space-y-8 pb-6">
      <div className="relative w-full h-48">
        <Image
          src="https://sojourner.simcentral.org/application/assets/images/tour/Sojo111.png"
          alt="USS Sojourner"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
        <div className="absolute bottom-0 left-0 px-4 pb-3">
          <h1 className="text-2xl font-bold text-sky-400">USS Sojourner</h1>
          <p className="text-slate-400 text-sm">NCC-85748 · Rhode Island-class</p>
        </div>
      </div>

      <div className="px-4 space-y-8">
        <section>
          <p className="text-slate-300 text-sm leading-relaxed">
            Set in the 25th century in the Delta Quadrant, the Sojourner is deployed as part of the Pathfinder II Project — establishing diplomatic ties with species near the Barzan wormhole, months between refuel and resupply.
          </p>
        </section>

        {currentMission && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Current Mission</h2>
            <Link href={`/missions/${currentMission.id}`} className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-sky-700 transition-colors">
              <p className="font-semibold text-sky-300">{currentMission.title}</p>
              {currentMission.description && (
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{stripHtml(currentMission.description)}</p>
              )}
            </Link>
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">SOJO Stats</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center col-span-2">
              <p className="text-3xl font-bold text-sky-400">{booksWritten}</p>
              <p className="text-xs text-slate-500 mt-1">Books Written</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
              <p className="text-3xl font-bold text-sky-400">{recentPosts.total}</p>
              <p className="text-xs text-slate-500 mt-1">Posts</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
              <p className="text-3xl font-bold text-sky-400">{writers}</p>
              <p className="text-xs text-slate-500 mt-1">Writers</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
              <p className="text-3xl font-bold text-sky-400">{activeChars.total}</p>
              <p className="text-xs text-slate-500 mt-1">Main Characters</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
              <p className="text-3xl font-bold text-sky-400">{npcChars.total}</p>
              <p className="text-xs text-slate-500 mt-1">NPCs</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
              <p className="text-3xl font-bold text-sky-400">{allMissions.total}</p>
              <p className="text-xs text-slate-500 mt-1">Missions</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
