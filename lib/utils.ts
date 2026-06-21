export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

// Nova posts use \n\n for paragraph breaks but no <p> tags.
// This wraps plain-text paragraphs in <p> while leaving existing HTML blocks alone.
export function formatPostContent(content: string): string {
  return content
    .split(/\n\n+/)
    .map((chunk) => {
      const trimmed = chunk.trim();
      if (!trimmed) return '';
      // Already an HTML block element — leave it as-is
      if (/^<(p|h[1-6]|ul|ol|li|div|blockquote|hr|table|pre|br)/i.test(trimmed)) return trimmed;
      // Inline HTML or mixed — wrap in <p>, convert remaining single \n to <br>
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}
