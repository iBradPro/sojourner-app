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

      <ol className="space-y-4 text-sm text-slate-300">
        <li className="flex gap-3">
          <span className="text-sky-500 font-bold shrink-0">1.</span>
          <span>
            Go to{' '}
            <a
              href="https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Manage/api_tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 underline"
            >
              Sojourner API Tokens
            </a>{' '}
            and create a new token.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-sky-500 font-bold shrink-0">2.</span>
          <span>
            Select <strong className="text-slate-100">your name</strong> in the user dropdown, then enable these scopes:{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">posts:read.own</code>{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">posts:write</code>{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">posts:delete</code>{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">characters:read</code>{' '}
            <code className="text-xs bg-slate-800 px-1 py-0.5 rounded">missions:read</code>
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-sky-500 font-bold shrink-0">3.</span>
          <span>Copy the token and paste it below.</span>
        </li>
      </ol>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
        Not sure how? Ask the GM to send you a setup link instead.
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
