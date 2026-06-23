export const revalidate = 3600;

import Link from 'next/link';

const NO_AVATAR = 'https://sojourner.simcentral.org/application/views/_base_override/main/images/no-avatar.png';

interface CrewMember {
  id: number;
  name: string;
  position: string;
  imageUrl: string | null;
}

function parseManifest(html: string): Map<string, CrewMember[]> {
  const grouped = new Map<string, CrewMember[]>();
  let currentDept = 'Other';

  // Split on department headers and character blocks
  const deptRe = /<h2 class="dept">([^<]+)<\/h2>/g;
  const charRe = /personnel\/character\/(\d+)"[^>]*>\s*<img src="([^"]+)"[^>]*class="charimg"[\s\S]*?class="name">([^<]+)<\/a><br\s*\/>[\s\S]*?class="position">([^<]+)<\/span>/g;

  // Walk through HTML tracking dept sections
  let deptMatch: RegExpExecArray | null;
  let charMatch: RegExpExecArray | null;

  // Collect all dept positions and char positions
  const depts: { index: number; name: string }[] = [];
  while ((deptMatch = deptRe.exec(html)) !== null) {
    depts.push({ index: deptMatch.index, name: deptMatch[1].replace(/&amp;/g, '&').trim() });
  }

  const chars: { index: number; id: number; name: string; position: string; imageUrl: string | null }[] = [];
  while ((charMatch = charRe.exec(html)) !== null) {
    const src = charMatch[2];
    chars.push({
      index: charMatch.index,
      id: Number(charMatch[1]),
      imageUrl: src.includes('no-avatar') ? null : src,
      name: charMatch[3].trim(),
      position: charMatch[4].trim(),
    });
  }

  // Assign each char to its dept (last dept header before the char)
  for (const char of chars) {
    const dept = [...depts].reverse().find(d => d.index < char.index)?.name ?? 'Other';
    if (!grouped.has(dept)) grouped.set(dept, []);
    // Deduplicate by id within dept (manifest lists some chars under multiple depts)
    if (!grouped.get(dept)!.find(c => c.id === char.id)) {
      grouped.get(dept)!.push({ id: char.id, name: char.name, position: char.position, imageUrl: char.imageUrl });
    }
  }

  return grouped;
}

export default async function CrewPage() {
  const html = await fetch('https://sojourner.simcentral.org/personnel/index', {
    next: { revalidate: 3600 },
  }).then(r => r.text());

  const grouped = parseManifest(html);
  const totalCrew = [...grouped.values()].reduce((n, arr) => n + arr.length, 0);

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#BBAADD' }}>Crew Manifest</h1>
        <span className="text-xs" style={{ color: '#9999CC' }}>{totalCrew} crew</span>
      </div>

      {[...grouped.entries()].map(([dept, members]) => (
        <section key={dept}>
          <h2 className="lcars-label mb-3">{dept}</h2>
          <ul className="space-y-2">
            {members.map(({ id, name, position, imageUrl }) => (
              <li key={`${dept}-${id}`}>
                <Link href={`/crew/${id}`} className="lcars-card flex items-center gap-3 p-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name}
                      className="w-10 h-10 rounded-full shrink-0 object-cover"
                      style={{ border: '2px solid #BBAADD' }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                      style={{ background: '#110820', color: '#BBAADD', border: '2px solid #BBAADD' }}>
                      {name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate" style={{ color: '#FFCC99' }}>{name}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#9999CC' }}>{position}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
