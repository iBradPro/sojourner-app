import Link from 'next/link';
import { TOUR_SECTIONS } from '@/lib/tour';

export default function TourPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: '#BBAADD' }}>Ship Tour</h1>
      {TOUR_SECTIONS.map(section => (
        <section key={section.title}>
          <h2 className="lcars-label mb-3">{section.title}</h2>
          <div className="space-y-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2 md:space-y-0">
            {section.locations.map(loc => (
              <Link
                key={loc.id}
                href={`/tour/${loc.id}`}
                className="lcars-card flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm" style={{ color: '#FFCC99' }}>{loc.name}</span>
                <span className="text-xs font-bold" style={{ color: '#BBAADD' }}>→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
