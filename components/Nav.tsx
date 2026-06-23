'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScrollText, PenLine, Ship, Rocket, Users, SlidersHorizontal, type LucideIcon } from 'lucide-react';

const links: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: '/',          label: 'Home',     Icon: Home },
  { href: '/posts',     label: 'Posts',    Icon: ScrollText },
  { href: '/compose',   label: 'Write',    Icon: PenLine },
  { href: '/tour',      label: 'Tour',     Icon: Ship },
  { href: '/missions',  label: 'Missions', Icon: Rocket },
  { href: '/crew',      label: 'Crew',     Icon: Users },
  { href: '/settings',  label: 'Settings', Icon: SlidersHorizontal },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#000', borderTop: '2px solid #9999CC' }}>
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto flex gap-0.5 px-1 py-1.5">
        {links.map(({ href, label, Icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors"
              style={active
                ? { background: '#BBAADD', color: '#000' }
                : { background: 'transparent', color: '#9999CC' }
              }
            >
              <Icon size={20} strokeWidth={1.5} color="currentColor" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
