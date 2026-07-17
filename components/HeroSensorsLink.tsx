'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

/* Press-and-hold the hero banner to open the Main Sensor Array display.
   A quick tap does nothing, and drifting more than a few pixels (i.e.
   scrolling) cancels the hold. */

const HOLD_MS = 650;
const MOVE_TOLERANCE = 12;

export default function HeroSensorsLink() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  function begin(e: React.PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      timer.current = null;
      router.push('/tricorder');
    }, HOLD_MS);
  }

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }

  function move(e: React.PointerEvent) {
    if (!start.current) return;
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > MOVE_TOLERANCE) {
      cancel();
    }
  }

  return (
    <div
      className="relative w-full select-none"
      style={{ WebkitTouchCallout: 'none' }}
      onPointerDown={begin}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onPointerMove={move}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Image
        src="/sojourner-hero.jpg"
        alt="USS Sojourner NCC-85748"
        width={1400}
        height={307}
        className="w-full h-auto pointer-events-none"
        draggable={false}
        priority
      />
    </div>
  );
}
