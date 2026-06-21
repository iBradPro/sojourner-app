'use client';
import { useState } from 'react';
import { formatPostContent } from '@/lib/utils';

const SIZES = ['text-sm', 'text-[15px]', 'text-base', 'text-lg', 'text-xl'] as const;
const LABELS = ['A', 'A', 'A', 'A', 'A'];

export default function PostReader({ content }: { content: string }) {
  const [sizeIndex, setSizeIndex] = useState(1);

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-4">
        <span className="text-xs text-slate-500 mr-2">Text size</span>
        <button
          onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
          disabled={sizeIndex === 0}
          className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium disabled:opacity-30 hover:bg-slate-700 transition-colors"
          aria-label="Decrease text size"
        >
          A−
        </button>
        <button
          onClick={() => setSizeIndex((i) => Math.min(SIZES.length - 1, i + 1))}
          disabled={sizeIndex === SIZES.length - 1}
          className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-medium disabled:opacity-30 hover:bg-slate-700 transition-colors"
          aria-label="Increase text size"
          style={{ fontSize: '1.1rem' }}
        >
          A+
        </button>
      </div>
      <div
        className={`post-content ${SIZES[sizeIndex]} text-slate-200 leading-relaxed`}
        dangerouslySetInnerHTML={{ __html: formatPostContent(content) }}
      />
    </div>
  );
}
