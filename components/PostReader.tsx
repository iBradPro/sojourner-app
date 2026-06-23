'use client';
import { useState } from 'react';
import { formatPostContent } from '@/lib/utils';

const SIZES = ['text-sm', 'text-[15px]', 'text-base', 'text-lg', 'text-xl'] as const;

export default function PostReader({ content }: { content: string }) {
  const [sizeIndex, setSizeIndex] = useState(1);

  return (
    <div>
      <div className="flex items-center justify-end gap-1 mb-4">
        <span className="text-xs mr-2" style={{ color: '#9999CC' }}>Text size</span>
        <button
          onClick={() => setSizeIndex((i) => Math.max(0, i - 1))}
          disabled={sizeIndex === 0}
          className="w-8 h-8 rounded-full text-sm font-bold disabled:opacity-30 transition-colors"
          style={{ background: '#0d0d0d', border: '1px solid #FF9900', color: '#FF9900' }}
          aria-label="Decrease text size"
        >
          A−
        </button>
        <button
          onClick={() => setSizeIndex((i) => Math.min(SIZES.length - 1, i + 1))}
          disabled={sizeIndex === SIZES.length - 1}
          className="w-8 h-8 rounded-full font-bold disabled:opacity-30 transition-colors"
          style={{ background: '#0d0d0d', border: '1px solid #FF9900', color: '#FF9900', fontSize: '1.1rem' }}
          aria-label="Increase text size"
        >
          A+
        </button>
      </div>
      <div
        className={`post-content ${SIZES[sizeIndex]} leading-relaxed`}
        style={{ color: '#e8e0d0' }}
        dangerouslySetInnerHTML={{ __html: formatPostContent(content) }}
      />
    </div>
  );
}
