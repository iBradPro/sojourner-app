import { api } from '@/lib/api';
import Link from 'next/link';

export default async function CrewPage() {
  const crew = await api.characters({ status: 'active', per_page: 100 });

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#BBAADD' }}>Crew</h1>
        <span className="text-xs" style={{ color: '#9999CC' }}>{crew.total} active</span>
      </div>

      <ul className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
        {crew.data.map((char) => (
          <li key={char.id}>
            <Link href={`/crew/${char.id}`} className="lcars-card flex items-center gap-3 p-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                style={{ background: '#110820', color: '#BBAADD', border: '2px solid #BBAADD' }}>
                {(char.preferred_name ?? char.first_name ?? '?')[0]}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate" style={{ color: '#FFCC99' }}>{char.preferred_name}</p>
                <p className="text-xs capitalize" style={{ color: '#9999CC' }}>{char.status}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
