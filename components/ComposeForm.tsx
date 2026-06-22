'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { MyCharacter, Mission, Post } from '@/lib/api';
import { getWriteToken } from '@/lib/token';

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
        <div className="flex flex-wrap gap-2">
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
          {allCharacters.length > 0 && (
            <>
              <div className="w-full border-t border-slate-700 my-1" />
              {allCharacters.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleAuthor(c.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedAuthors.includes(c.id)
                      ? 'bg-slate-500 text-slate-100'
                      : 'bg-slate-800/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 block mb-1">Content</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write your post..."
          rows={16}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-600 resize-none leading-relaxed"
        />
        <p className="text-xs text-slate-600 mt-1">{body.length} characters</p>
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
