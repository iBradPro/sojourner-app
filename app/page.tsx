import { api } from '@/lib/api';
import { stripHtml } from '@/lib/utils';
import Link from 'next/link';

export default async function Home() {
  const [recentPosts, missions] = await Promise.all([
    api.posts({ per_page: 5 }),
    api.missions({ status: 'current' }),
  ]);

  const currentMission = missions.data[0] ?? null;

  return (
    <div className="px-4 py-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-sky-400">USS Sojourner</h1>
        <p className="text-slate-400 text-sm mt-1">NCC-2999 · Delta Quadrant</p>
      </header>

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Recent Posts</h2>
          <Link href="/posts" className="text-xs text-sky-400 hover:text-sky-300">View all →</Link>
        </div>
        <ul className="space-y-2">
          {recentPosts.data.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.id}`} className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-sky-700 transition-colors">
                <p className="font-medium text-slate-100 line-clamp-1">{post.title}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Stats</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
            <p className="text-3xl font-bold text-sky-400">{recentPosts.total}</p>
            <p className="text-xs text-slate-500 mt-1">Total Posts</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 text-center">
            <p className="text-3xl font-bold text-sky-400">{missions.total}</p>
            <p className="text-xs text-slate-500 mt-1">Missions</p>
          </div>
        </div>
      </section>
    </div>
  );
}
