import Link from 'next/link';
import { TOUR_SECTIONS } from '@/lib/tour';

export default function TourPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-sky-400">Ship Tour</h1>
      {TOUR_SECTIONS.map(section => (
        <section key={section.title}>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{section.title}</h2>
          <div className="space-y-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2 md:space-y-0">
            {section.locations.map(loc => (
              <Link
                key={loc.id}
                href={`/tour/${loc.id}`}
                className="flex items-center justify-between bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-700 rounded-xl px-4 py-3 transition-colors"
              >
                <span className="text-slate-100 text-sm">{loc.name}</span>
                <span className="text-slate-600 text-xs">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
