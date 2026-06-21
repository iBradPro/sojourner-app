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
      <Link href="/posts" className="text-sm text-slate-500 hover:text-slate-300">← Posts</Link>

      <article>
        <h1 className="text-xl font-bold text-slate-100 leading-snug">{post.title}</h1>
        <p className="text-xs text-slate-500 mt-2">
          {new Date(post.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {post.mission_id && (
          <Link href={`/missions/${post.mission_id}`} className="inline-block mt-1 text-xs text-sky-400 hover:text-sky-300">
            View mission →
          </Link>
        )}
        {post.summary && (
          <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Summary</p>
            <p className="text-slate-300 text-sm">{post.summary}</p>
          </div>
        )}
        <div className="mt-6">
          <PostReader content={post.content} />
        </div>
      </article>
    </div>
  );
}
