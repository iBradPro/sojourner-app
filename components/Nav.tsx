'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScrollText, PenLine, Rocket, Users, SlidersHorizontal } from 'lucide-react';
import SojoShipIcon from '@/components/SojoShipIcon';

const links = [
  { href: '/',         label: 'Home',     icon: (c: string) => <Home size={20} strokeWidth={1.5} color={c} /> },
  { href: '/posts',    label: 'Posts',    icon: (c: string) => <ScrollText size={20} strokeWidth={1.5} color={c} /> },
  { href: '/compose',  label: 'Write',    icon: (c: string) => <PenLine size={20} strokeWidth={1.5} color={c} /> },
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
