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
    // Quick validation: try /me with this token
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
        <h1 className="text-xl font-bold text-sky-400">Set Up Write Access</h1>
        <p className="text-slate-400 text-sm mt-1">
          You need a personal API token to compose and edit posts.
        </p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
        Your GM will send you a setup link. If you received one, tap it and you'll be set up automatically. Or paste your token below if you have one.
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="scapi_..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-600 font-mono text-sm"
        />
        <button
          onClick={handleSave}
          disabled={saving || !token.trim()}
          className="w-full py-3 rounded-xl bg-sky-700 text-white font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Verifying…' : 'Save Token'}
        </button>
      </div>
    </div>
  );
}
