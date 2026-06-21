'use client';
import { useState, useEffect } from 'react';
import { getWriteToken, clearWriteToken } from '@/lib/token';
import GMTools from '@/components/GMTools';

export default function SettingsPage() {
  const [hasToken, setHasToken] = useState(false);
  const [tokenCleared, setTokenCleared] = useState(false);

  useEffect(() => {
    setHasToken(!!getWriteToken());
  }, []);

  function handleClearToken() {
    clearWriteToken();
    setHasToken(false);
    setTokenCleared(true);
  }

  return (
    <div className="px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold text-slate-100">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Write Access</h2>
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 space-y-3">
          {tokenCleared ? (
            <p className="text-slate-400 text-sm">Token removed. <a href="/compose" className="text-sky-400 underline">Set up write access</a></p>
          ) : hasToken ? (
            <>
              <p className="text-slate-300 text-sm">Your API token is saved on this device.</p>
              <button onClick={handleClearToken} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Remove token (sign out of write access)
              </button>
            </>
          ) : (
            <p className="text-slate-400 text-sm">No token set. <a href="/compose" className="text-sky-400 underline">Set up write access</a></p>
          )}
        </div>
      </section>

      <GMTools />
    </div>
  );
}
