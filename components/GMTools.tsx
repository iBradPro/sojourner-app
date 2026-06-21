'use client';
import { useState, useEffect } from 'react';
import { getWriteToken } from '@/lib/token';

const BASE_URL = 'https://sojourner-app-production.up.railway.app';

export default function GMTools() {
  const [isGM, setIsGM] = useState<boolean | null>(null);
  const [writerName, setWriterName] = useState('');
  const [writerToken, setWriterToken] = useState('');
  const [magicLink, setMagicLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getWriteToken();
    if (!token) { setIsGM(false); return; }
    fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/me', method: 'GET', token }),
    })
      .then(r => r.json())
      .then(data => {
        setIsGM(data.scopes?.includes('posts:read.all') || data.user?.is_sysadmin || false);
      })
      .catch(() => setIsGM(false));
  }, []);

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

  function reset() {
    setWriterName('');
    setWriterToken('');
    setMagicLink('');
    setCopied(false);
  }

  if (isGM === null) {
    return <div className="px-4 py-12 text-center text-slate-500 text-sm">Loading…</div>;
  }

  if (!isGM) {
    return (
      <div className="px-4 py-12 text-center text-slate-500 text-sm">
        GM access required.
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-amber-400">GM Tools</h1>
        <p className="text-slate-400 text-sm mt-1">Generate setup links for your writers.</p>
      </div>

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
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
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
              onClick={reset}
              className="px-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm hover:bg-slate-600 transition-colors"
            >
              New
            </button>
          </div>
          <p className="text-slate-500 text-xs">Send this link to {writerName || 'the writer'}. When they tap it, they're set up automatically.</p>
        </div>
      )}
    </div>
  );
}
