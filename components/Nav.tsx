'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/posts', label: 'Posts', icon: '📝' },
  { href: '/compose', label: 'Write', icon: '✏️' },
  { href: '/tour', label: 'Tour', icon: '🚢' },
  { href: '/missions', label: 'Missions', icon: '🚀' },
  { href: '/crew', label: 'Crew', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" style={{ background: '#000', borderTop: '2px solid #9999CC' }}>
      <div className="max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto flex gap-0.5 px-1 py-1.5">
        {links.map(({ href, label, icon }) => {
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
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
