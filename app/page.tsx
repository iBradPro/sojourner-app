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
      <div className="relative w-full">
        <Image
          src="/sojourner-hero.jpg"
          alt="USS Sojourner NCC-85748"
          width={1400}
          height={307}
          className="w-full h-auto"
          priority
        />
      </div>

      <div className="px-4 space-y-8">
        <section className="space-y-5">
          <h1 className="text-2xl font-bold tracking-wide" style={{ color: '#FF9900' }}>USS Sojourner</h1>
          <p className="text-xs font-mono tracking-widest -mt-3" style={{ color: '#FFCC99' }}>NCC-85748</p>

          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#FFCC99' }}>In the 25th century…</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#BBAADD' }}>
              It is 2400, and the United Federation of Planets finds itself in an uneasy, weary peacetime. The Dominion has been silent for decades. The Romulan Star Empire is a fractured shadow of itself. The Klingon Empire has seemingly turned inward. And the Borg Collective, according to credible intelligence, has been destroyed — their shattered transwarp conduits littering space like precarious relics. But for all of this apparent peace, Starfleet feels like an institution in seasoned middle age: its newest captains trained to be cautious rather than bold, exploration kept closer to home, and the age of legendary mavericks quietly fading. Does anyone remember when we used to be explorers?
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#FFCC99' }}>A New Frontier</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#BBAADD' }}>
              A breakthrough changed the calculus. The Barzan Wormhole — long confirmed to be unstable — was stabilized for the first time through an unprecedented multi-power effort known as the Barzan Compact, bringing together the Federation, the Barzans, and even the Tholians. For the first time in a generation, the Delta Quadrant became reliably accessible. But Starfleet's return has been cautious: several vessels lost, hostile species more advanced than expected, and a new power vacuum left by the apparent collapse of the Borg. The Compact needs reliable diplomatic footholds to survive — and so Pathfinder Station was built.
            </p>
          </div>

          <div>
            <h2 className="text-base font-bold mb-1" style={{ color: '#FFCC99' }}>The Starship Sojourner</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#BBAADD' }}>
              Unwilling to commit major resources, Starfleet turned to smaller, time-tested vessels capable of operating autonomously for months between resupply. The Rhode Island-class was refitted for the task, and the first of these new ships deployed to the Delta Quadrant is the USS Sojourner — a long-range science survey vessel, a crew of eighty, and a mandate to explore the unknown on the far side of the galaxy. This is their story.
            </p>
          </div>
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
