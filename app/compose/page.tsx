import { api } from '@/lib/api';
import ComposeForm from '@/components/ComposeForm';

export default async function ComposePage() {
  const [me, missions] = await Promise.all([
    api.me(),
    api.missions({ per_page: 100 }),
  ]);

  const myChars = [...me.characters.pc, ...me.characters.npc];

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-sky-400 mb-6">New Post</h1>
      <ComposeForm
        characters={myChars}
        missions={missions.data}
      />
    </div>
  );
}
