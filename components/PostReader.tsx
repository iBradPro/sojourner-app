'use client';
import { useState } from 'react';
import { splitParagraphs } from '@/lib/utils';

const SIZES = ['text-sm', 'text-[15px]', 'text-base', 'text-lg', 'text-xl'] as const;

function renderContent(content: string) {
  // Paragraph rules live in splitParagraphs so the reader and anything else
  // that renders a post body cannot drift apart again.
  return splitParagraphs(content).map((para, i) => (
    <p
      key={i}
      style={{ marginBottom: '1em', color: '#e8e0d0' }}
      dangerouslySetInnerHTML={{ __html: para }}
    />
  ));
}

export default function PostReader({ content }: { content: string }) {
  const [sizeIndex, setSizeIndex] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const saved = localStorage.getItem('textSize');
    return saved !== null ? Number(saved) : 1;
  });

  function setSize(i: number) {
    setSizeIndex(i);
    localStorage.setItem('textSize', String(i));
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-4">
        <span className="text-xs mr-2" style={{ color: '#9999CC' }}>Text size</span>
        <button
          onClick={() => setSize(Math.max(0, sizeIndex - 1))}
          disabled={sizeIndex === 0}
          className="w-8 h-8 rounded-full text-sm font-bold disabled:opacity-30 transition-colors"
          style={{ background: '#0d0d0d', border: '1px solid #BBAADD', color: '#BBAADD' }}
          aria-label="Decrease text size"
        >
          A−
        </button>
        <button
          onClick={() => setSize(Math.min(SIZES.length - 1, sizeIndex + 1))}
          disabled={sizeIndex === SIZES.length - 1}
          className="w-8 h-8 rounded-full font-bold disabled:opacity-30 transition-colors"
          style={{ background: '#0d0d0d', border: '1px solid #BBAADD', color: '#BBAADD', fontSize: '1.1rem' }}
          aria-label="Increase text size"
        >
          A+
        </button>
      </div>
      <div className={`${SIZES[sizeIndex]} leading-relaxed`}>
        {renderContent(content)}
      </div>
    </div>
  );
}
