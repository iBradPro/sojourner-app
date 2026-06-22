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
  // Start of the current single-finger gesture, for swipe/tap classification
  const gestureStart = useRef<{ x: number; y: number; t: number } | null>(null);
  // Pending tap-to-close, cancelled if a double-tap (zoom) follows
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openImage(i: number) {
    setOpen(i);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }

  function goTo(i: number) {
    if (i < 0 || i >= images.length) return;
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
      gestureStart.current = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // double tap — toggle zoom (cancel any pending tap-to-close)
        if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
        setScale(s => s > 1 ? 1 : 2.5);
        setOffset({ x: 0, y: 0 });
        lastTap.current = 0;
        gestureStart.current = null;
      } else {
        lastTap.current = now;
        lastSingle.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        gestureStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: now };
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
    } else if (e.touches.length === 1 && lastSingle.current !== null && scale > 1) {
      // pan only while zoomed; at scale 1 a single-finger drag is a swipe
      e.preventDefault();
      const dx = e.touches[0].clientX - lastSingle.current.x;
      const dy = e.touches[0].clientY - lastSingle.current.y;
      setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
      lastSingle.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    lastDist.current = null;
    lastMid.current = null;

    // Ignore gestures that ended on a control button (chevrons, dots, close)
    const onControl = (e.target as HTMLElement).closest('button');

    if (scale <= 1 && !onControl) {
      const start = gestureStart.current;
      const end = e.changedTouches[0];
      if (start && end) {
        const dx = end.clientX - start.x;
        const dy = end.clientY - start.y;
        const dt = Date.now() - start.t;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          // horizontal swipe → navigate
          goTo(open! + (dx < 0 ? 1 : -1));
        } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) {
          // tap → close, unless it turns into a double-tap within 300ms
          closeTimer.current = setTimeout(() => { close(); closeTimer.current = null; }, 300);
        }
      }
      setOffset({ x: 0, y: 0 });
      setScale(1);
    }
    lastSingle.current = null;
    gestureStart.current = null;
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
            <>
              <button
                onClick={() => goTo(open - 1)}
                disabled={open === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white text-3xl bg-black/50 rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-25"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={() => goTo(open + 1)}
                disabled={open === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white text-3xl bg-black/50 rounded-full w-11 h-11 flex items-center justify-center disabled:opacity-25"
                aria-label="Next image"
              >
                ›
              </button>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`w-2 h-2 rounded-full ${i === open ? 'bg-white' : 'bg-white/40'}`}
                  />
                ))}
              </div>
            </>
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
