import { api } from '@/lib/api';
import { stripHtml } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const charId = Number(id);

  const [char, postsRes] = await Promise.all([
    api.character(charId).catch(() => null),
    // API doesn't support author filter — fetch a big batch and filter client-side
    api.posts({ per_page: 100 }).catch(() => ({ data: [], total: 0 })),
  ]);

  if (!char) notFound();

  const name = char.preferred_name ?? [char.first_name, char.last_name, char.suffix].filter(Boolean).join(' ');

  // Filter posts where this character's ID appears in the comma-separated authors field
  const charPosts = postsRes.data.filter(p => {
    if (!p.authors) return false;
    return p.authors.split(',').map(s => s.trim()).includes(String(charId));
  });

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
          {char.suffix && <p className="text-sm mt-0.5" style={{ color: '#9999CC' }}>{char.suffix}</p>}
          <span className="inline-block mt-1 text-xs px-3 py-0.5 rounded-full capitalize font-bold"
            style={{
              background: char.status === 'active' ? '#0a2010' : '#1a1a1a',
              color: char.status === 'active' ? '#66cc88' : '#9999CC',
              border: `1px solid ${char.status === 'active' ? '#336644' : '#333'}`
            }}>
            {char.status}
          </span>
        </div>
      </div>

      {/* Info card */}
      <div className="lcars-card divide-y" style={{ borderColor: '#2a1f0a' }}>
        {char.rank && (
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm" style={{ color: '#9999CC' }}>Rank</span>
            <span className="text-sm font-mono" style={{ color: '#FFCC99' }}>#{char.rank}</span>
          </div>
        )}
        {charPosts.length > 0 && (
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm" style={{ color: '#9999CC' }}>Recent Posts</span>
            <span className="text-sm font-bold" style={{ color: '#FF9900' }}>{charPosts.length}</span>
          </div>
        )}
      </div>

      {/* Recent posts */}
      {charPosts.length > 0 && (
        <section>
          <h2 className="lcars-label mb-3">Recent Posts</h2>
          <ul className="space-y-2">
            {charPosts.slice(0, 10).map(post => (
              <li key={post.id}>
                <Link href={`/posts/${post.id}`} className="lcars-card block px-4 py-3">
                  <p className="font-medium line-clamp-1" style={{ color: '#FFCC99' }}>{post.title}</p>
                  {post.summary ? (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{post.summary}</p>
                  ) : post.content ? (
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: '#9999CC' }}>{stripHtml(post.content).slice(0, 120)}</p>
                  ) : null}
                  <p className="text-xs mt-1" style={{ color: '#4a4a6a' }}>
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {charPosts.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: '#9999CC' }}>No recent posts found.</p>
          )}
        </section>
      )}

      {charPosts.length === 0 && (
        <p className="text-sm" style={{ color: '#9999CC' }}>No posts found in the most recent 100.</p>
      )}
    </div>
  );
}
