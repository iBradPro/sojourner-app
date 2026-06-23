import { api } from '@/lib/api';
import { scrapeCharacterProfile, getDepartment, DEPARTMENT_ORDER } from '@/lib/utils';
import CharacterImageViewer from '@/components/CharacterImageViewer';
import Link from 'next/link';

export default async function CrewPage() {
  const [active, npcs] = await Promise.all([
    api.characters({ status: 'active', per_page: 100 }),
    api.characters({ status: 'npc', per_page: 100 }),
  ]);
  const allChars = [...active.data, ...npcs.data];

  // Fetch image + position for all crew in parallel (cached 1hr)
  const profiles = await Promise.all(
    allChars.map(c => scrapeCharacterProfile(c.id).catch(() => ({ imageUrl: null, position: null, sections: [] })))
  );

  // Group by department
  const grouped = new Map<string, { char: typeof allChars[0]; imageUrl: string | null; position: string | null }[]>();
  allChars.forEach((char, i) => {
    const { imageUrl, position } = profiles[i];
    const dept = getDepartment(position);
    if (!grouped.has(dept)) grouped.set(dept, []);
    grouped.get(dept)!.push({ char, imageUrl, position });
  });

  // Sort departments by canonical order
  const departments = DEPARTMENT_ORDER.filter(d => grouped.has(d));

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#BBAADD' }}>Crew</h1>
        <span className="text-xs" style={{ color: '#9999CC' }}>{allChars.length} crew</span>
      </div>

      {departments.map(dept => (
        <section key={dept}>
          <h2 className="lcars-label mb-3">{dept}</h2>
          <ul className="space-y-2">
            {grouped.get(dept)!.map(({ char, imageUrl, position }) => {
              const initial = (char.preferred_name ?? char.first_name ?? '?')[0];
              return (
                <li key={char.id}>
                  <Link href={`/crew/${char.id}`} className="lcars-card flex items-center gap-3 p-3">
                    {imageUrl ? (
                      <CharacterImageViewer src={imageUrl} alt={char.preferred_name ?? ''} size="list" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                        style={{ background: '#110820', color: '#BBAADD', border: '2px solid #BBAADD' }}>
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate" style={{ color: '#FFCC99' }}>{char.preferred_name}</p>
                      {position && <p className="text-xs truncate mt-0.5" style={{ color: '#9999CC' }}>{position}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
