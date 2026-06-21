'use client';
import { useState } from 'react';
import ComposeForm from '@/components/ComposeForm';
import type { MyCharacter, Mission, Post } from '@/lib/api';

interface Props {
  characters: MyCharacter[];
  missions: Mission[];
  drafts: Post[];
  initialTab: 'new' | 'drafts';
  editDraft: Post | null;
  savedBanner: boolean;
  isGM: boolean;
}

export default function WriteTabs({ characters, missions, drafts, initialTab, editDraft, savedBanner, isGM }: Props) {
  const [tab, setTab] = useState<'new' | 'drafts'>(initialTab);
  const [activeDraft, setActiveDraft] = useState<Post | null>(editDraft);
  const [gmView, setGmView] = useState(false);

  const myCharNames = new Set(characters.map(c => c.name));
  const myDrafts = drafts.filter(d =>
    d.authors?.split(',').map(s => s.trim()).some(a => myCharNames.has(a))
  );
  const visibleDrafts = isGM && gmView ? drafts : myDrafts;

  function openDraft(draft: Post) {
    setActiveDraft(draft);
    setTab('new');
  }

  function startNew() {
    setActiveDraft(null);
    setTab('new');
  }

  return (
    <div className="px-4 py-6">
      {savedBanner && (
        <div className="bg-emerald-900/50 border border-emerald-700 text-emerald-300 rounded-xl px-4 py-3 text-sm mb-4">
          Draft saved.
        </div>
      )}

      <div className="flex rounded-xl bg-slate-800 p-1 mb-6">
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
