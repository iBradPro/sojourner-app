'use client';
import { useState, useEffect, useCallback } from 'react';
import { getWriteToken } from '@/lib/token';

const WRITER_SCOPES = ['posts:read.own', 'posts:write', 'posts:delete', 'characters:read', 'missions:read'];

/*
 * The writer list used to be hardcoded here. On 2026-10-19 Adam joined and
 * there was simply no way to make him a token, because his name was not in the
 * array. So the list now comes from Nova: every user who owns a character is a
 * candidate, and the next writer to join appears without a deploy.
 */

type CharacterRow = {
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
  user_id?: number | null;
  user_name?: string | null;
};

type Writer = { id: number; name: string; characters: string[] };

function fullName(row: CharacterRow): string {
  return [row.first_name, row.last_name].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function buildWriters(rows: CharacterRow[]): Writer[] {
  const byUser = new Map<number, Writer>();
  for (const row of rows) {
    const userId = Number(row.user_id);
    if (!userId) continue;                       // unowned or NPC-only rows
    const writer =
      byUser.get(userId) ?? { id: userId, name: row.user_name || `User ${userId}`, characters: [] };
    // Only their own crew appear in the label. NPCs they also run would bury it.
    const name = fullName(row);
    if (name && (row.status === 'active' || row.status === 'pending')) writer.characters.push(name);
    byUser.set(userId, writer);
  }
  return [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function writerLabel(writer: Writer): string {
  return writer.characters.length ? `${writer.name} (${writer.characters.join(', ')})` : writer.name;
}

export default function GMTools() {
  const [isGM, setIsGM] = useState<boolean | null>(null);
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loadingWriters, setLoadingWriters] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [creating, setCreating] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getWriteToken();
    if (!token) { setIsGM(false); return; }
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/me', method: 'GET', token }),
    })
      .then(r => r.json())
      .then(data => setIsGM(data.scopes?.includes('posts:read.all') || data.user?.is_sysadmin || false))
      .catch(() => setIsGM(false));
  }, []);

  const loadWriters = useCallback(async () => {
    const token = getWriteToken();
    if (!token) return;
    setLoadingWriters(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // status=any so a writer whose character is pending or inactive is
        // still reachable. per_page is above the whole crew; Nova caps at 500.
        body: JSON.stringify({ path: '/characters?status=any&per_page=500', method: 'GET', token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      const list = buildWriters(Array.isArray(data?.data) ? data.data : []);
      if (list.length === 0) throw new Error('Nova returned no characters with an owner.');
      setWriters(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the writer list.');
    } finally {
      setLoadingWriters(false);
    }
  }, []);

  useEffect(() => {
    if (isGM) loadWriters();
  }, [isGM, loadWriters]);

  async function handleCreate() {
    const writer = writers.find(w => String(w.id) === selectedUserId);
    if (!writer) return;
    setCreating(true);
    setError('');
    setMagicLink('');
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/tokens',
          method: 'POST',
          useGmKey: true,
          body: {
            label: `Writer access - ${writer.name}`,
            scopes: WRITER_SCOPES,
            user_id: writer.id,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      if (!data.token) throw new Error('No token returned — check GM API key scopes.');
      setMagicLink(`${window.location.origin}/compose?token=${data.token}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isGM === null || !isGM) return null;

  return (
    <section className="space-y-3">
      <h2 className="lcars-label" style={{ '--lcars-orange': '#FF9966' } as React.CSSProperties}>GM Tools</h2>
      <div className="lcars-card px-4 py-4 space-y-4" style={{ borderLeftColor: '#FF9966' }}>
        <p className="text-sm" style={{ color: '#9999CC' }}>Generate a write-access setup link for a writer. Sends them directly into the app with their token saved.</p>

        {error && (
          <div className="rounded-xl px-3 py-2 text-sm" style={{ background: '#200', border: '1px solid #662222', color: '#ff9999' }}>{error}</div>
        )}

        {!magicLink ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-1" style={{ color: '#FF9966' }}>Writer</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full px-4 py-3 focus:outline-none"
                style={{ background: '#0d0d0d', border: '1px solid #3a2a0a', color: '#FFCC99', borderRadius: '0 0.75rem 0.75rem 0' }}
              >
                <option value="">{loadingWriters ? 'Loading writers…' : 'Select a writer…'}</option>
                {writers.map(w => (
                  <option key={w.id} value={w.id}>{writerLabel(w)}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !selectedUserId}
              className="w-full py-3 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
              style={{ background: '#FF9966', color: '#000' }}
            >
              {creating ? 'Creating token…' : 'Generate Setup Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: '#FFCC99' }}>
              Setup link for {writers.find(w => String(w.id) === selectedUserId)?.name}
            </p>
            <p className="text-xs font-mono break-all" style={{ color: '#9999CC' }}>{magicLink}</p>
            <div className="flex gap-2">
              <button onClick={copy} className="flex-1 py-2.5 rounded-full font-bold text-sm tracking-wide transition-colors"
                style={{ background: '#FF9900', color: '#000' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => { setMagicLink(''); setSelectedUserId(''); setError(''); }}
                className="px-4 py-2.5 rounded-full text-sm font-bold transition-colors"
                style={{ background: '#1a1000', border: '1px solid #9999CC', color: '#9999CC' }}
              >
                New
              </button>
            </div>
            <p className="text-xs" style={{ color: '#4a4a6a' }}>Send this to the writer. When they tap it, they're set up automatically.</p>
          </div>
        )}
      </div>
    </section>
  );
}
