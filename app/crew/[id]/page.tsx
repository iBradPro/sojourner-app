import { api } from '@/lib/api';
import { stripHtml } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [char, postsRes] = await Promise.all([
    api.character(Number(id)).catch(() => null),
    api.posts({ author_id: Number(id), per_page: 10 }).catch(() => ({ data: [], total: 0 })),
  ]);

  if (!char) notFound();

  const name = char.preferred_name ?? [char.first_name, char.last_name, char.suffix].filter(Boolean).join(' ');

  return (
    <div className="px-4 py-6 space-y-6">
      <Link href="/crew" className="text-sm font-bold" style={{ color: '#9999CC' }}>← Crew</Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
          style={{ background: '#1a0f00', color: '#FF9900', border: '2px solid #FF9900' }}>
          {name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#FFCC99' }}>{name}</h1>
          <span className="inline-block mt-1 text-xs px-3 py-0.5 rounded-full capitalize font-bold"
            style={{ background: char.status === 'active' ? '#0a2010' : '#1a1a1a', color: char.status === 'active' ? '#66cc88' : '#9999CC', border: `1px solid ${char.status === 'active' ? '#336644' : '#333'}` }}>
            {char.status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="lcars-card divide-y" style={{ borderColor: '#2a1f0a' }}>
        {char.first_name && char.last_name && char.preferred_name !== `${char.first_name} ${char.last_name}` && (
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm" style={{ color: '#9999CC' }}>Full Name</span>
            <span className="text-sm" style={{ color: '#FFCC99' }}>{[char.first_name, char.last_name, char.suffix].filter(Boolean).join(' ')}</span>
          </div>
        )}
        {char.rank && (
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm" style={{ color: '#9999CC' }}>Rank</span>
            <span className="text-sm font-mono" style={{ color: '#FFCC99' }}>#{char.rank}</span>
          </div>
        )}
        <div className="flex justify-between px-4 py-3">
          <span className="text-sm" style={{ color: '#9999CC' }}>Posts</span>
          <span className="text-sm" style={{ color: '#FF9900' }}>{postsRes.total}</span>
        </div>
      </div>

      {/* Recent posts */}
      {postsRes.data.length > 0 && (
        <section>
          <h2 className="lcars-label mb-3">Recent Posts</h2>
          <ul className="space-y-2">
            {postsRes.data.map(post => (
              <li key={post.id}>
                <Link href={`/posts/${post.id}`} className="lcars-card block px-4 py-3">
                  <p className="font-medium line-clamp-1" style={{ color: '#FFCC99' }}>{post.title}</p>
                  {post.summary && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{post.summary}</p>
                  )}
                  {!post.summary && post.content && (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{stripHtml(post.content).slice(0, 120)}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
