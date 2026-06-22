'use client';
import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

// --- Serialization: editor DOM -> "plain text + inline tags, single \n per line" ---
// Nova stores one newline per paragraph break and renders it as visible spacing.
// We must emit ONLY <i>/<b>/<u>, never <p>/<br>, and never doubled newlines.

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as HTMLElement;
  const tag = el.tagName;
  if (tag === 'BR') return '';
  let inner = '';
  el.childNodes.forEach(c => { inner += serializeNode(c); });
  if (tag === 'I' || tag === 'EM') return `<i>${inner}</i>`;
  if (tag === 'B' || tag === 'STRONG') return `<b>${inner}</b>`;
  if (tag === 'U') return `<u>${inner}</u>`;
  // unknown element (span, nested div, etc.) — keep its text, drop the wrapper
  return inner;
}

function serializeInline(el: HTMLElement): string {
  let s = '';
  el.childNodes.forEach(c => { s += serializeNode(c); });
  return s;
}

function serialize(root: HTMLElement): string {
  const lines: string[] = [];
  let bare = '';
  let hasBare = false;
  root.childNodes.forEach(node => {
    const isBlock = node.nodeType === Node.ELEMENT_NODE && /^(DIV|P)$/.test((node as Element).tagName);
    if (isBlock) {
      if (hasBare) { lines.push(bare); bare = ''; hasBare = false; }
      lines.push(serializeInline(node as HTMLElement));
    } else {
      bare += serializeNode(node);
      hasBare = true;
    }
  });
  if (hasBare) lines.push(bare);
  // drop trailing empty lines so we never save a dangling \n
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  return lines.join('\n');
}

function deserialize(content: string): string {
  if (!content) return '';
  return content
    .split('\n')
    .map(line => (line === '' ? '<div><br></div>' : `<div>${line}</div>`))
    .join('');
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Set initial content once on mount (form remounts per draft via key).
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = deserialize(value);
    try { document.execCommand('styleWithCSS', false, 'false'); } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    if (ref.current) onChange(serialize(ref.current));
  }

  function format(cmd: 'bold' | 'italic' | 'underline') {
    try { document.execCommand('styleWithCSS', false, 'false'); } catch {}
    document.execCommand(cmd);
    ref.current?.focus();
    emit();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.metaKey || e.ctrlKey) {
      const k = e.key.toLowerCase();
      if (k === 'b') { e.preventDefault(); format('bold'); }
      else if (k === 'i') { e.preventDefault(); format('italic'); }
      else if (k === 'u') { e.preventDefault(); format('underline'); }
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }

  const btn = 'w-9 h-8 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors text-sm flex items-center justify-center';

  return (
    <div>
      <style>{`.rte:empty:before{content:attr(data-placeholder);color:rgb(71 85 105);pointer-events:none;}`}</style>
      <div className="flex gap-1 mb-2">
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => format('bold')} className={`${btn} font-bold`} title="Bold (⌘B)">B</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => format('italic')} className={`${btn} italic`} title="Italic (⌘I)">I</button>
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => format('underline')} className={`${btn} underline`} title="Underline (⌘U)">U</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className="rte w-full min-h-[16rem] bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-600 leading-relaxed overflow-y-auto"
      />
    </div>
  );
}
