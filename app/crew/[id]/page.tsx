import { api } from '@/lib/api';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const char = await api.character(Number(id)).catch(() => null);

  if (!char) notFound();

  const name = char.preferred_name ?? [char.first_name, char.last_name, char.suffix].filter(Boolean).join(' ');

  return (
    <div className="px-4 py-6 space-y-6">
      <Link href="/crew" className="text-sm text-slate-500 hover:text-slate-300">← Crew</Link>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-3xl font-bold text-slate-300">
          {name[0]}
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100">{name}</h1>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
            char.status === 'active' ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-400'
          }`}>{char.status}</span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-800 divide-y divide-slate-800">
        {char.rank && (
          <div className="flex justify-between px-4 py-3">
            <span className="text-slate-500 text-sm">Rank ID</span>
            <span className="text-slate-200 text-sm">{char.rank}</span>
          </div>
        )}
        <div className="flex justify-between px-4 py-3">
          <span className="text-slate-500 text-sm">Status</span>
          <span className="text-slate-200 text-sm capitalize">{char.status}</span>
        </div>
        {char.user_id && (
          <div className="flex justify-between px-4 py-3">
            <span className="text-slate-500 text-sm">Player ID</span>
            <span className="text-slate-200 text-sm">{char.user_id}</span>
          </div>
        )}
      </div>
    </div>
  );
}
