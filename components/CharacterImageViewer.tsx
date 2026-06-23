'use client';
import { useState } from 'react';

export default function CharacterImageViewer({ src, alt, size = 'list' }: {
  src: string;
  alt: string;
  size?: 'list' | 'detail';
}) {
  const [open, setOpen] = useState(false);

  const dim = size === 'detail' ? 'w-16 h-16' : 'w-10 h-10';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${dim} rounded-full shrink-0 overflow-hidden`}
        style={{ border: '2px solid #BBAADD', padding: 0, background: 'none' }}>
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setOpen(false)}
        >
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full rounded-2xl"
            style={{ maxWidth: '92vw', maxHeight: '85vh', objectFit: 'contain', border: '2px solid #BBAADD' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
            style={{ background: '#1a1030', color: '#BBAADD', border: '1px solid #6666AA' }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
