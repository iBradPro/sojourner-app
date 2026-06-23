import { api } from '@/lib/api';
import PostReader from '@/components/PostReader';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await api.post(Number(id)).catch(() => null);

  if (!post) notFound();

  return (
    <div className="px-4 py-6 space-y-6">
      <Link href="/posts" className="text-sm font-bold" style={{ color: '#9999CC' }}>← Posts</Link>

      <article>
        <h1 className="text-xl font-bold leading-snug" style={{ color: '#FFCC99' }}>{post.title}</h1>
        <p className="text-xs mt-2" style={{ color: '#4a4a6a' }}>
          {new Date(post.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {post.mission_id && (
          <Link href={`/missions/${post.mission_id}`} className="inline-block mt-1 text-xs font-bold" style={{ color: '#BBAADD' }}>
            View mission →
          </Link>
        )}
        {post.summary && (
          <div className="mt-4 p-3 rounded-lg" style={{ background: '#0d0d0d', border: '1px solid #2a1f0a' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#BBAADD' }}>Summary</p>
            <p className="text-sm" style={{ color: '#BBAADD' }}>{post.summary}</p>
          </div>
        )}
        <div className="mt-6">
          <PostReader content={post.content} />
        </div>
      </article>
    </div>
  );
}
