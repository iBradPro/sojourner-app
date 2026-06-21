import { api } from '@/lib/api';
import { stripHtml } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [mission, posts] = await Promise.all([
    api.mission(Number(id)).catch(() => null),
    api.posts({ mission: Number(id), per_page: 100 }),
  ]);

  if (!mission) notFound();

  return (
    <div className="px-4 py-6 space-y-6">
      <Link href="/missions" className="text-sm text-slate-500 hover:text-slate-300">← Missions</Link>

      <div>
        <h1 className="text-2xl font-bold text-sky-400">{mission.title}</h1>
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full capitalize font-medium ${
          mission.status === 'current' ? 'bg-sky-900 text-sky-300' :
          mission.status === 'upcoming' ? 'bg-amber-900 text-amber-300' :
          'bg-slate-800 text-slate-400'
        }`}>{mission.status}</span>
        {mission.description && (
          <p className="text-slate-300 mt-4 leading-relaxed">{stripHtml(mission.description)}</p>
        )}
      </div>

      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Posts ({posts.total})
        </h2>
        <ul className="space-y-2">
          {posts.data.map((post) => (
            <li key={post.id}>
              <Link href={`/posts/${post.id}`} className="block bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-sky-700 transition-colors">
                <p className="font-medium text-slate-100 line-clamp-1">{post.title}</p>
                {post.summary && <p className="text-slate-400 text-sm mt-1 line-clamp-2">{post.summary}</p>}
                <p className="text-xs text-slate-600 mt-1">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </Link>
            </li>
          ))}
        </ul>
        {posts.total > 100 && (
          <p className="text-center text-slate-500 text-sm mt-4">Showing 100 of {posts.total} posts</p>
        )}
      </section>
    </div>
  );
}
