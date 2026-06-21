'use client';
import { useState, useEffect } from 'react';
import { getWriteToken, setWriteToken } from '@/lib/token';

const DISMISSED_KEY = 'sojo_welcomed';

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only show if no token and never dismissed
    if (!getWriteToken() && !localStorage.getItem(DISMISSED_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
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
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border-t border-slate-700 rounded-t-2xl px-5 pt-4 pb-24 space-y-3">
        <div>
          <h2 className="text-xl font-bold text-sky-400">Welcome to the USS Sojourner app!</h2>
          <p className="text-slate-400 text-sm mt-1">
            To read posts, missions, and explore the ship, no setup is needed.
            To write and edit posts, you'll need a personal API token.{' '}
            <a
              href="https://discord.com/users/301501040879075328"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 underline"
            >
              Contact your GM
            </a>{' '}
            for a setup link.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div className="space-y-2">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="Paste your API token (scapi_...)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-600 font-mono text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-600 transition-colors"
            >
              Just browsing
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !token.trim()}
              className="flex-1 py-2.5 rounded-xl bg-sky-700 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Verifying…' : 'Set Up Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
