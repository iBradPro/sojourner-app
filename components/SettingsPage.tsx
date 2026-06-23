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
      <h1 className="text-xl font-bold" style={{ color: '#FF9900' }}>Settings</h1>

      <section className="space-y-3">
        <h2 className="lcars-label">Write Access</h2>
        <div className="lcars-card px-4 py-4 space-y-3">
          {tokenCleared ? (
            <p className="text-sm" style={{ color: '#9999CC' }}>
              Token removed.{' '}
              <a href="/compose" style={{ color: '#FF9900', textDecoration: 'underline' }}>Set up write access</a>
            </p>
          ) : hasToken ? (
            <>
              <p className="text-sm" style={{ color: '#FFCC99' }}>Your API token is saved on this device.</p>
              <button onClick={handleClearToken} className="text-sm font-bold transition-colors" style={{ color: '#CC6666' }}>
                Remove token (sign out of write access)
              </button>
            </>
          ) : (
            <p className="text-sm" style={{ color: '#9999CC' }}>
              No token set.{' '}
              <a href="/compose" style={{ color: '#FF9900', textDecoration: 'underline' }}>Set up write access</a>
            </p>
          )}
        </div>
      </section>

      <GMTools />
    </div>
  );
}
