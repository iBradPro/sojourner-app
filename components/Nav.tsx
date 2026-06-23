'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, Users } from 'lucide-react';
import SojoShipIcon from '@/components/SojoShipIcon';

function DoorsIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="-1 -1 26 26" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="1.5" width="21" height="21" rx="2" />
      <path d="M4 22 L4 6 Q4 3.5 6.5 3.5 L17.5 3.5 Q20 3.5 20 6 L20 22 Z" />
      <line x1="12" y1="3.5" x2="12" y2="22" />
    </svg>
  );
}

function PaddIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="1.5" width="18" height="21" rx="2.5" />
      <rect x="5.5" y="4" width="13" height="14.5" rx="1" />
      <line x1="7.5" y1="7.5"  x2="16.5" y2="7.5" />
      <line x1="7.5" y1="10.5" x2="16.5" y2="10.5" />
      <line x1="7.5" y1="13.5" x2="16.5" y2="13.5" />
      <line x1="7.5" y1="16"   x2="13"   y2="16" />
    </svg>
  );
}

function WarpCoreIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="-1 -1 26 26" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {/* Upper column */}
      <line x1="10.5" y1="2"   x2="10.5" y2="8" />
      <line x1="13.5" y1="2"   x2="13.5" y2="8" />
      {/* Top cap */}
      <line x1="9" y1="2" x2="15" y2="2" />
      {/* Middle housing — wider, rounded */}
      <path d="M7 8 Q6 8 6 9 L6 15 Q6 16 7 16 L17 16 Q18 16 18 15 L18 9 Q18 8 17 8 Z" />
      {/* Bulb — circle in the middle of the housing */}
      <circle cx="12" cy="12" r="2.5" />
      {/* Bulb inner glow dot */}
      <circle cx="12" cy="12" r="0.8" fill={color} stroke="none" />
      {/* Lower column */}
      <line x1="10.5" y1="16" x2="10.5" y2="22" />
      <line x1="13.5" y1="16" x2="13.5" y2="22" />
      {/* Bottom cap */}
      <line x1="9" y1="22" x2="15" y2="22" />
    </svg>
  );
}

const links = [
  { href: '/',        label: 'Home',     icon: (c: string) => <DoorsIcon      size={18} strokeWidth={1.5} color={c} /> },
  { href: '/compose', label: 'Write',    icon: (c: string) => <PenLine        size={18} strokeWidth={1.5} color={c} /> },
  { href: '/posts',   label: 'Posts',    icon: (c: string) => <PaddIcon       size={18} strokeWidth={1.5} color={c} /> },
  { href: '/tour',    label: 'Tour',     icon: (c: string) => <SojoShipIcon   size={18} strokeWidth={1.5} color={c} /> },
  { href: '/crew',    label: 'Crew',     icon: (c: string) => <Users          size={18} strokeWidth={1.5} color={c} /> },
  { href: '/settings',label: 'Settings', icon: (c: string) => <WarpCoreIcon  size={18} strokeWidth={1.5} color={c} /> },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#000', borderTop: '2px solid #9999CC' }}>
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto flex items-center gap-0.5 px-1 py-1.5">
        {links.map(({ href, label, icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          const color = active ? '#000' : '#9999CC';
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors"
              style={active ? { background: '#FF9900', color: '#000' } : { color: '#9999CC' }}
            >
              {icon(color)}
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
