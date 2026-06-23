import { api } from '@/lib/api';
import { stripHtml } from '@/lib/utils';
import Link from 'next/link';

export default async function MissionsPage() {
  const missions = await api.missions({ per_page: 100 });

  const grouped = {
    current: missions.data.filter((m) => m.status === 'current'),
    upcoming: missions.data.filter((m) => m.status === 'upcoming'),
    completed: missions.data.filter((m) => m.status === 'completed'),
  };

  return (
    <div className="px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold" style={{ color: '#FF9900' }}>Missions</h1>

      {(['current', 'upcoming', 'completed'] as const).map((status) => {
        const list = grouped[status];
        if (!list.length) return null;
        return (
          <section key={status}>
            <h2 className="lcars-label mb-3 capitalize">{status}</h2>
            <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
              {list.map((mission) => (
                <li key={mission.id}>
                  <Link href={`/missions/${mission.id}`} className="lcars-card block p-4">
                    <p className="font-semibold" style={{ color: '#FFCC99' }}>{mission.title}</p>
                    {mission.description && (
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{stripHtml(mission.description)}</p>
                    )}
                    {mission.start && (
                      <p className="text-xs mt-2" style={{ color: '#4a4a6a' }}>
                        {new Date(mission.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        {mission.end ? ` – ${new Date(mission.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ' – present'}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
