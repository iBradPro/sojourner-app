'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PenLine, Rocket, Users, SlidersHorizontal } from 'lucide-react';

function PaddIcon({ color = 'currentColor', size = 20, strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="7.5" y1="8"  x2="16.5" y2="8" />
      <line x1="7.5" y1="11" x2="16.5" y2="11" />
      <line x1="7.5" y1="14" x2="16.5" y2="14" />
      <line x1="7.5" y1="17" x2="13"   y2="17" />
    </svg>
  );
}
import SojoShipIcon from '@/components/SojoShipIcon';

const links = [
  { href: '/',         label: 'Home',     icon: (c: string) => <Home size={20} strokeWidth={1.5} color={c} /> },
  { href: '/compose',  label: 'Write',    icon: (c: string) => <PenLine size={20} strokeWidth={1.5} color={c} /> },
  { href: '/posts',    label: 'Posts',    icon: (c: string) => <PaddIcon size={20} strokeWidth={1.5} color={c} /> },
  { href: '/tour',     label: 'Tour',     icon: (c: string) => <SojoShipIcon size={20} strokeWidth={1.5} color={c} /> },
  { href: '/missions', label: 'Missions', icon: (c: string) => <Rocket size={20} strokeWidth={1.5} color={c} /> },
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
