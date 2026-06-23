'use client';
import { useState } from 'react';
import { setWriteToken } from '@/lib/token';

export default function WriteSetup() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const t = token.trim();
    if (!t.startsWith('scapi_')) {
      setError('Token should start with scapi_ — check that you copied the full token.');
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
        setError('Token didn\'t work — make sure you selected the right scopes and user.');
        setSaving(false);
        return;
      }
    } catch {
      setError('Could not reach the server. Try again.');
      setSaving(false);
      return;
    }
    setWriteToken(t);
    window.location.reload();
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#BBAADD' }}>Set Up Write Access</h1>
        <p className="text-sm mt-1" style={{ color: '#9999CC' }}>
          You need a personal API token to compose and edit posts.
        </p>
      </div>

      <div className="lcars-card px-4 py-3 text-sm" style={{ color: '#BBAADD' }}>
        Your GM will send you a setup link. If you received one, tap it and you'll be set up automatically. Or paste your token below if you have one.
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#200', border: '1px solid #662222', color: '#ff9999' }}>{error}</div>
      )}

      <div className="space-y-3">
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="scapi_..."
          className="w-full px-4 py-3 font-mono text-sm focus:outline-none"
          style={{ background: '#0d0d0d', border: '1px solid #3a2a0a', color: '#FFCC99', borderRadius: '0 0.75rem 0.75rem 0' }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !token.trim()}
          className="w-full py-3 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ background: '#FF9900', color: '#000' }}
        >
          {saving ? 'Verifying…' : 'Save Token'}
        </button>
      </div>
    </div>
  );
}
