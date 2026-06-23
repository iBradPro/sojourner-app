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
        <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#0d2010', border: '1px solid #2a6040', color: '#88ddaa' }}>
          Draft saved to the sim.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#BBAADD' }}>Posts</h1>
        <span className="text-xs" style={{ color: '#9999CC' }}>{posts.total} total</span>
      </div>

      <ul className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
        {posts.data.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`} className="lcars-card block p-4">
              <p className="font-medium line-clamp-1" style={{ color: '#FFCC99' }}>{post.title}</p>
              {post.summary && <p className="text-sm mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{post.summary}</p>}
              <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link href={`/posts?page=${page - 1}`} className="text-sm font-bold" style={{ color: '#BBAADD' }}>← Newer</Link>
          ) : <span />}
          <span className="text-xs" style={{ color: '#9999CC' }}>Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/posts?page=${page + 1}`} className="text-sm font-bold" style={{ color: '#BBAADD' }}>Older →</Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
