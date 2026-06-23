'use client';
import { useState, useEffect, useMemo } from 'react';
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
  const [myCharacters, setMyCharacters] = useState<MyCharacter[]>([]);
  const [allCharacters, setAllCharacters] = useState<MyCharacter[]>([]);
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
        const [me, missionsRes, draftsRes, charsRes] = await Promise.all([
          proxyFetch<{ user: { is_sysadmin: boolean }; characters: { pc: MyCharacter[]; npc: MyCharacter[] }; scopes: string[] }>('/me', token!),
          proxyFetch<{ data: Mission[] }>('/missions', token!, { per_page: '100' }),
          proxyFetch<{ data: Post[] }>('/posts', token!, { status: 'saved', per_page: '50' }),
          Promise.all([
            proxyFetch<{ data: (MyCharacter & { display_name?: string })[] }>('/characters', token!, { per_page: '200', status: 'active' }).catch(() => ({ data: [] })),
            proxyFetch<{ data: (MyCharacter & { display_name?: string })[] }>('/characters', token!, { per_page: '200', status: 'npc' }).catch(() => ({ data: [] })),
          ]).then(([pcs, npcs]) => ({ data: [...pcs.data, ...npcs.data] })),
        ]);
        const mine = [...me.characters.pc, ...me.characters.npc].sort((a, b) => a.name.localeCompare(b.name));
        setMyCharacters(mine);
        const myIds = new Set(mine.map(c => c.id));
        // API returns display_name; normalise to name for consistency
        const normalise = (c: MyCharacter & { display_name?: string; preferred_name?: string }) =>
          ({ ...c, name: c.name || c.display_name || c.preferred_name || '' });
        setAllCharacters(charsRes.data.filter(c => !myIds.has(c.id)).map(normalise).sort((a, b) => a.name.localeCompare(b.name)));
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

  // Map id → name for resolving raw IDs stored in draft.authors
  const charMap = useMemo(() => {
    const m = new Map<number, string>();
    [...myCharacters, ...allCharacters].forEach(c => { if (c.name) m.set(c.id, c.name); });
    return m;
  }, [myCharacters, allCharacters]);

  const myCharNames = new Set(myCharacters.map(c => c.name));
  const myCharIds = new Set(myCharacters.map(c => String(c.id)));
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
      <div className="px-4 py-12 text-center text-sm" style={{ color: '#9999CC' }}>Loading…</div>
    );
  }

  if (!hasToken) return <WriteSetup />;

  return (
    <div className="px-4 py-6">
      {savedBanner && (
        <div className="rounded-xl px-4 py-3 text-sm font-medium mb-4" style={{ background: '#0d2010', border: '1px solid #2a6040', color: '#88ddaa' }}>
          Draft saved.
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        <div className="flex flex-1 rounded-full p-1 gap-1" style={{ background: '#0d0d0d', border: '1px solid #2a1f0a' }}>
          <button
            onClick={startNew}
            className="flex-1 py-2 rounded-full text-sm font-bold tracking-wide transition-colors"
            style={tab === 'new'
              ? { background: '#BBAADD', color: '#000' }
              : { color: '#9999CC' }}
          >
            {activeDraft ? 'Edit Draft' : 'New Post'}
          </button>
          <button
            onClick={() => setTab('drafts')}
            className="flex-1 py-2 rounded-full text-sm font-bold tracking-wide transition-colors"
            style={tab === 'drafts'
              ? { background: '#9999CC', color: '#000' }
              : { color: '#9999CC' }}
          >
            Drafts {myDrafts.length > 0 && <span className="ml-1 text-xs opacity-70">({myDrafts.length})</span>}
          </button>
        </div>
      </div>

      {tab === 'new' && (
        <ComposeForm
          key={activeDraft?.id ?? 'new'}
          myCharacters={myCharacters}
          allCharacters={allCharacters}
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
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                style={gmView
                  ? { background: '#BBAADD', color: '#000' }
                  : { background: '#0d0d0d', color: '#9999CC', border: '1px solid #2a1f0a' }}
              >
                {gmView ? 'GM View ★' : 'GM View'}
              </button>
            </div>
          )}
          {visibleDrafts.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9999CC' }}>No saved drafts.</p>
          ) : (
            visibleDrafts.map(draft => (
              <button
                key={draft.id}
                onClick={() => openDraft(draft)}
                className="w-full text-left lcars-card px-4 py-4 transition-colors"
              >
                <p className="font-medium" style={{ color: '#FFCC99' }}>{draft.title || 'Untitled'}</p>
                <p className="text-xs mt-1.5" style={{ color: '#4a4a6a' }}>{new Date(draft.date).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
