import { getTourDetail, TOUR_SECTIONS } from '@/lib/tour';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);

  const section = TOUR_SECTIONS.find(s => s.locations.some(l => l.id === numId));
  const loc = section?.locations.find(l => l.id === numId);
  if (!loc) notFound();

  const detail = await getTourDetail(numId);

  return (
    <div className="pb-6">
      {detail.image && (
        <div className="relative w-full h-56">
          <Image
            src={detail.image}
            alt={loc.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
        </div>
      )}
      <div className="px-4 py-5 space-y-4">
        <div>
          <Link href="/tour" className="text-xs text-sky-500 hover:text-sky-400">← Ship Tour</Link>
          <h1 className="text-xl font-bold text-sky-400 mt-1">{loc.name}</h1>
          {section && (
            <p className="text-slate-500 text-xs mt-0.5">{section.title}</p>
          )}
        </div>
      </div>
    </div>
  );
}
