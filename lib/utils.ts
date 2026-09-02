export interface CharacterProfileSection {
  heading: string;
  fields: { label: string; value: string }[];
}

export interface CharacterProfile {
  sections: CharacterProfileSection[];
  imageUrl: string | null;
  position: string | null;
}

const DEPARTMENT_ORDER = [
  'Command', 'Flight Control', 'Operations', 'Engineering',
  'Medical', 'Counseling', 'Science', 'Tactical & Security',
  'Intelligence', 'Civilian', 'Other',
];

export function getDepartment(position: string | null): string {
  if (!position) return 'Other';
  const p = position.toLowerCase();
  if (/captain|commanding officer|executive officer|first officer|\bxo\b|second officer/.test(p)) return 'Command';
  if (/flight|helm|pilot|navigation|conn/.test(p)) return 'Flight Control';
  if (/operation|ops officer|logistics/.test(p)) return 'Operations';
  if (/engineer|propulsion|warp core|chief engineer/.test(p)) return 'Engineering';
  if (/medical|doctor|physician|nurse|surgeon|medic/.test(p)) return 'Medical';
  if (/counsel|diplomat|ambassador|liaison/.test(p)) return 'Counseling';
  if (/science|scientist|researcher|xenobiolog|astrobiolog/.test(p)) return 'Science';
  if (/tactical|security|guard|investigat|chief of security/.test(p)) return 'Tactical & Security';
  if (/intel|intelligence/.test(p)) return 'Intelligence';
  if (/civilian|merchant|journalist|civilian/.test(p)) return 'Civilian';
  return 'Other';
}

export { DEPARTMENT_ORDER };

export async function scrapeCharacterProfile(id: number): Promise<CharacterProfile> {
  try {
    const res = await fetch(`https://sojourner.simcentral.org/personnel/character/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { sections: [], imageUrl: null, position: null };
    const html = await res.text();

    // Extract first/hero character image
    const imgMatch = html.match(/application\/assets\/images\/characters\/[^"']+/);
    const imageUrl = imgMatch ? `https://sojourner.simcentral.org/${imgMatch[0]}` : null;

    // Extract position from header area (before the tabs)
    const posMatch = html.match(/<kbd>Position<\/kbd>\s*([\s\S]*?)\s*<\/p>/);
    const position = posMatch ? posMatch[1].replace(/<[^>]+>/g, '').trim() : null;

    const TAB_LABELS: [string, string][] = [
      ['one',   'Basic Info'],
      ['two',   'Personal Ties'],
      ['three', 'Personality'],
      ['four',  'Personal History'],
      ['five',  'Service Record'],
    ];

    const sections: CharacterProfileSection[] = [];

    for (const [tabId, tabLabel] of TAB_LABELS) {
      const start = html.indexOf(`<div id="${tabId}">`);
      if (start < 0) continue;
      const nextTabPattern = /\n\s*<div id="(?:one|two|three|four|five|med_records)">/g;
      nextTabPattern.lastIndex = start + 10;
      const next = nextTabPattern.exec(html);
      const chunk = html.slice(start, next ? next.index : start + 20000);

      const rowPattern = /<td class="cell-label[^"]*">([\s\S]*?)<\/td>\s*<td class="cell-spacer"[^>]*><\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/g;
      let m;
      const fields: { label: string; value: string }[] = [];
      while ((m = rowPattern.exec(chunk)) !== null) {
        const label = m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
        const rawVal = m[2]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ')
          .replace(/\r\n/g, '\n')
          .trim();
        if (label && rawVal) fields.push({ label, value: rawVal });
      }
      if (fields.length > 0) sections.push({ heading: tabLabel, fields });
    }

    return { sections, imageUrl, position };
  } catch {
    return { sections: [], imageUrl: null, position: null };
  }
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

// How Nova actually stores and renders a post body, verified 2026-09-02 against
// the notification email Nova sends out (it runs the stored text through nl2br
// and nothing more):
//
//   one newline  ->  a line break, lines sit tight together
//   a blank line ->  a paragraph break, with visible space
//
// The old code split on /\n+/, which collapsed both cases into "paragraph", so
// every soft line break opened a gap the email did not have. That is the bug
// that kept coming back. Do not reintroduce it.
//
// Returns paragraphs ready for dangerouslySetInnerHTML: inline markup
// (<i>/<b>/<u>) is preserved, and soft breaks become <br />.
export function splitParagraphs(content: string | null | undefined): string[] {
  if (!content) return [];
  return content
    .replace(/\r\n?/g, '\n')             // CRLF and lone CR -> LF
    .split(/\n[ \t]*(?:\n[ \t]*)+/)      // one or more blank lines
    .map((para) => para.trim().replace(/\n/g, '<br />'))
    .filter(Boolean);
}
