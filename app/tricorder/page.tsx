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

/* Draws a smooth closed silhouette through a point loop (Chaikin-style corner
   cutting via quadratic curves through segment midpoints) — used for the BIO
   body outline so it reads as hollow line art rather than straight stick limbs. */
function smoothClosedPath(ctx: CanvasRenderingContext2D, pts: [number, number][]) {
  const n = pts.length;
  if (n < 3) return;
  const midStart: [number, number] = [(pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(midStart[0], midStart[1]);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const mid: [number, number] = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
    ctx.quadraticCurveTo(cur[0], cur[1], mid[0], mid[1]);
  }
  ctx.closePath();
}

/* One side of a hollow humanoid outline (neck → shoulder → arm → torso → leg → foot),
   as [x-offset-fraction-of-w, y-fraction-of-h] pairs. Mirrored across the shared
   crotch point below, this closes into a full front-facing body silhouette. */
const BODY_HALF: [number, number][] = [
  [0.045, 0.165], // neck
  [0.185, 0.205], // shoulder
  [0.215, 0.27], // arm outer, upper
  [0.2, 0.35], // arm outer, elbow
  [0.175, 0.42], // arm outer, lower
  [0.16, 0.47], // hand, outer
  [0.115, 0.468], // hand, inner
  [0.135, 0.35], // arm inner, elbow
  [0.1, 0.275], // armpit (pinch)
  [0.125, 0.33], // ribcage
  [0.095, 0.42], // waist
  [0.145, 0.5], // hip
  [0.125, 0.58], // leg outer, upper
  [0.105, 0.7], // knee, outer
  [0.095, 0.83], // shin, outer
  [0.09, 0.93], // ankle, outer
  [0.115, 0.955], // foot tip, outer
  [0.04, 0.955], // foot tip, inner
  [0.035, 0.9], // ankle, inner
  [0.03, 0.78], // shin, inner
  [0.025, 0.66], // knee, inner
  [0.02, 0.56], // leg inner, upper
];
const BODY_CROTCH: [number, number] = [0, 0.535];

function bodyOutlinePoints(cx: number, w: number, h: number): [number, number][] {
  const right = BODY_HALF.map(([fx, fy]): [number, number] => [cx + fx * w, fy * h]);
  const left = [...BODY_HALF].reverse().map(([fx, fy]): [number, number] => [cx - fx * w, fy * h]);
  return [...right, [cx + BODY_CROTCH[0] * w, BODY_CROTCH[1] * h], ...left];
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
  const [emrg, setEmrg] = useState(false);

  const sweepRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const waveValRef = useRef<HTMLSpanElement>(null);
  const lockElRef = useRef<HTMLDivElement>(null);
  const lockTextRef = useRef<HTMLSpanElement>(null);

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

    /* BIO — humanoid silhouette, vertical scan line, vitals pulse, anomaly markers on the body */
    function drawBio(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ac: string) {
      const cx = w / 2;

      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.08;
      ctx.lineWidth = 1;
      for (let y = h * 0.06; y < h; y += h * 0.12) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const headR = w * 0.082;
      const headY = h * 0.105;
      const footY = h * 0.955;

      const bodyPts = bodyOutlinePoints(cx, w, h);
      smoothClosedPath(ctx, bodyPts);
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = ac;
      ctx.fill();
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = ac;
      ctx.stroke();

      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(cx, headY, headR, 0, Math.PI * 2);
      ctx.stroke();

      const cyc = (t * 0.35) % 2;
      const scanY = (cyc < 1 ? cyc : 2 - cyc) * h;
      const band = ctx.createLinearGradient(0, scanY - h * 0.08, 0, scanY + h * 0.08);
      band.addColorStop(0, 'rgba(0,0,0,0)');
      band.addColorStop(0.5, ac + '55');
      band.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = band;
      ctx.fillRect(0, scanY - h * 0.08, w, h * 0.16);
      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = ac;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      const beat = (t * 1.25) % 1;
      const pulse = beat < 0.12 ? Math.sin((beat / 0.12) * Math.PI) : 0;
      ctx.globalAlpha = 0.5 + pulse * 0.5;
      ctx.fillStyle = SALMON;
      ctx.beginPath();
      ctx.arc(cx, h * 0.3, w * 0.02 + pulse * w * 0.015, 0, Math.PI * 2);
      ctx.fill();

      let anyMajorLit = false;
      for (const b of blipsRef.current) {
        const age = (t - b.born) / b.life;
        const alpha = Math.max(0, 1 - age);
        const bx = cx + Math.cos(b.ang) * w * 0.22;
        const by = headY + b.dist * (footY - headY);
        ctx.globalAlpha = alpha * (b.major ? 0.9 : 0.5);
        ctx.fillStyle = b.major ? SALMON : ac;
        ctx.beginPath();
        ctx.arc(bx, by, b.major ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (b.major) {
          ctx.strokeStyle = SALMON;
          ctx.lineWidth = 1;
          ctx.globalAlpha = alpha * 0.6;
          ctx.beginPath();
          ctx.arc(bx, by, 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
          ctx.stroke();
          if (age < 0.7) anyMajorLit = true;
        }
      }
      ctx.globalAlpha = 1;
      return anyMajorLit;
    }

    /* GEO — layered strata cross-section with a depth-sounding scan line and deposit markers */
    function drawGeo(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ac: string) {
      const layers = 6;
      const layerH = h / layers;
      for (let i = 0; i < layers; i++) {
        const yTop = i * layerH;
        ctx.beginPath();
        ctx.moveTo(0, yTop);
        const segs = 10;
        for (let s = 0; s <= segs; s++) {
          const x = (s / segs) * w;
          const wob = Math.sin(x * 0.02 + i * 1.7) * layerH * 0.18 + Math.sin(x * 0.05 + i) * layerH * 0.08;
          ctx.lineTo(x, yTop + wob);
        }
        ctx.lineTo(w, yTop + layerH * 1.3);
        ctx.lineTo(0, yTop + layerH * 1.3);
        ctx.closePath();
        ctx.globalAlpha = 0.08 + i * 0.05;
        ctx.fillStyle = ac;
        ctx.fill();
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = ac;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const cyc = (t * 0.3) % 2;
      const scanX = (cyc < 1 ? cyc : 2 - cyc) * w;
      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = ac;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(scanX, 0);
      ctx.lineTo(scanX, h);
      ctx.stroke();
      ctx.shadowBlur = 0;

      let anyMajorLit = false;
      for (const b of blipsRef.current) {
        const age = (t - b.born) / b.life;
        const alpha = Math.max(0, 1 - age);
        const bx = (((b.ang / (Math.PI * 2)) % 1) + 1) % 1 * w;
        const by = b.dist * h;
        const lit = Math.abs(bx - scanX) < w * 0.05;
        ctx.globalAlpha = alpha * (b.major ? 0.95 : 0.55);
        ctx.fillStyle = b.major ? SALMON : ac;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.PI / 4);
        const s = b.major ? 5 : 3;
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();
        if (b.major && lit) {
          ctx.strokeStyle = SALMON;
          ctx.globalAlpha = alpha * 0.7;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(bx, by, 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
          ctx.stroke();
          if (age < 0.7) anyMajorLit = true;
        }
      }
      ctx.globalAlpha = 1;
      return anyMajorLit;
    }

    /* EM — radiating energy spikes from a central node, with discharge flares */
    function drawEmField(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ac: string) {
      const cx = w / 2,
        cy = h / 2;
      const R = Math.min(w, h) * 0.46;
      ctx.save();
      ctx.translate(cx, cy);

      ctx.strokeStyle = ac;
      ctx.globalAlpha = 0.15;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, (R * i) / 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      const spikes = 20;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = ac;
      const flickerIdx = Math.floor(t * 7) % spikes;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const n = Math.sin(a * 5 + t * 3.4) * 0.5 + Math.sin(a * 11 - t * 5.1) * 0.3;
        let len = R * (0.3 + 0.35 * Math.abs(n));
        if (i === flickerIdx) len = R * 0.95;
        ctx.globalAlpha = 0.35 + 0.5 * (len / R);
        ctx.shadowBlur = 4 + (len / R) * 6;
        ctx.strokeStyle = i === flickerIdx ? SALMON : ac;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      ctx.globalAlpha = 1;
      ctx.fillStyle = ac;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      let anyMajorLit = false;
      for (const b of blipsRef.current) {
        const age = (t - b.born) / b.life;
        const flash = Math.max(0, 1 - age * 3);
        const alpha = Math.max(0.15, flash);
        const bx = cx + Math.cos(b.ang) * b.dist * R;
        const by = cy + Math.sin(b.ang) * b.dist * R;
        ctx.globalAlpha = alpha * (b.major ? 1 : 0.6);
        ctx.fillStyle = b.major ? SALMON : '#ffffff';
        ctx.beginPath();
        ctx.arc(bx, by, (b.major ? 4 : 2) * (1 + flash), 0, Math.PI * 2);
        ctx.fill();
        if (b.major && flash > 0.3) anyMajorLit = true;
      }
      ctx.globalAlpha = 1;
      return anyMajorLit;
    }

    /* MET — rotating weather-radar sweep with amorphous, intensity-graded storm cells */
    function drawMet(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, ac: string) {
      const cx = w / 2,
        cy = h / 2;
      const R = Math.min(w, h) * 0.44;
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

      const sweepAng = (t * 0.7) % (Math.PI * 2);
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
      }

      let anyMajorLit = false;
      for (const b of blipsRef.current) {
        const age = (t - b.born) / b.life;
        const alpha = Math.max(0, 1 - age);
        const x = Math.cos(b.ang) * b.dist * R;
        const y = Math.sin(b.ang) * b.dist * R;
        const cellR = b.major ? 16 : 9;
        const stops: [number, string][] = b.major
          ? [
              [0, SALMON],
              [0.55, '#e0a33f'],
              [1, 'rgba(0,0,0,0)'],
            ]
          : [
              [0, ac],
              [0.6, ac + '66'],
              [1, 'rgba(0,0,0,0)'],
            ];
        for (let k = 0; k < 3; k++) {
          const jx = Math.sin(t * 1.3 + k * 2 + b.born) * cellR * 0.25;
          const jy = Math.cos(t * 1.1 + k * 3 + b.born) * cellR * 0.25;
          const grad2 = ctx.createRadialGradient(x + jx, y + jy, 0, x + jx, y + jy, cellR);
          stops.forEach(([off, c]) => grad2.addColorStop(off, c));
          ctx.globalAlpha = alpha * 0.5;
          ctx.fillStyle = grad2;
          ctx.beginPath();
          ctx.arc(x + jx, y + jy, cellR, 0, Math.PI * 2);
          ctx.fill();
        }
        if (b.major) {
          const d = Math.abs((((sweepAng - b.ang) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
          if (d < 0.5 && age < 0.8) anyMajorLit = true;
        }
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = ac;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return anyMajorLit;
    }

    const LOCK_LABEL: Record<ModeKey, string> = {
      bio: 'CONTACT ISOLATED',
      geo: 'ANOMALY LOCKED',
      em: 'SOURCE LOCKED',
      met: 'CELL TRACKED',
    };

    function drawPrimary(t: number) {
      const cv = sweepRef.current;
      if (!cv) return;
      const { ctx, w, h } = fitCanvas(cv);
      ctx.clearRect(0, 0, w, h);
      const key = modeRef.current.key;
      const ac = MODES[key].accent;
      blipsRef.current = blipsRef.current.filter((b) => t - b.born < b.life);

      const anyMajorLit =
        key === 'bio'
          ? drawBio(ctx, w, h, t, ac)
          : key === 'geo'
          ? drawGeo(ctx, w, h, t, ac)
          : key === 'em'
          ? drawEmField(ctx, w, h, t, ac)
          : drawMet(ctx, w, h, t, ac);

      if (lockElRef.current) lockElRef.current.style.visibility = anyMajorLit ? 'visible' : 'hidden';
      if (lockTextRef.current) lockTextRef.current.textContent = `▲ ${LOCK_LABEL[key]} ▲`;
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
        let v: number;

        if (m.key === 'bio') {
          // ECG complex: P bump, sharp QRS spike, T bump, otherwise flat
          const phase = (t * 1.25 + (i / N) * 1) % 1;
          const gauss = (c: number, wgt: number, amp: number) => Math.exp(-(((phase - c) / wgt) ** 2)) * amp;
          v =
            gauss(0.08, 0.03, 0.16) +
            gauss(0.155, 0.01, -0.22) +
            gauss(0.18, 0.014, 1.7) +
            gauss(0.205, 0.012, -0.32) +
            gauss(0.42, 0.08, 0.26) +
            noise.wave(tt) * 0.02;
        } else if (m.key === 'geo') {
          // seismograph: near-flat trace, punctuated by tremor bursts
          const burstCyc = (t * 0.1 + i / N / 6) % 1;
          const burstEnv = burstCyc > 0.55 && burstCyc < 0.8 ? Math.sin(((burstCyc - 0.55) / 0.25) * Math.PI) : 0;
          v = noise.wave(tt * 1.1) * 0.05 + burstEnv * (Math.sin(tt * 26) * 0.5 + noise.wave(tt * 6) * 0.7);
        } else if (m.key === 'em') {
          // impulse/discharge spikes over a quiet noise floor
          const trigger = Math.sin(tt * 1.8 + Math.sin(tt * 0.6) * 2.2);
          v = noise.wave(tt * 2.2) * 0.08;
          if (Math.abs(trigger) > 0.965) v += Math.sign(trigger) * ((Math.abs(trigger) - 0.965) / 0.035) * 1.7;
        } else {
          // barometric: smooth, slow, rolling — no spikes at all
          v = Math.sin(tt * 0.55) * 0.4 + Math.sin(tt * 0.21 + 1) * 0.16 + noise.wave(tt * 0.4) * 0.06;
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
        let v: number;

        if (key === 'geo') {
          // layered strata terraces: stable, blocky, barely animated
          const terrace = 0.32 + 0.42 * ((Math.floor(i / 3) % 3) / 2);
          v = terrace + noise.spec[i](t * 0.4) * 0.06;
        } else if (key === 'em') {
          // erratic energy bands: noisy, high-contrast, occasional forced spike
          v = 0.5 + noise.spec[i](t * 2.6) * 0.55 + noise.spec[(i + 7) % n](t * 4.3) * 0.3;
          if ((Math.floor(t * 4) + i) % 7 === 0) v = Math.max(v, 0.92);
        } else if (key === 'met') {
          // soft atmospheric bands: smooth, low-contrast, slow-moving
          const dome = 0.3 + 0.4 * Math.exp(-Math.pow((i - n * 0.5) / (n * 0.4), 2));
          v = dome + noise.spec[i](t * 0.35) * 0.14;
        } else {
          // bio: biometric band envelope
          const dome = 0.25 + 0.5 * Math.exp(-Math.pow((i - n * 0.4) / (n * 0.3), 2));
          v = dome + noise.spec[i](t) * 0.3;
        }
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
      drawPrimary(t);
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

  function keyBeep() {
    audioRef.current?.beep(rand(750, 1250), 0.05, 0.3);
  }

  function fireEmrg() {
    setEmrg(true);
    const au = audioRef.current;
    if (au) {
      au.beep(520, 0.18, 0.6);
      setTimeout(() => audioRef.current?.beep(520, 0.18, 0.6), 260);
      setTimeout(() => audioRef.current?.beep(680, 0.3, 0.6), 540);
    }
    setTimeout(() => setEmrg(false), 2800);
  }

  const chassisText = '#23262e';
  const cream = { background: 'linear-gradient(#f6efdb, #e2d9bf)' };

  const bracketLabel = (label: string) => (
    <div className="flex items-center gap-2 mb-1.5">
      <div className="flex-1 h-[2px] rounded" style={{ background: '#3a3e48' }} />
      <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: chassisText }}>{label}</span>
      <div className="flex-1 h-[2px] rounded" style={{ background: '#3a3e48' }} />
    </div>
  );

  return (
    <div className="px-2 py-3 flex justify-center">
      <style>{`
        @keyframes sensor-blink { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
        @keyframes tr-blink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }
        .tr-key {
          background: linear-gradient(#f6efdb, #e2d9bf);
          border: 1px solid #5c5648;
          border-radius: 5px;
          box-shadow: 0 2px 0 #6e6858, 0 3px 4px rgba(0,0,0,.35);
          color: #17150f;
          font-weight: 700;
        }
        .tr-key:active {
          transform: translateY(2px);
          box-shadow: 0 0 0 #6e6858, inset 0 1px 3px rgba(0,0,0,.35);
        }
      `}</style>

      <div
        className="w-full max-w-[460px] select-none"
        style={{
          background: 'linear-gradient(160deg, #b6bbc6 0%, #a3a8b4 55%, #8f94a1 100%)',
          borderRadius: 26,
          border: '2px solid #5f6470',
          boxShadow:
            'inset 0 2px 3px rgba(255,255,255,.55), inset 0 -6px 12px rgba(0,0,0,.25), 0 12px 30px rgba(0,0,0,.7)',
        }}
      >
        {/* ===== top shell ===== */}

        {/* top cap — press & hold to close the tricorder */}
        <div
          className="px-4 pt-4 pb-3"
          style={{ WebkitTouchCallout: 'none' }}
          onPointerDown={exitBegin}
          onPointerUp={exitCancel}
          onPointerLeave={exitCancel}
          onPointerCancel={exitCancel}
          onPointerMove={exitMove}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-3.5 w-11 rounded-sm"
              style={{
                background: '#d9569b',
                boxShadow: '0 0 8px #d9569b77, inset 0 1px 1px rgba(255,255,255,.5)',
                animation: emrg ? 'tr-blink .35s infinite' : undefined,
              }}
            />
            <div className="flex gap-[3px] p-[3px] rounded-sm" style={{ background: '#20241e' }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-3.5 w-3.5"
                  style={{
                    background: '#9fd65c',
                    opacity: i === MODE_KEYS.indexOf(modeKey) % 3 ? 0.35 : 1,
                    boxShadow: '0 0 6px #9fd65c55',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* control key row */}
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <button className="tr-key px-2 py-1 text-[10px] tracking-wider" onClick={toggleAudio}>PWR</button>
            <div
              className="h-2 w-7 rounded-sm"
              style={{
                background: audioOn ? '#d9569b' : '#463844',
                boxShadow: audioOn ? '0 0 8px #d9569baa' : 'inset 0 1px 2px rgba(0,0,0,.6)',
              }}
            />
          </div>
          <span className="text-[12px] font-black" style={{ color: chassisText }}>
            Σ<span className="text-[8px] align-sub">x</span> SYS
          </span>
          <button className="tr-key px-2 py-0.5 text-[9px] leading-[1.2]" onClick={keyBeep}>
            F1<br />F2
          </button>
          <span className="text-[8px] font-bold tracking-[0.15em] leading-[1.3]" style={{ color: chassisText }}>
            -DATA<br />SENSE-
          </span>
          <div className="flex-1" />
          <button className="tr-key px-3 py-1.5 text-[11px]" onClick={keyBeep}>I</button>
          <button className="tr-key px-3 py-1.5 text-[11px]" onClick={keyBeep}>E</button>
        </div>

        {/* library column + display */}
        <div className="px-4 pb-3 flex gap-3">
          <div className="flex-none w-12 flex flex-col py-1">
            {(['bio', 'geo', 'em', 'met'] as ModeKey[]).map((mode, i) => (
              <button key={mode} onClick={() => selectMode(mode)} className="flex items-center gap-1 py-1 text-left">
                <span
                  className="h-2 w-2 rounded-full flex-none"
                  style={
                    modeKey === mode
                      ? { background: '#9fd65c', boxShadow: '0 0 7px #9fd65c' }
                      : { background: '#565b52', boxShadow: 'inset 0 1px 1px rgba(0,0,0,.5)' }
                  }
                />
                <span className="text-[8px] font-bold tracking-[0.08em]" style={{ color: chassisText }}>
                  {['ALPHA', 'BETA', 'GAMMA', 'DELTA'][i][0]}
                </span>
              </button>
            ))}
            <span className="text-[7px] font-bold tracking-[0.08em] mt-1" style={{ color: chassisText }}>
              LIB
            </span>
            <div
              className="mt-1.5 h-10 w-7 rounded-sm relative"
              style={{ background: '#15161a', boxShadow: 'inset 0 2px 5px rgba(0,0,0,.8)' }}
            >
              <span className="absolute left-0.5 bottom-0.5 text-[6px] font-bold" style={{ color: '#cfd3da' }}>A</span>
              <span className="absolute right-0.5 top-0.5 text-[6px] font-bold" style={{ color: '#cfd3da' }}>B</span>
              <div className="absolute left-1/2 -translate-x-1/2 top-1.5 bottom-1.5 w-[2px] rounded" style={{ background: '#cfd3da' }} />
            </div>
          </div>

          {/* screen bezel — kept roughly square, like the physical prop's single combined readout */}
          <div className="flex-1 rounded-lg p-1.5 min-w-0" style={{ background: '#40444e', boxShadow: 'inset 0 2px 6px rgba(0,0,0,.7)' }}>
            <div
              className="rounded-md overflow-hidden flex flex-col"
              style={{
                background: '#000',
                border: emrg ? `2px solid ${SALMON}` : '2px solid #1b1d24',
              }}
            >
              <div
                className="flex items-center justify-between px-2 py-1 text-[8px] font-bold tracking-[0.15em]"
                style={{ color: accent, borderBottom: '1px solid #1c1c26' }}
              >
                <span className="truncate">{def.sweepTitle}</span>
                <span className="flex-none">{String(scan).padStart(4, '0')}</span>
              </div>

              <div className="flex gap-1.5 p-1.5">
                <div className="relative flex-none w-[44%]">
                  <canvas ref={sweepRef} className="w-full aspect-square block" />
                  <div
                    ref={lockElRef}
                    className="absolute left-0 right-0 bottom-0.5 text-center text-[7px] tracking-[0.15em] pointer-events-none"
                    style={{ color: SALMON, visibility: 'hidden', animation: 'sensor-blink .5s infinite' }}
                  >
                    <span ref={lockTextRef}>▲ LOCK ▲</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div>
                    <div className="flex items-center justify-between text-[7px] font-bold tracking-[0.1em]" style={{ color: accent }}>
                      <span className="truncate">{def.waveTitle}</span>
                      <span ref={waveValRef} className="flex-none" />
                    </div>
                    <canvas ref={waveRef} className="w-full h-11 block" />
                  </div>
                  <canvas ref={specRef} className="w-full flex-1 block" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 px-2 pb-1.5 text-[8px] leading-[1.45] tracking-[0.02em]" style={{ borderTop: '1px solid #1c1c26' }}>
                {rows.map((r) => (
                  <div key={r.k} className="flex justify-between gap-1 whitespace-nowrap overflow-hidden">
                    <span className="truncate" style={{ color: '#9999CC' }}>{r.k}</span>
                    <span
                      className="tabular-nums flex-none"
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
                className="px-2 h-3.5 flex items-center overflow-hidden whitespace-nowrap text-[7px] tracking-[0.08em]"
                style={{ borderTop: '1px solid #1c1c26', color: '#494960' }}
              >
                <span>{ticker}</span>
              </div>

              <div
                className="px-2 py-1 flex justify-between gap-2 text-[7px] tracking-[0.06em] overflow-hidden whitespace-nowrap"
                style={{ borderTop: '1px solid #1c1c26', color: emrg ? SALMON : '#6a6a8a' }}
              >
                <span className="flex-none">SD {stardate}</span>
                <span className="truncate">{emrg ? '⚠ EMERGENCY BEACON ACTIVE' : status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* device input */}
        <div className="px-4 pb-4">
          {bracketLabel('DEVICE INPUT')}
          <div className="flex items-center gap-2">
            {(['geo', 'met', 'bio', 'em'] as ModeKey[]).map((key) => {
              const active = key === modeKey;
              return (
                <button
                  key={key}
                  onClick={() => selectMode(key)}
                  className="tr-key flex-1 py-1.5 text-[10px] tracking-wider"
                  style={{
                    background: `linear-gradient(#f3c96a 0%, #dfa93e 38%, #f6efdb 38%, #e2d9bf 100%)`,
                    boxShadow: active
                      ? `0 2px 0 #6e6858, 0 0 10px 2px ${MODES[key].accent}99`
                      : undefined,
                  }}
                >
                  <span className="block pt-1">{{ geo: 'GEO', met: 'MET', bio: 'BIO', em: 'EM' }[key]}</span>
                </button>
              );
            })}
            <div className="flex flex-col gap-[2px] p-[2px] rounded-sm" style={{ background: '#20241e' }}>
              <div className="h-2.5 w-2.5" style={{ background: '#9fd65c', boxShadow: '0 0 5px #9fd65c66' }} />
              <div className="h-2.5 w-2.5" style={{ background: '#3d4438' }} />
            </div>
          </div>
        </div>

        {/* ===== hinge ===== */}
        <div
          className="h-7 flex justify-around items-center"
          style={{
            background: 'linear-gradient(#7c8090, #6a6e7c)',
            borderTop: '2px solid #565a66',
            borderBottom: '2px solid #565a66',
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-5 w-20 rounded-sm"
              style={{
                background: 'linear-gradient(#9da2ae, #7c8090 45%, #565a66)',
                border: '1px solid #4a4e5a',
                boxShadow: '0 1px 2px rgba(0,0,0,.5)',
              }}
            />
          ))}
        </div>

        {/* ===== bottom shell ===== */}
        <div className="px-4 pt-3 pb-4">
          {bracketLabel('COM TRANSMISSION')}
          <div className="flex gap-2.5 items-stretch">
            <div className="flex-1 flex flex-col gap-2">
              <button className="tr-key py-1.5 text-[10px] leading-[1.3] tracking-wider" onClick={keyBeep}>
                ACPT<br />POOL
              </button>
              <button className="tr-key py-1.5 text-[10px] leading-[1.3] tracking-wider" onClick={keyBeep}>
                INTRSHP<br />TRICRDR
              </button>
            </div>
            <div
              className="flex flex-col justify-center text-[11px] font-black leading-[1.1] text-center"
              style={{ color: chassisText }}
            >
              E<br />M<br />R<br />G
            </div>
            <button
              onClick={fireEmrg}
              className="w-24 rounded-md p-2"
              style={{
                background: 'linear-gradient(145deg, #2b2d33, #17181c)',
                border: '1px solid #0d0e11',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,.15), 0 2px 4px rgba(0,0,0,.4)',
              }}
            >
              <div
                className="h-full min-h-14 rounded"
                style={{
                  background: 'radial-gradient(circle at 42% 35%, #a33a4a, #5e1620 75%)',
                  boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.6), inset 0 2px 3px rgba(255,255,255,.2)',
                  animation: emrg ? 'tr-blink .35s infinite' : undefined,
                }}
              />
            </button>
          </div>

          <div className="flex gap-3 mt-3">
            <div className="flex-1">
              {bracketLabel('IMAGE RECORD')}
              <div className="flex gap-2">
                <button className="tr-key flex-1 py-1.5 text-[9px] leading-[1.3] tracking-wider" onClick={keyBeep}>
                  FWD<br />INPUT
                </button>
                <button className="tr-key flex-1 py-1.5 text-[9px] leading-[1.3] tracking-wider" onClick={keyBeep}>
                  RVS<br />ERASE
                </button>
              </div>
            </div>
            <div className="w-24">
              {bracketLabel('LIBRARY B')}
              <div className="flex gap-2">
                <button className="tr-key flex-1 py-1.5 text-[11px]" onClick={keyBeep}>I</button>
                <button className="tr-key flex-1 py-1.5 text-[11px]" onClick={keyBeep}>E</button>
              </div>
            </div>
          </div>

          {/* ID plate */}
          <div className="mt-4 flex items-center gap-2.5">
            <button className="rounded-sm p-1.5 flex-none" style={{ background: '#17181c' }} onClick={keyBeep}>
              <span className="block h-3 w-3" style={{ background: '#d9569b', boxShadow: '0 0 6px #d9569b99' }} />
            </button>
            <span className="text-[9px] font-bold" style={{ color: chassisText }}>ID</span>
            <div
              className="flex-1 rounded-sm px-2 py-1 text-center"
              style={{ ...cream, border: '1px solid #5c5648' }}
            >
              <p className="text-[10px] font-black tracking-[0.1em]" style={{ color: '#17150f' }}>
                TR-580 TRICORDER VII
              </p>
              <p className="text-[8px] font-bold tracking-[0.14em]" style={{ color: '#17150f' }}>
                STARFLEET R&D — SAN FRANCISCO
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
