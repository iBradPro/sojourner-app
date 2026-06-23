import { api } from '@/lib/api';
import Link from 'next/link';

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ page?: string; saved?: string }> }) {
  const { page: pageParam, saved } = await searchParams;
  const page = Number(pageParam ?? 1);
  const posts = await api.posts({ per_page: 25, page });

  const totalPages = Math.ceil(posts.total / posts.per_page);

  return (
    <div className="px-4 py-6 space-y-4">
      {saved && (
        <div className="bg-emerald-900/50 border border-emerald-700 text-emerald-300 rounded-xl px-4 py-3 text-sm">
          Draft saved to the sim.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sky-400">Posts</h1>
        <span className="text-xs text-slate-500">{posts.total} total</span>
      </div>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link href={`/posts?page=${page - 1}`} className="text-sm text-sky-400 hover:text-sky-300">← Newer</Link>
          ) : <span />}
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/posts?page=${page + 1}`} className="text-sm text-sky-400 hover:text-sky-300">Older →</Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
