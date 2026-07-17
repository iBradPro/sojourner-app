'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ============================================================
   Mode definitions — palette maps to the site's LCARS tokens
   ============================================================ */

type Row = { k: string; v: string; alert: boolean };

interface ModeDef {
  accent: string;
  label: string;
  sweepTitle: string;
  waveTitle: string;
  dataTitle: string;
  waveHz: number;
  waveJag: number;
  rows: [string, () => string][];
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const jitter = (base: number, spread: number) => base + (Math.random() * 2 - 1) * spread;

// pick(): last entry is the rare/alert value; p = chance of drawing it
function pick(list: string[], p: number) {
  if (Math.random() < p) return list[list.length - 1];
  return list[Math.floor(Math.random() * (list.length - 1))];
}

function hexNoise(n: number) {
  let s = '';
  for (let i = 0; i < n; i++)
    s += Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase() + ' ';
  return s;
}

const ALERT_RE = /BORG|TOXIC|APPROACH|ELEVATED|INTERFER|NETWORK|IONIZED|HOSTILE/;

const MODES = {
  bio: {
    accent: '#FF9900',
    label: 'BIO',
    sweepTitle: 'PROXIMITY SWEEP · LIFEFORM',
    waveTitle: 'BIOSPECTRAL WAVEFORM',
    dataTitle: 'BIOMETRIC TELEMETRY',
    waveHz: 1.15,
    waveJag: 0.18,
    rows: [
      ['LIFEFORM CLASS', () => pick(['HUMANOID', 'NON-HUMANOID', 'UNDETERMINED', 'BORG SIGNATURE?'], 0.02)],
      ['PULSE', () => `${jitter(71, 9).toFixed(0)} BPM`],
      ['RESPIRATION', () => `${jitter(14, 3).toFixed(0)} /MIN`],
      ['BODY TEMP', () => `${jitter(36.8, 0.4).toFixed(1)} °C`],
      ['NEURAL ACTIVITY', () => `${jitter(84, 10).toFixed(1)} %`],
      ['CELLULAR DECAY', () => `${jitter(0.02, 0.015).toFixed(3)} λ`],
      ['ISOBORAMINE', () => `${jitter(92, 6).toFixed(1)} %`],
      ['DERMAL CONDUCTANCE', () => `${jitter(4.7, 1.2).toFixed(2)} µS`],
    ],
  },
  geo: {
    accent: '#FF9966',
    label: 'GEO',
    sweepTitle: 'GEOSTRATA SWEEP',
    waveTitle: 'SEISMIC WAVEFORM',
    dataTitle: 'GEOLOGICAL TELEMETRY',
    waveHz: 0.35,
    waveJag: 0.55,
    rows: [
      ['CRUST DENSITY', () => `${jitter(5.51, 0.2).toFixed(2)} g/cm³`],
      ['TECTONIC STRESS', () => `${jitter(31, 14).toFixed(1)} MPa`],
      ['DILITHIUM TRACE', () => `${jitter(0.4, 0.38).toFixed(2)} ppm`],
      ['KELBONITE', () => pick(['NEGATIVE', 'NEGATIVE', 'TRACE', 'INTERFERENCE'], 0.1)],
      ['MAGNETIC FLUX', () => `${jitter(58, 20).toFixed(1)} µT`],
      ['SUBSURFACE VOIDS', () => pick(['NONE', '1 CAVITY', '2 CAVITIES', 'NETWORK'], 0.15)],
      ['CORE RESONANCE', () => `${jitter(7.83, 1.1).toFixed(2)} Hz`],
      ['EROSION INDEX', () => `${jitter(0.31, 0.1).toFixed(3)}`],
    ],
  },
  em: {
    accent: '#9999CC',
    label: 'EM FIELD',
    sweepTitle: 'EM FIELD SWEEP',
    waveTitle: 'SUBSPACE HARMONIC TRACE',
    dataTitle: 'EM / SUBSPACE TELEMETRY',
    waveHz: 3.4,
    waveJag: 0.32,
    rows: [
      ['FIELD STRENGTH', () => `${jitter(412, 60).toFixed(0)} mT`],
      ['POLARIZATION', () => `${jitter(47, 30).toFixed(1)}°`],
      ['SUBSPACE VARIANCE', () => `${jitter(0.047, 0.03).toFixed(3)} σ`],
      ['TACHYON COUNT', () => `${jitter(118, 45).toFixed(0)} /cm³`],
      ['WARP RESIDUE', () => pick(['NEGATIVE', 'TRACE', 'RECENT TRANSIT', 'IONIZED WAKE'], 0.12)],
      ['GRAVITON FLUX', () => `${jitter(2.4, 0.9).toFixed(2)} keV`],
      ['THETA RADIATION', () => pick(['0.00 rad', '0.01 rad', '0.03 rad', 'ELEVATED'], 0.06)],
      ['TRANSWARP RESONANCE', () => pick(['NOT DETECTED', 'NOT DETECTED', 'FAINT ECHO', 'ELEVATED'], 0.05)],
    ],
  },
  met: {
    accent: '#BBAADD',
    label: 'MET',
    sweepTitle: 'ATMOSPHERIC SWEEP',
    waveTitle: 'BAROMETRIC WAVEFORM',
    dataTitle: 'METEOROLOGICAL TELEMETRY',
    waveHz: 0.6,
    waveJag: 0.1,
    rows: [
      ['ATMOSPHERE', () => pick(['M-CLASS NOMINAL', 'M-CLASS NOMINAL', 'THIN — O₂ LOW', 'TOXIC TRACE'], 0.08)],
      ['PRESSURE', () => `${jitter(101.3, 2).toFixed(1)} kPa`],
      ['TEMPERATURE', () => `${jitter(21, 4).toFixed(1)} °C`],
      ['HUMIDITY', () => `${jitter(54, 12).toFixed(0)} %`],
      ['WIND VECTOR', () => `${jitter(14, 9).toFixed(0)} km/h ${pick(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], 1)}`],
      ['IONIZATION', () => `${jitter(0.8, 0.5).toFixed(2)} pC/m³`],
      ['PLASMA STORMS', () => pick(['NONE DETECTED', 'NONE DETECTED', 'DISTANT CELL', 'APPROACHING'], 0.1)],
      ['UV INDEX', () => `${Math.max(0, jitter(5, 3)).toFixed(1)}`],
    ],
  },
} satisfies Record<string, ModeDef>;

type ModeKey = keyof typeof MODES;
const MODE_KEYS = Object.keys(MODES) as ModeKey[];

const SALMON = '#CC6666';

const STATUS_LINES = [
  'SENSOR ARRAY NOMINAL',
  'LATERAL SENSORS ONLINE',
  'RECALIBRATING EMITTER COILS',
  'SUBSPACE LINK VIA PATHFINDER: NOMINAL',
  'COMPENSATING FOR WORMHOLE FLUX',
  'BUFFER 47 SYNCHRONIZED',
  'PASSIVE SCAN CONTINUING',
  'ISOLINEAR CACHE PURGED',
];

/* value-noise for smooth organic motion */
function makeNoise(seedCount = 8) {
  const ph = Array.from({ length: seedCount }, () => rand(0, 1000));
  const fr = Array.from({ length: seedCount }, (_, i) => 0.13 * (i + 1) * rand(0.8, 1.2));
  return (t: number) => {
    let v = 0,
      amp = 1,
      tot = 0;
    for (let i = 0; i < seedCount; i++) {
      v += Math.sin(t * fr[i] + ph[i]) * amp;
      tot += amp;
      amp *= 0.55;
    }
    return v / tot; // -1..1
  };
}

function fitCanvas(cv: HTMLCanvasElement) {
  const r = cv.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) {
    cv.width = w;
    cv.height = h;
  }
  return { ctx: cv.getContext('2d')!, w, h };
}

interface Blip {
  ang: number;
  dist: number;
  born: number;
  life: number;
  major: boolean;
}

interface AudioRig {
  beep: (freq?: number, dur?: number, vol?: number) => void;
  close: () => void;
}

function startAudio(): AudioRig {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.05;
  master.connect(ctx.destination);

  // continuous soft warble: two detuned triangles through a slow LFO
  const mk = (f: number) => {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.4;
    o.connect(g).connect(master);
    o.start();
    return g;
  };
  const a = mk(620);
  const b = mk(624);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 0.35;
  lfo.connect(lfoG);
  lfoG.connect(a.gain);
  lfoG.connect(b.gain);
  lfo.start();

  return {
    beep(freq = 1245, dur = 0.07, vol = 0.5) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g).connect(master);
      o.start();
      o.stop(ctx.currentTime + dur + 0.02);
    },
    close() {
      ctx.close();
    },
  };
}

/* ============================================================
   Component
   ============================================================ */

/* Press-and-hold the LCARS header to exit back to the site — mirrors the
   hero-banner gesture that opens this display. */
const EXIT_HOLD_MS = 650;
const EXIT_MOVE_TOLERANCE = 12;

export default function SensorsPage() {
  const router = useRouter();
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitStart = useRef<{ x: number; y: number } | null>(null);

  function exitBegin(e: React.PointerEvent) {
    exitStart.current = { x: e.clientX, y: e.clientY };
    exitTimer.current = setTimeout(() => {
      exitTimer.current = null;
      router.push('/');
    }, EXIT_HOLD_MS);
  }

  function exitCancel() {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
    exitStart.current = null;
  }

  function exitMove(e: React.PointerEvent) {
    if (!exitStart.current) return;
    if (Math.hypot(e.clientX - exitStart.current.x, e.clientY - exitStart.current.y) > EXIT_MOVE_TOLERANCE) {
      exitCancel();
    }
  }

  const [modeKey, setModeKey] = useState<ModeKey>('bio');
  const [rows, setRows] = useState<Row[]>([]);
  const [scan, setScan] = useState(1);
  const [stardate, setStardate] = useState('77812.4');
  const [status, setStatus] = useState(STATUS_LINES[0]);
  const [ticker, setTicker] = useState('');
  const [audioOn, setAudioOn] = useState(false);

  const sweepRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const waveValRef = useRef<HTMLSpanElement>(null);
  const lockElRef = useRef<HTMLDivElement>(null);

  const modeRef = useRef<{ key: ModeKey; changedAt: number }>({ key: 'bio', changedAt: 0 });
  const blipsRef = useRef<Blip[]>([]);
  const scanRef = useRef(1);
  const audioRef = useRef<AudioRig | null>(null);
  const noiseRef = useRef<{ wave: (t: number) => number; spec: ((t: number) => number)[] } | null>(null);

  function refreshReadout(reset: boolean) {
    scanRef.current = reset ? 1 : scanRef.current + 1;
    setScan(scanRef.current);
    const def = MODES[modeRef.current.key];
    setRows(
      def.rows.map(([k, fn]) => {
        const v = fn();
        return { k, v, alert: ALERT_RE.test(v) };
      })
    );
    if (audioRef.current && Math.random() < 0.35) audioRef.current.beep(rand(900, 1400), 0.05, 0.25);
  }

  function selectMode(key: ModeKey) {
    modeRef.current = { key, changedAt: performance.now() / 1000 };
    blipsRef.current = [];
    setModeKey(key);
    refreshReadout(true);
    const au = audioRef.current;
    if (au) {
      au.beep(740, 0.06);
      setTimeout(() => audioRef.current?.beep(1180, 0.08), 90);
    }
  }

  function toggleAudio() {
    if (audioRef.current) {
      audioRef.current.close();
      audioRef.current = null;
      setAudioOn(false);
    } else {
      audioRef.current = startAudio();
      audioRef.current.beep(988, 0.09);
      setAudioOn(true);
    }
  }

  useEffect(() => {
    noiseRef.current = {
      wave: makeNoise(6),
      spec: Array.from({ length: 22 }, () => makeNoise(4)),
    };

    refreshReadout(true);
    setTicker(hexNoise(48));

    const readoutIv = setInterval(() => refreshReadout(false), 1400);
    const tickerIv = setInterval(() => setTicker(hexNoise(48)), 14000);
    const statusIv = setInterval(
      () => setStatus(STATUS_LINES[Math.floor(Math.random() * STATUS_LINES.length)]),
      5200
    );
    const t0 = Date.now();
    const sdIv = setInterval(() => {
      setStardate((77812.4 + ((Date.now() - t0) / 86400000) * 2.7).toFixed(1));
    }, 500);

    let raf = 0;
    let lastBlip = 0;

    function drawSweep(t: number) {
      const cv = sweepRef.current;
      if (!cv) return;
      const { ctx, w, h } = fitCanvas(cv);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2,
        cy = h / 2;
      const R = Math.min(w, h) * 0.44;
      const ac = MODES[modeRef.current.key].accent;

      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, (R * i) / 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = ac;
      ctx.font = `${Math.max(8, R * 0.07)}px var(--font-geist-sans), sans-serif`;
      ctx.textAlign = 'left';
      for (let i = 1; i <= 4; i++) ctx.fillText(i * 25 + 'm', 3, (-R * i) / 4 + 11);

      const sweepAng = (t * 0.9) % (Math.PI * 2);
      if (typeof ctx.createConicGradient === 'function') {
        const grad = ctx.createConicGradient(sweepAng, 0, 0);
        grad.addColorStop(0, ac + 'cc');
        grad.addColorStop(0.12, ac + '22');
        grad.addColorStop(0.25, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = ac;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(sweepAng) * R, Math.sin(sweepAng) * R);
        ctx.stroke();
      }

      let anyMajorLit = false;
      blipsRef.current = blipsRef.current.filter((b) => t - b.born < b.life);
      for (const b of blipsRef.current) {
        const age = (t - b.born) / b.life;
        const d = Math.abs((((sweepAng - b.ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const lit = Math.max(0, 1 - d / 1.1);
        const alpha = Math.max(0, 1 - age) * (0.25 + 0.75 * lit);
        const x = Math.cos(b.ang) * b.dist * R;
        const y = Math.sin(b.ang) * b.dist * R;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = b.major ? SALMON : ac;
        ctx.beginPath();
        ctx.arc(x, y, (b.major ? 5 : 3) * (1 + lit * 0.6), 0, Math.PI * 2);
        ctx.fill();
        if (b.major) {
          if (lit > 0.4) anyMajorLit = true;
          ctx.strokeStyle = SALMON;
          ctx.lineWidth = 1;
          ctx.globalAlpha = alpha * 0.7;
          ctx.beginPath();
          ctx.arc(x, y, 9 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (lockElRef.current) lockElRef.current.style.visibility = anyMajorLit ? 'visible' : 'hidden';

      ctx.globalAlpha = 1;
      ctx.fillStyle = ac;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawWave(t: number) {
      const cv = waveRef.current;
      const noise = noiseRef.current;
      if (!cv || !noise) return;
      const { ctx, w, h } = fitCanvas(cv);
      ctx.clearRect(0, 0, w, h);
      const m = modeRef.current;
      const def = MODES[m.key];
      const ac = def.accent;
      const mid = h / 2;

      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.1;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += w / 16) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += h / 6) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const settle = Math.min(1, (t - m.changedAt) / 1.2);
      ctx.globalAlpha = 1;
      ctx.lineWidth = Math.max(1.5, h * 0.012);
      ctx.strokeStyle = ac;
      ctx.shadowColor = ac;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      let peak = 0;
      const N = Math.min(320, w);
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const tt = t * def.waveHz * 2 + (i / N) * 7;
        let v =
          Math.sin(tt * 2.1) * 0.45 +
          Math.sin(tt * 4.7 + 1.3) * 0.2 +
          noise.wave(tt) * def.waveJag * 1.6;
        if (m.key === 'bio') {
          const beat = (t * 1.25 + (i / N) * 2) % 1;
          if (beat < 0.08) v += Math.sin((beat / 0.08) * Math.PI) * 1.4;
        }
        v *= settle;
        peak = Math.max(peak, Math.abs(v));
        const y = mid - v * h * 0.3;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (waveValRef.current)
        waveValRef.current.textContent = (peak * jitter(1, 0.02) * 100).toFixed(1) + ' mV';
    }

    function drawSpec(t: number) {
      const cv = specRef.current;
      const noise = noiseRef.current;
      if (!cv || !noise) return;
      const { ctx, w, h } = fitCanvas(cv);
      ctx.clearRect(0, 0, w, h);
      const key = modeRef.current.key;
      const ac = MODES[key].accent;
      const n = noise.spec.length;
      const gap = Math.max(2, w * 0.012);
      const bw = (w - gap * (n + 1)) / n;
      const pad = h * 0.08;

      for (let i = 0; i < n; i++) {
        const base = 0.25 + 0.5 * Math.exp(-Math.pow((i - n * 0.4) / (n * 0.3), 2));
        let v = base + noise.spec[i](t * (key === 'em' ? 2.2 : 1)) * 0.35;
        v = Math.max(0.04, Math.min(1, v));
        const bh = v * (h - pad * 2);
        const x = gap + i * (bw + gap);
        const y = h - pad - bh;

        const g = ctx.createLinearGradient(0, y, 0, h - pad);
        g.addColorStop(0, ac);
        g.addColorStop(1, ac + '33');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, bw, bh);

        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(x, y - 2, bw, 2);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(0, h - pad + 3);
      ctx.lineTo(w, h - pad + 3);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function frame(nowMs: number) {
      const t = nowMs / 1000;
      if (t - lastBlip > rand(0.4, 1.4)) {
        blipsRef.current.push({
          ang: rand(0, Math.PI * 2),
          dist: rand(0.18, 0.92),
          born: t,
          life: rand(4, 9),
          major: Math.random() < 0.18,
        });
        lastBlip = t;
      }
      drawSweep(t);
      drawWave(t);
      drawSpec(t);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(readoutIv);
      clearInterval(tickerIv);
      clearInterval(statusIv);
      clearInterval(sdIv);
      audioRef.current?.close();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const def = MODES[modeKey];
  const accent = def.accent;

  const panelHead = (title: string, right?: React.ReactNode) => (
    <div
      className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-[0.22em]"
      style={{ color: accent, borderBottom: '1px solid #1c1c26', background: `${accent}0d` }}
    >
      <span>{title}</span>
      {right ?? (
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ background: accent, animation: 'sensor-blink 1.2s infinite' }}
        />
      )}
    </div>
  );

  const panelStyle: React.CSSProperties = {
    background: '#050508',
    border: '1px solid #23232e',
    borderRadius: '0.375rem',
    overflow: 'hidden',
  };

  return (
    <div className="px-4 py-4 space-y-3">
      <style>{`@keyframes sensor-blink { 0%,100% { opacity: 1; } 50% { opacity: .35; } }`}</style>

      {/* LCARS header — press and hold to exit */}
      <div
        className="flex items-stretch gap-1.5 select-none"
        style={{ WebkitTouchCallout: 'none' }}
        onPointerDown={exitBegin}
        onPointerUp={exitCancel}
        onPointerLeave={exitCancel}
        onPointerCancel={exitCancel}
        onPointerMove={exitMove}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="w-9 flex-none" style={{ background: accent, borderRadius: '18px 0 0 18px' }} />
        <div className="flex-1 py-1.5 px-3" style={{ borderTop: `4px solid ${accent}`, background: '#000' }}>
          <h1 className="text-base font-bold tracking-[0.14em]" style={{ color: '#FFCC99' }}>
            MAIN SENSOR ARRAY
          </h1>
          <p className="text-[10px] tracking-[0.28em]" style={{ color: '#BBAADD' }}>
            USS SOJOURNER · NCC-85748 · DELTA QUADRANT
          </p>
        </div>
        <div className="w-9 flex-none" style={{ background: '#9999CC', borderRadius: '0 18px 18px 0' }} />
      </div>

      {/* mode pills */}
      <div className="grid grid-cols-4 gap-1.5">
        {MODE_KEYS.map((key) => {
          const m = MODES[key];
          const active = key === modeKey;
          return (
            <button
              key={key}
              onClick={() => selectMode(key)}
              className="py-2 rounded-full text-[11px] font-bold tracking-wide transition-all"
              style={{
                background: m.accent,
                color: '#000',
                opacity: active ? 1 : 0.55,
                boxShadow: active ? `0 0 14px 2px ${m.accent}88` : 'none',
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="md:grid md:grid-cols-2 md:gap-3 space-y-3 md:space-y-0">
        {/* proximity sweep */}
        <div style={panelStyle} className="relative md:row-span-2 flex flex-col">
          {panelHead(def.sweepTitle)}
          <canvas ref={sweepRef} className="w-full aspect-square md:aspect-auto md:flex-1 max-h-[340px] md:max-h-none block" />
          <div
            ref={lockElRef}
            className="absolute left-0 right-0 bottom-2 text-center text-[10px] tracking-[0.35em] pointer-events-none"
            style={{ color: SALMON, visibility: 'hidden', animation: 'sensor-blink .5s infinite' }}
          >
            ▲ CONTACT ISOLATED ▲
          </div>
        </div>

        {/* waveform */}
        <div style={panelStyle}>
          {panelHead(def.waveTitle, <span ref={waveValRef} className="tracking-[0.08em]" />)}
          <canvas ref={waveRef} className="w-full h-36 block" />
        </div>

        {/* spectral bars */}
        <div style={panelStyle}>
          {panelHead('SPECTRAL DECOMPOSITION')}
          <canvas ref={specRef} className="w-full h-28 block" />
        </div>

        {/* telemetry */}
        <div style={panelStyle} className="md:col-span-2">
          {panelHead(def.dataTitle, <span>SCAN {String(scan).padStart(4, '0')}</span>)}
          <div className="px-2.5 py-1.5 text-[12px] leading-[1.55] tracking-[0.06em]">
            {rows.map((r) => (
              <div key={r.k} className="flex justify-between whitespace-nowrap">
                <span style={{ color: '#9999CC' }}>{r.k}</span>
                <span
                  className="tabular-nums"
                  style={
                    r.alert
                      ? { color: SALMON, animation: 'sensor-blink .8s infinite' }
                      : { color: '#FFCC99' }
                  }
                >
                  {r.v}
                </span>
              </div>
            ))}
          </div>
          <div
            className="h-5 overflow-hidden flex items-center whitespace-nowrap text-[10px] tracking-[0.12em]"
            style={{ borderTop: '1px solid #1c1c26', color: '#6a6a8a' }}
          >
            <span className="px-2">{ticker}</span>
          </div>
        </div>
      </div>

      {/* footer bars */}
      <div className="flex items-stretch gap-1.5 text-[11px] font-bold tracking-[0.12em]">
        <div className="w-9 flex-none" style={{ background: '#9999CC', borderRadius: '18px 0 0 18px' }} />
        <div className="px-3 flex items-center rounded" style={{ background: '#FFCC99', color: '#000' }}>
          STARDATE {stardate}
        </div>
        <div
          className="flex-1 px-3 flex items-center overflow-hidden"
          style={{ color: '#BBAADD', borderBottom: '4px solid #9999CC' }}
        >
          <span className="truncate font-normal">{status}</span>
        </div>
        <button
          onClick={toggleAudio}
          className="px-3 rounded"
          style={{ background: audioOn ? '#FF9900' : '#9999CC', color: '#000' }}
        >
          AUDIO {audioOn ? 'ON' : 'OFF'}
        </button>
        <div className="w-6 flex-none" style={{ background: accent, borderRadius: '0 18px 18px 0' }} />
      </div>
    </div>
  );
}
