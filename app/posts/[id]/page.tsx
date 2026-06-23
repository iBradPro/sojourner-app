import { api } from '@/lib/api';
import PostReader from '@/components/PostReader';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await api.post(Number(id)).catch(() => null);

  if (!post) notFound();

  const dateStr = new Date(post.date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="px-3 py-4">
      <Link href="/posts" className="inline-block mb-3 text-sm font-bold" style={{ color: '#9999CC' }}>← Posts</Link>

      {/* PADD body */}
      <div className="rounded-3xl overflow-hidden" style={{
        background: '#111',
        border: '2px solid #2a2a3a',
        boxShadow: '0 0 0 1px #0a0a14, 0 8px 32px rgba(0,0,0,0.8)',
      }}>

        {/* PADD top bar — LCARS header strip */}
        <div className="flex items-stretch gap-0" style={{ background: '#0a0a14', borderBottom: '1px solid #2a2a3a' }}>
          {/* Orange end-cap pill */}
          <div style={{ width: '2.5rem', background: '#FF9900', borderRadius: '0', flexShrink: 0 }} />
          {/* Lavender label area */}
          <div className="flex items-center px-3 gap-3" style={{ background: '#1a1030', flexShrink: 0 }}>
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#BBAADD' }}>
              PADD
            </span>
          </div>
          {/* Purple mid-bar */}
          <div className="flex-1 flex items-center px-4" style={{ background: '#0d0a1a' }}>
            <span className="text-xs font-mono truncate" style={{ color: '#6666AA' }}>{dateStr}</span>
          </div>
          {/* Peach right pip */}
          <div style={{ width: '1rem', background: '#FFCC99', flexShrink: 0 }} />
          <div style={{ width: '0.5rem', background: '#FF9966', flexShrink: 0 }} />
        </div>

        {/* PADD screen — content area */}
        <div className="px-5 pt-5 pb-4" style={{ background: '#0d0d10' }}>
          {/* Title */}
          <h1 className="text-xl font-bold leading-snug mb-3" style={{ color: '#FFCC99' }}>
            {post.title}
          </h1>

          {/* Mission link */}
          {post.mission_id && (
            <Link href={`/missions/${post.mission_id}`}
              className="inline-block mb-3 text-xs font-bold"
              style={{ color: '#BBAADD' }}>
              View mission →
            </Link>
          )}

          {/* Summary */}
          {post.summary && (
            <div className="mb-4 px-3 py-2 rounded-lg" style={{
              background: '#0a0a18',
              borderLeft: '3px solid #9999CC',
            }}>
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#6666AA' }}>Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: '#BBAADD' }}>{post.summary}</p>
            </div>
          )}

          {/* Divider */}
          <div className="mb-4" style={{ height: '1px', background: 'linear-gradient(to right, #FF9900 1.5rem, #2a2a3a 1.5rem)' }} />

          {/* Body */}
          <PostReader content={post.content} />
        </div>

        {/* PADD bottom bar — control strip */}
        <div className="flex items-stretch" style={{ background: '#0a0a14', borderTop: '1px solid #2a2a3a', minHeight: '2.25rem' }}>
          <div style={{ width: '0.5rem', background: '#FF9966', flexShrink: 0 }} />
          <div style={{ width: '1rem', background: '#FFCC99', flexShrink: 0 }} />
          <div className="flex-1 flex items-center justify-center gap-2 px-3" style={{ background: '#0d0a1a' }}>
            {/* Three decorative indicator dots */}
            {['#FF9900', '#9999CC', '#BBAADD'].map((c, i) => (
              <div key={i} style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', background: c, opacity: 0.6 }} />
            ))}
          </div>
          <div style={{ width: '2.5rem', background: '#9999CC', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}
