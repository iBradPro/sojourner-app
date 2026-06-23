export const revalidate = 3600;

import { api } from '@/lib/api';
import Link from 'next/link';

export default async function CrewPage() {
  const [active, npcs, manifestHtml] = await Promise.all([
    api.characters({ status: 'active', per_page: 100 }),
    api.characters({ status: 'npc', per_page: 100 }),
    fetch('https://sojourner.simcentral.org/personnel/index', { next: { revalidate: 3600 } }).then(r => r.text()),
  ]);

  const manifestIds = new Set(
    [...manifestHtml.matchAll(/personnel\/character\/(\d+)/g)].map(m => Number(m[1]))
  );

  const allChars = [...active.data, ...npcs.data]
    .filter(c => manifestIds.has(c.id))
    .sort((a, b) => (a.preferred_name ?? '').localeCompare(b.preferred_name ?? ''));

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#BBAADD' }}>Crew Manifest</h1>
        <span className="text-xs" style={{ color: '#9999CC' }}>{allChars.length} crew</span>
      </div>

      <ul className="space-y-2">
        {allChars.map(char => {
          const name = char.preferred_name ?? [char.first_name, char.last_name].filter(Boolean).join(' ') ?? '?';
          const initial = name[0];
          return (
            <li key={char.id}>
              <Link href={`/crew/${char.id}`} className="lcars-card flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                  style={{ background: '#110820', color: '#BBAADD', border: '2px solid #BBAADD' }}>
                  {initial}
                </div>
                <p className="font-medium truncate" style={{ color: '#FFCC99' }}>{name}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
