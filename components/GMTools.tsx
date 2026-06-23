'use client';
import { useState, useEffect } from 'react';
import { getWriteToken } from '@/lib/token';

const BASE_URL = 'https://sojourner-app-production.up.railway.app';
const WRITER_SCOPES = ['posts:read.own', 'posts:write', 'posts:delete', 'characters:read', 'missions:read'];

const WRITERS = [
  { id: 47, name: 'Andrew (Thomas Mitchell)' },
  { id: 11, name: 'Brian Whyte' },
  { id: 7,  name: 'Christopher (Karim)' },
  { id: 46, name: 'Dan (Theodor Wishmore)' },
  { id: 44, name: 'Doug (Ezhr Delja)' },
  { id: 34, name: 'Fox (M\'Razza)' },
  { id: 31, name: 'Heather (Xex Wang)' },
  { id: 26, name: 'Kim (Mei Ratthi)' },
  { id: 2,  name: 'Kyle (Noah Balsam)' },
  { id: 8,  name: 'Mark' },
  { id: 45, name: 'Marty (Amarok tr\'Ragnar)' },
  { id: 37, name: 'Nate (Axod Qo)' },
  { id: 1,  name: 'Reece' },
  { id: 41, name: 'Teresa Grace (Kaelira Tamsin)' },
];

export default function GMTools() {
  const [isGM, setIsGM] = useState<boolean | null>(null);
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

  async function handleCreate() {
    const writer = WRITERS.find(w => String(w.id) === selectedUserId);
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
      setMagicLink(`${BASE_URL}/compose?token=${data.token}`);
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
                <option value="">Select a writer…</option>
                {WRITERS.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
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
              Setup link for {WRITERS.find(w => String(w.id) === selectedUserId)?.name}
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
