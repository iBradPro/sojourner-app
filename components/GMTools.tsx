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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600">GM Tools</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 space-y-4">
        <p className="text-slate-400 text-sm">Generate a write-access setup link for a writer. Sends them directly into the app with their token saved.</p>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-3 py-2 text-sm">{error}</div>
        )}

        {!magicLink ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Writer</label>
              <select
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-amber-600"
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
              className="w-full py-3 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating token…' : 'Generate Setup Link'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm font-medium">
              Setup link for {WRITERS.find(w => String(w.id) === selectedUserId)?.name}
            </p>
            <p className="text-slate-400 text-xs font-mono break-all">{magicLink}</p>
            <div className="flex gap-2">
              <button onClick={copy} className="flex-1 py-2.5 rounded-xl bg-sky-700 text-white text-sm font-medium hover:bg-sky-600 transition-colors">
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={() => { setMagicLink(''); setSelectedUserId(''); setError(''); }}
                className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
              >
                New
              </button>
            </div>
            <p className="text-slate-500 text-xs">Send this to the writer. When they tap it, they're set up automatically.</p>
          </div>
        )}
      </div>
    </section>
  );
}
