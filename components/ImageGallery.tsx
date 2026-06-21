'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
  name: string;
}

export default function ImageGallery({ images, name }: Props) {
  const [open, setOpen] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const lastDist = useRef<number | null>(null);
  const lastMid = useRef<{ x: number; y: number } | null>(null);
  const lastSingle = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef<number>(0);

  function openImage(i: number) {
    setOpen(i);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function close() {
    setOpen(null);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      lastDist.current = Math.hypot(dx, dy);
      lastMid.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      lastSingle.current = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // double tap — toggle zoom
        setScale(s => s > 1 ? 1 : 2.5);
        setOffset({ x: 0, y: 0 });
        lastTap.current = 0;
      } else {
        lastTap.current = now;
        lastSingle.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      lastDist.current = null;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && lastDist.current !== null && lastMid.current !== null) {
      e.preventDefault();
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / lastDist.current;
      setScale(s => Math.min(Math.max(s * ratio, 1), 5));
      lastDist.current = dist;
    } else if (e.touches.length === 1 && lastSingle.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - lastSingle.current.x;
      const dy = e.touches[0].clientY - lastSingle.current.y;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      lastSingle.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchEnd() {
    lastDist.current = null;
    lastMid.current = null;
    if (scale <= 1) {
      setOffset({ x: 0, y: 0 });
      setScale(1);
    }
  }

  // Reset pan when scale returns to 1
  useEffect(() => {
    if (scale <= 1) setOffset({ x: 0, y: 0 });
  }, [scale]);

  if (images.length === 0) return null;

  return (
    <>
      <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => openImage(i)}
            className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-800 border border-slate-700 hover:border-sky-600 transition-colors"
          >
            <Image src={src} alt={`${name} ${i + 1}`} fill className="object-cover" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 text-white text-2xl bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => openImage(i)}
                  className={`w-2 h-2 rounded-full ${i === open ? 'bg-white' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: 'none',
              touchAction: 'none',
              width: '100%',
              height: '100%',
              position: 'relative',
            }}
          >
            <Image
              src={images[open]}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
