'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MyCharacter, Mission, Post } from '@/lib/api';
import { getWriteToken } from '@/lib/token';
import RichTextEditor from '@/components/RichTextEditor';

const FIELD_INPUT = {
  background: '#0d0d0d',
  border: '1px solid #3a2a0a',
  color: '#FFCC99',
  borderRadius: '0 0.75rem 0.75rem 0',
} as const;

const FIELD_FOCUS_CLASS = 'focus:outline-none';

function CharacterPicker({ allCharacters, selectedIds, onAdd, onRemove }: {
  allCharacters: MyCharacter[];
  selectedIds: number[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const added = allCharacters.filter(c => selectedIds.includes(c.id) && c.name);
  const filtered = useMemo(() =>
    allCharacters
      .filter(c => c.name && !selectedIds.includes(c.id))
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 30),
    [allCharacters, selectedIds, search]
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="space-y-2">
      {added.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {added.map(c => (
            <span key={c.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: '#3a1f00', color: '#FFCC99', border: '2px solid #FF9900' }}>
              {c.name}
              <button type="button" onClick={() => onRemove(c.id)} className="ml-1 leading-none" style={{ color: '#FF9900' }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div ref={ref} className="relative">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="+ Add Character…"
          className={`w-full px-4 py-2.5 text-sm ${FIELD_FOCUS_CLASS}`}
          style={{ ...FIELD_INPUT, borderRadius: '0 0.75rem 0.75rem 0' }}
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto"
            style={{ background: '#0d0d0d', border: '1px solid #3a2a0a' }}>
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); onAdd(c.id); setSearch(''); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#FFCC99' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1a1000')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function proxyRequest(path: string, method: string, body?: Record<string, unknown>) {
  const token = getWriteToken();
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, method, body, ...(token ? { token } : {}) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

interface Props {
  myCharacters: MyCharacter[];
  allCharacters: MyCharacter[];
  missions: Mission[];
  draft?: Post;
}

export default function ComposeForm({ myCharacters, allCharacters, missions, draft }: Props) {
  const router = useRouter();
  const allChars = [...myCharacters, ...allCharacters];
  const myCharIds = new Set(myCharacters.map(c => c.id));
  const [title, setTitle] = useState(draft?.title ?? '');
  const [body, setBody] = useState(draft?.content ?? '');
  const [missionId, setMissionId] = useState<string>(
    draft?.mission_id != null
      ? String(draft.mission_id)
      : String(missions.find(m => m.status === 'current')?.id ?? '')
  );
  const [selectedAuthors, setSelectedAuthors] = useState<number[]>(() => {
    if (!draft) return [];
    const parts = draft.authors?.split(',').map(s => s.trim()) ?? [];
    return allChars.filter(c => parts.includes(String(c.id)) || parts.includes(c.name)).map(c => c.id);
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lockOwner, setLockOwner] = useState<string | null>(null); // non-null = locked by someone else
  const errorRef = useRef<HTMLDivElement>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Acquire lock when editing an existing draft
  useEffect(() => {
    if (!draft) return;
    const id = draft.id;

    async function acquire() {
      try {
        const res = await proxyRequest(`/posts/${id}/lock`, 'POST');
        if (res.yours) {
          setLockOwner(null);
          // Heartbeat every 5 minutes
          heartbeatRef.current = setInterval(async () => {
            try { await proxyRequest(`/posts/${id}/lock`, 'PUT'); } catch {}
          }, 5 * 60 * 1000);
        }
      } catch (e: unknown) {
        // 409 = someone else holds the lock
        const msg = e instanceof Error ? e.message : '';
        const match = msg.match(/^(.+)$/);
        setLockOwner(match?.[1] ?? 'another writer');
      }
    }

    acquire();

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      proxyRequest(`/posts/${id}/lock`, 'DELETE').catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error]);

  function toggleAuthor(id: number) {
    setSelectedAuthors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(status: 'saved' | 'activated') {
    if (!title.trim() || !body.trim()) {
      setError('Title and content are required.');
      return;
    }
    if (selectedAuthors.length === 0 || !selectedAuthors.some(id => myCharIds.has(id))) {
      setError('At least one of your own characters must be selected.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        status,
        mission_id: missionId ? Number(missionId) : undefined,
        authors: selectedAuthors.join(','),
      };
      const post = draft
        ? await proxyRequest(`/posts/${draft.id}`, 'PATCH', payload)
        : await proxyRequest('/posts', 'POST', payload);

      // Release lock and stop heartbeat before navigating away
      if (draft) {
        if (heartbeatRef.current) clearInterval(heartbeatRef.current);
        await proxyRequest(`/posts/${draft.id}/lock`, 'DELETE').catch(() => {});
      }

      if (status === 'activated') {
        router.push(`/posts/${post.id}`);
      } else {
        router.push('/compose?saved=1');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  const isLocked = lockOwner !== null;

  return (
    <div className="space-y-5">
      {lockOwner && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: '#1a1000', border: '1px solid #FF9900', color: '#FFCC99' }}>
          🔒 This post is currently being edited by <strong>{lockOwner}</strong>. You can view it but cannot make changes until they finish.
        </div>
      )}
      {error && (
        <div ref={errorRef} className="rounded-xl px-4 py-3 text-sm" style={{ background: '#200', border: '1px solid #662222', color: '#ff9999' }}>{error}</div>
      )}

      <div>
        <label className="lcars-label mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title"
          disabled={isLocked}
          className={`w-full px-4 py-3 ${FIELD_FOCUS_CLASS} disabled:opacity-50`}
          style={FIELD_INPUT}
        />
      </div>

      <div>
        <label className="lcars-label mb-2">Mission</label>
        <select
          value={missionId}
          onChange={e => setMissionId(e.target.value)}
          disabled={isLocked}
          className={`w-full px-4 py-3 ${FIELD_FOCUS_CLASS} disabled:opacity-50`}
          style={FIELD_INPUT}
        >
          <option value="">No mission</option>
          {missions.map(m => (
            <option key={m.id} value={m.id}>{m.title}{m.status === 'current' ? ' ★' : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="lcars-label mb-2">Characters</label>
        <CharacterPicker
          allCharacters={allChars}
          selectedIds={selectedAuthors}
          onAdd={id => toggleAuthor(id)}
          onRemove={id => toggleAuthor(id)}
        />
      </div>

      <div>
        <label className="lcars-label mb-2">Content</label>
        <RichTextEditor value={body} onChange={setBody} placeholder="Write your post..." />
      </div>

      <div className="flex gap-3 pb-4">
        <button
          onClick={() => handleSubmit('saved')}
          disabled={saving || isLocked}
          className="flex-1 py-3 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ background: '#0d0a1a', border: '1px solid #6666AA', color: '#9999CC' }}
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          onClick={() => handleSubmit('activated')}
          disabled={saving || isLocked}
          className="flex-1 py-3 rounded-full font-bold text-sm tracking-wide transition-colors disabled:opacity-50"
          style={{ background: '#FF9900', color: '#000' }}
        >
          {saving ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
