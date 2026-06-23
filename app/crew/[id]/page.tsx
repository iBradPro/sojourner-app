import { api } from '@/lib/api';
import { scrapeCharacterProfile } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const charId = Number(id);

  const [char, profile] = await Promise.all([
    api.character(charId).catch(() => null),
    scrapeCharacterProfile(charId),
  ]);

  if (!char) notFound();

  const name = char.preferred_name ?? [char.first_name, char.last_name, char.suffix].filter(Boolean).join(' ');
  const credentials = char.suffix ?? null;

  return (
    <div className="px-4 py-6 space-y-6">
      <Link href="/crew" className="text-sm font-bold" style={{ color: '#9999CC' }}>← Crew</Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shrink-0"
          style={{ background: '#110820', color: '#BBAADD', border: '2px solid #BBAADD' }}>
          {name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#FFCC99' }}>{name}</h1>
          {credentials && <p className="text-sm mt-0.5" style={{ color: '#9999CC' }}>{credentials}</p>}
          <span className="inline-block mt-1 text-xs px-3 py-0.5 rounded-full capitalize font-bold"
            style={{
              background: char.status === 'active' ? '#0a2010' : '#1a1a1a',
              color: char.status === 'active' ? '#66cc88' : '#9999CC',
              border: `1px solid ${char.status === 'active' ? '#336644' : '#333'}`
            }}>
            {char.status}
          </span>
        </div>
      </div>

      {/* Profile sections from Nova */}
      {profile.length > 0 ? (
        <div className="space-y-6">
          {profile.map(section => (
            <section key={section.heading}>
              <h2 className="lcars-label mb-3">{section.heading}</h2>
              <div className="lcars-card divide-y" style={{ borderColor: '#1e1e2e' }}>
                {section.fields.map(({ label, value }) => (
                  <div key={label} className="px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#6666AA' }}>{label}</p>
                    <p className="text-sm whitespace-pre-line" style={{ color: '#FFCC99' }}>{value}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: '#9999CC' }}>No profile data available.</p>
      )}
    </div>
  );
}
