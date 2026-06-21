'use client';
import { useState, useEffect } from 'react';
import { getWriteToken, clearWriteToken } from '@/lib/token';

const BASE_URL = 'https://sojourner-app-production.up.railway.app';

export default function SettingsPage() {
  const [isGM, setIsGM] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [tokenCleared, setTokenCleared] = useState(false);

  // GM Tools state
  const [writerName, setWriterName] = useState('');
  const [writerToken, setWriterToken] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getWriteToken();
    if (!token) return;
    setHasToken(true);
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/me', method: 'GET', token }),
    })
      .then(r => r.json())
      .then(data => {
        setIsGM(data.scopes?.includes('posts:read.all') || data.user?.is_sysadmin || false);
      })
      .catch(() => {});
  }, []);

  function handleClearToken() {
    clearWriteToken();
    setHasToken(false);
    setIsGM(false);
    setTokenCleared(true);
  }

  function generate() {
    const t = writerToken.trim();
    if (!t) return;
    setMagicLink(`${BASE_URL}/compose?token=${t}`);
    setCopied(false);
  }

  function copy() {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetForm() {
    setWriterName('');
    setWriterToken('');
    setMagicLink('');
    setCopied(false);
  }

  return (
    <div className="px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold text-slate-100">Settings</h1>

      {/* Write Access */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Write Access</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 space-y-3">
          {tokenCleared ? (
            <p className="text-slate-400 text-sm">Token removed. <a href="/compose" className="text-sky-400 underline">Set up write access</a></p>
          ) : hasToken ? (
            <>
              <p className="text-slate-300 text-sm">Your API token is saved on this device.</p>
              <button
                onClick={handleClearToken}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Remove token (sign out of write access)
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">No token set. <a href="/compose" className="text-sky-400 underline">Set up write access</a></p>
          )}
        </div>
      </section>

      {/* GM Tools */}
      {isGM && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-600">GM Tools</h2>
          <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 space-y-4">
            <p className="text-slate-400 text-sm">Generate a setup link for a writer. Paste the API token you created for them on the Nova admin page.</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Writer Name</label>
                <input
                  type="text"
                  value={writerName}
                  onChange={e => setWriterName(e.target.value)}
                  placeholder="e.g. Reece"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Their API Token</label>
                <input
                  type="text"
                  value={writerToken}
                  onChange={e => { setWriterToken(e.target.value); setMagicLink(''); }}
                  placeholder="scapi_..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-600 font-mono text-sm"
                />
              </div>
              <button
                onClick={generate}
                disabled={!writerToken.trim()}
                className="w-full py-3 rounded-xl bg-amber-700 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                Generate Setup Link
              </button>
            </div>

            {magicLink && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-3">
                {writerName && (
                  <p className="text-slate-300 text-sm font-medium">Setup link for {writerName}</p>
                )}
                <p className="text-slate-400 text-xs font-mono break-all">{magicLink}</p>
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="flex-1 py-2.5 rounded-xl bg-sky-700 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
                  >
                    New
                  </button>
                </div>
                <p className="text-slate-500 text-xs">Send this to {writerName || 'the writer'}. When they tap it, they're set up automatically.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
