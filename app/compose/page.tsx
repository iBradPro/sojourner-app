import { api } from '@/lib/api';
import WriteTabs from '@/components/WriteTabs';
import type { Post } from '@/lib/api';

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; draft?: string; saved?: string }>;
}) {
  const { tab, draft: draftId, saved } = await searchParams;

  const [me, missions, draftsRes] = await Promise.all([
    api.me(),
    api.missions({ per_page: 100 }),
    api.posts({ status: 'saved', per_page: 50 }),
  ]);

  const myChars = [...me.characters.pc, ...me.characters.npc];
  const drafts: Post[] = draftsRes.data;

  const editDraft = draftId ? (drafts.find(d => d.id === Number(draftId)) ?? null) : null;

  return (
    <WriteTabs
      characters={myChars}
      missions={missions.data}
      drafts={drafts}
      initialTab={tab === 'drafts' ? 'drafts' : 'new'}
      editDraft={editDraft}
      savedBanner={!!saved}
    />
  );
}
