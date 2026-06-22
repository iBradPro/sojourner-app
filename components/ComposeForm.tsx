'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { MyCharacter, Mission, Post } from '@/lib/api';
import { getWriteToken } from '@/lib/token';
import RichTextEditor from '@/components/RichTextEditor';

function CoAuthorPicker({ allCharacters, selectedIds, onAdd, onRemove }: {
  allCharacters: MyCharacter[];
  selectedIds: number[];
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const added = allCharacters.filter(c => selectedIds.includes(c.id));
  const filtered = useMemo(() =>
    allCharacters
      .filter(c => c.name && !selectedIds.includes(c.id))
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 20),
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
            <span key={c.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-600 text-slate-100">
              {c.name}
              <button type="button" onClick={() => onRemove(c.id)} className="ml-1 text-slate-300 hover:text-white leading-none">×</button>
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
          placeholder="+ Add co-author…"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-600 text-sm"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); onAdd(c.id); setSearch(''); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
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
  const errorRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-5">
      {error && (
        <div ref={errorRef} className="bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-600"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Mission</label>
        <select
          value={missionId}
          onChange={e => setMissionId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-600"
        >
          <option value="">No mission</option>
          {missions.map(m => (
            <option key={m.id} value={m.id}>{m.title}{m.status === 'current' ? ' ★' : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-2">Characters</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {myCharacters.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleAuthor(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedAuthors.includes(c.id)
                  ? 'bg-sky-700 text-sky-100'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {allCharacters.length > 0 && (
          <CoAuthorPicker
            allCharacters={allCharacters}
            selectedIds={selectedAuthors}
            onAdd={id => toggleAuthor(id)}
            onRemove={id => toggleAuthor(id)}
          />
        )}
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Content</label>
        <RichTextEditor value={body} onChange={setBody} placeholder="Write your post..." />
      </div>

      <div className="flex gap-3 pb-4">
        <button
          onClick={() => handleSubmit('saved')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-200 font-medium hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button
          onClick={() => handleSubmit('activated')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-sky-700 text-white font-medium hover:bg-sky-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}
