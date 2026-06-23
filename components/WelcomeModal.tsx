'use client';
import { useState, useEffect } from 'react';
import { getWriteToken, setWriteToken } from '@/lib/token';

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getWriteToken()) setShow(true);
  }, []);

  function dismiss() {
    setShow(false);
  }

  async function handleSave() {
    const t = token.trim();
    if (!t.startsWith('scapi_')) {
      setError('Token should start with scapi_ — check that you copied it fully.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/me', method: 'GET', token: t }),
      });
      if (!res.ok) {
        setError("That token didn't work — check the scopes and that you selected yourself.");
        setSaving(false);
        return;
      }
    } catch {
      setError('Could not reach the server. Try again.');
      setSaving(false);
      return;
    }
    setWriteToken(t);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-2xl rounded-t-2xl px-5 pt-5 pb-24 space-y-4"
        style={{ background: '#0d0d0d', borderTop: '3px solid #BBAADD' }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#BBAADD' }}>Welcome to the USS Sojourner app!</h2>
          <p className="text-sm mt-2" style={{ color: '#BBAADD' }}>
            To read posts, missions, and explore the ship, no setup is needed.
            To write and edit posts, you'll need a personal API token.{' '}
            <a
              href="https://discord.com/users/301501040879075328"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#BBAADD', textDecoration: 'underline' }}
            >
              Contact your GM
            </a>{' '}
            for a setup link.
          </p>
        </div>

        {error && (
          <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#200', border: '1px solid #662222', color: '#ff9999' }}>{error}</div>
        )}

        <div className="space-y-2">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your API token (scapi_...)"
            className="w-full rounded-xl px-4 py-2.5 font-mono text-sm focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid #BBAADD', color: '#FFCC99' }}
          />
          <div className="flex gap-2">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-full text-sm font-bold tracking-wide transition-colors"
              style={{ background: '#1a1a1a', border: '1px solid #9999CC', color: '#9999CC' }}
            >
              Just browsing
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !token.trim()}
              className="flex-1 py-2.5 rounded-full text-sm font-bold tracking-wide transition-colors disabled:opacity-50"
              style={{ background: '#FF9900', color: '#000' }}
            >
              {saving ? 'Verifying…' : 'Set Up Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
