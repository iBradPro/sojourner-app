'use client';
import { useState, useEffect } from 'react';
import ComposeForm from '@/components/ComposeForm';
import WriteSetup from '@/components/WriteSetup';
import { getWriteToken, clearWriteToken, setWriteToken } from '@/lib/token';
import type { MyCharacter, Mission, Post } from '@/lib/api';

interface Props {
  initialTab: 'new' | 'drafts';
  savedBanner: boolean;
  magicToken: string | null;
}

async function proxyFetch<T>(path: string, token: string, params?: Record<string, string>): Promise<T> {
  const url = params
    ? `${path}?${new URLSearchParams(params)}`
    : path;
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: url, method: 'GET', token }),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function WriteTabs({ initialTab, savedBanner, magicToken }: Props) {
  const [tab, setTab] = useState<'new' | 'drafts'>(initialTab);
  const [activeDraft, setActiveDraft] = useState<Post | null>(null);
  const [gmView, setGmView] = useState(false);
  const [showTokenPanel, setShowTokenPanel] = useState(false);

  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [characters, setCharacters] = useState<MyCharacter[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [isGM, setIsGM] = useState(false);

  useEffect(() => {
    if (magicToken) {
      setWriteToken(magicToken);
      window.location.replace('/compose');
      return;
    }

    const token = getWriteToken();
    if (!token) {
      setHasToken(false);
      setLoading(false);
      return;
    }
    setHasToken(true);

    async function fetchData() {
      try {
        const [me, missionsRes, draftsRes] = await Promise.all([
          proxyFetch<{ user: { is_sysadmin: boolean }; characters: { pc: MyCharacter[]; npc: MyCharacter[] }; scopes: string[] }>('/me', token!),
          proxyFetch<{ data: Mission[] }>('/missions', token!, { per_page: '100' }),
          proxyFetch<{ data: Post[] }>('/posts', token!, { status: 'saved', per_page: '50' }),
        ]);
        setCharacters([...me.characters.pc, ...me.characters.npc]);
        setMissions(missionsRes.data);
        setDrafts(draftsRes.data);
        setIsGM(me.scopes.includes('posts:read.all') || me.user.is_sysadmin);
      } catch {
        // token may be invalid — clear it and show setup
        clearWriteToken();
        setHasToken(false);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [magicToken]);

  const myCharNames = new Set(characters.map(c => c.name));
  const myCharIds = new Set(characters.map(c => String(c.id)));
  const myDrafts = drafts.filter(d => {
    const parts = d.authors?.split(',').map(s => s.trim()) ?? [];
    return parts.some(a => myCharNames.has(a) || myCharIds.has(a));
  });
  const visibleDrafts = isGM && gmView ? drafts : myDrafts;

  function openDraft(draft: Post) {
    setActiveDraft(draft);
    setTab('new');
  }

  function startNew() {
    setActiveDraft(null);
    setTab('new');
  }

  function handleClearToken() {
    clearWriteToken();
    window.location.reload();
  }

  if (hasToken === null || loading) {
    return (
      <div className="px-4 py-12 text-center text-slate-500 text-sm">Loading…</div>
    );
  }

  if (!hasToken) return <WriteSetup />;

  return (
    <div className="px-4 py-6">
      {savedBanner && (
        <div className="bg-emerald-900/50 border border-emerald-700 text-emerald-300 rounded-xl px-4 py-3 text-sm mb-4">
          Draft saved.
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <div className="flex flex-1 rounded-xl bg-slate-800 p-1">
          <button
            onClick={startNew}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'new' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {activeDraft ? 'Edit Draft' : 'New Post'}
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'drafts' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Drafts {myDrafts.length > 0 && <span className="ml-1 text-xs text-slate-400">({myDrafts.length})</span>}
          </button>
        </div>
        <button
          onClick={() => setShowTokenPanel(v => !v)}
          className="text-slate-500 hover:text-slate-300 text-lg leading-none px-1"
          title="Token settings"
        >
          ⚙
        </button>
      </div>

      {showTokenPanel && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 mb-4 space-y-2">
          <p className="text-slate-300 text-sm font-medium">Write Token</p>
          <p className="text-slate-500 text-xs">Your API token is saved on this device.</p>
          <button
            onClick={handleClearToken}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Remove token (sign out of write access)
          </button>
        </div>
      )}

      {tab === 'new' && (
        <ComposeForm
          key={activeDraft?.id ?? 'new'}
          characters={characters}
          missions={missions}
          draft={activeDraft ?? undefined}
        />
      )}

      {tab === 'drafts' && (
        <div className="space-y-3">
          {isGM && (
            <div className="flex justify-end mb-1">
              <button
                onClick={() => setGmView(v => !v)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  gmView ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {gmView ? 'GM View ★' : 'GM View'}
              </button>
            </div>
          )}
          {visibleDrafts.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No saved drafts.</p>
          ) : (
            visibleDrafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => openDraft(draft)}
                className="w-full text-left bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-4 transition-colors"
              >
                <p className="text-slate-100 font-medium">{draft.title || 'Untitled'}</p>
                {gmView && draft.authors && (
                  <p className="text-slate-500 text-xs mt-0.5">{draft.authors}</p>
                )}
                <p className="text-slate-500 text-xs mt-1">{new Date(draft.date).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
