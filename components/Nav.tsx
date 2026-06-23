'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenLine, Rocket, Users, SlidersHorizontal } from 'lucide-react';

function DoorsIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {/* Outer frame — rounded top, flat bottom */}
      <path d="M3 22 L3 5 Q3 2 6 2 L18 2 Q21 2 21 5 L21 22 Z" />
      {/* Center vertical seam */}
      <line x1="12" y1="2" x2="12" y2="22" />
      {/* Horizontal accent stripe across both panels */}
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  );
}

function MissionListIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4.5" cy="6"  r="1.2" fill={color} stroke="none" />
      <line x1="8" y1="6"  x2="20" y2="6" />
      <circle cx="4.5" cy="11" r="1.2" fill={color} stroke="none" />
      <line x1="8" y1="11" x2="20" y2="11" />
      <circle cx="4.5" cy="16" r="1.2" fill={color} stroke="none" />
      <line x1="8" y1="16" x2="20" y2="16" />
      <circle cx="4.5" cy="21" r="1.2" fill={color} stroke="none" />
      <line x1="8" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function PaddIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {/* Tablet body */}
      <rect x="3" y="1.5" width="18" height="21" rx="2.5" />
      {/* Screen bezel */}
      <rect x="5.5" y="4" width="13" height="14.5" rx="1" />
      {/* Text lines inside screen */}
      <line x1="7.5" y1="7.5"  x2="16.5" y2="7.5" />
      <line x1="7.5" y1="10.5" x2="16.5" y2="10.5" />
      <line x1="7.5" y1="13.5" x2="16.5" y2="13.5" />
      <line x1="7.5" y1="16"   x2="13"   y2="16" />
    </svg>
  );
}
import SojoShipIcon from '@/components/SojoShipIcon';

const links = [
  { href: '/',         label: 'Home',     icon: (c: string) => <DoorsIcon size={20} strokeWidth={1.5} color={c} /> },
  { href: '/compose',  label: 'Write',    icon: (c: string) => <PenLine size={20} strokeWidth={1.5} color={c} /> },
  { href: '/posts',    label: 'Posts',    icon: (c: string) => <PaddIcon size={20} strokeWidth={1.5} color={c} /> },
  { href: '/tour',     label: 'Tour',     icon: (c: string) => <SojoShipIcon size={20} strokeWidth={1.5} color={c} /> },
  { href: '/missions', label: 'Missions', icon: (c: string) => <MissionListIcon size={20} strokeWidth={1.5} color={c} /> },
  { href: '/crew',     label: 'Crew',     icon: (c: string) => <Users size={20} strokeWidth={1.5} color={c} /> },
  { href: '/settings', label: 'Settings', icon: (c: string) => <SlidersHorizontal size={20} strokeWidth={1.5} color={c} /> },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#000', borderTop: '2px solid #9999CC' }}>
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto flex gap-0.5 px-1 py-1.5">
        {links.map(({ href, label, icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          const color = active ? '#000' : '#9999CC';
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors"
              style={active ? { background: '#BBAADD', color: '#000' } : { color: '#9999CC' }}
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
