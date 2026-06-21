import { api } from '@/lib/api';
import Link from 'next/link';

export default async function CrewPage() {
  const crew = await api.characters({ status: 'active', per_page: 100 });

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sky-400">Crew</h1>
        <span className="text-xs text-slate-500">{crew.total} active</span>
      </div>

      <ul className="space-y-2">
        {crew.data.map((char) => (
          <li key={char.id}>
            <Link href={`/crew/${char.id}`} className="flex items-center gap-3 bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-sky-700 transition-colors">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-300 shrink-0">
                {(char.preferred_name ?? char.first_name ?? '?')[0]}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-100 truncate">{char.preferred_name}</p>
                <p className="text-xs text-slate-500 capitalize">{char.status}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
