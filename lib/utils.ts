export interface CharacterProfileSection {
  heading: string;
  fields: { label: string; value: string }[];
}

export async function scrapeCharacterProfile(id: number): Promise<CharacterProfileSection[]> {
  try {
    const res = await fetch(`https://sojourner.simcentral.org/personnel/character/${id}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Tab structure: #one=Basic Info, #two=Personal Ties, #three=Personality, #four=Personal History, #five=Service Record
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

      // Extract all label/value rows from the zebra table
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

    return sections;
  } catch {
    return [];
  }
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

// Nova renders one stored newline as a visible paragraph break (no <p> tags
// stored). Match that: any run of newlines is a single paragraph boundary, so
// posts look identical in-app and on Nova.
export function formatPostContent(content: string): string {
  return content
    .split(/\n+/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return '';
      // Already an HTML block element — leave it as-is
      if (/^<(p|h[1-6]|ul|ol|li|div|blockquote|hr|table|pre|br)/i.test(trimmed)) return trimmed;
      // Inline HTML or mixed — wrap in <p>
      return `<p>${trimmed}</p>`;
    })
    .join('\n');
}
