'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/posts', label: 'Posts', icon: '📝' },
  { href: '/compose', label: 'Write', icon: '✏️' },
  { href: '/missions', label: 'Missions', icon: '🚀' },
  { href: '/crew', label: 'Crew', icon: '👥' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50">
      <div className="max-w-2xl mx-auto flex">
        {links.map(({ href, label, icon }) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                active ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-xl leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
