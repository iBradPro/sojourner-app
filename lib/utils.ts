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
