const BASE = 'https://sojourner.simcentral.org';

export interface TourLocation {
  id: number;
  name: string;
}

export interface TourSection {
  title: string;
  locations: TourLocation[];
}

export interface TourDetail {
  name: string;
  description: string;
  location: string;
  image: string | null;
}

// Hardcoded from the tour index page — avoids a slow scrape on every render
export const TOUR_SECTIONS: TourSection[] = [
  {
    title: 'USS Sojourner — Deck 1',
    locations: [
      { id: 1, name: 'Main Bridge' },
      { id: 3, name: "Captain's Ready Room" },
      { id: 4, name: 'Briefing Room' },
      { id: 53, name: 'Observation Lounge' },
      { id: 63, name: 'Nacelle Control Room (Port)' },
      { id: 64, name: 'Nacelle Control Room (Starboard)' },
    ],
  },
  {
    title: 'Deck 2',
    locations: [
      { id: 2, name: 'Sickbay' },
      { id: 5, name: 'Bio Lab' },
      { id: 6, name: 'Transporter Room One' },
      { id: 10, name: "Captain's Quarters" },
      { id: 23, name: "Executive Officers' Quarters" },
      { id: 28, name: 'Archive Library & Yeoman Pool' },
      { id: 54, name: 'Sickbay Medical Lab' },
      { id: 61, name: "Chief Medical Officer's/Chief Counselor's Quarters" },
    ],
  },
  {
    title: 'Deck 3',
    locations: [
      { id: 16, name: "Officers' Quarters" },
      { id: 33, name: 'VIP Quarters' },
      { id: 36, name: 'Computer Core - Upper Level' },
      { id: 69, name: 'Crew Lounge' },
    ],
  },
  {
    title: 'Deck 4',
    locations: [
      { id: 7, name: 'Mess Hall' },
      { id: 12, name: 'Cargo Bay Two' },
      { id: 13, name: 'Stellar Cartography Lab' },
      { id: 15, name: 'Waverider Shuttle Docking Bay' },
      { id: 24, name: 'Archaeology and History Lab' },
      { id: 29, name: 'Arboretum' },
      { id: 37, name: 'Computer Core - Lower' },
      { id: 39, name: 'Main Shuttlebay Deck' },
      { id: 52, name: 'Civilian Quarters' },
      { id: 60, name: 'Recreation Hall' },
      { id: 70, name: "Junior Officers' Quarters (2)" },
    ],
  },
  {
    title: 'Deck 5',
    locations: [
      { id: 14, name: 'Main Shuttlebay Hangar' },
      { id: 17, name: "Junior Officers' Quarters (2)" },
      { id: 18, name: 'Main Brig' },
      { id: 25, name: 'Planetary Sciences Lab' },
      { id: 30, name: 'Holodeck' },
      { id: 31, name: "Enlisted Officers' Dormitories (Ops, Medical, Security)" },
      { id: 32, name: 'Gymnasium' },
      { id: 40, name: 'Senior NCO Quarters' },
      { id: 56, name: 'Life Deck' },
      { id: 62, name: "Chief Counselor's Office" },
      { id: 67, name: 'Security Dojo and Lockers' },
      { id: 68, name: 'Armory' },
    ],
  },
  {
    title: 'Deck 6',
    locations: [
      { id: 9, name: 'Transporter Room Two' },
      { id: 19, name: 'Main Engineering - Upper Level' },
      { id: 34, name: 'Material Synthesis and Cybernetics Lab' },
      { id: 57, name: "Enlisted Officers' Dormitories (Ops, Science)" },
      { id: 58, name: "Junior Officers' Quarters (1)" },
      { id: 66, name: "Chief Engineer's Office" },
    ],
  },
  {
    title: 'Deck 7',
    locations: [
      { id: 20, name: 'Aft Observation Lounge / "Debbie\'s Diner"' },
      { id: 21, name: 'Turbolifts and Corridors' },
      { id: 38, name: 'Main Engineering - Lower Level' },
      { id: 44, name: 'Chemistry Lab' },
      { id: 59, name: "Enlisted Officers' Dormitories (Engineering)" },
    ],
  },
  {
    title: 'Waverider Shuttle',
    locations: [
      { id: 22, name: 'Waverider Shuttle' },
      { id: 42, name: 'Cockpit' },
      { id: 43, name: 'Common Area' },
      { id: 45, name: 'Cargo Area' },
      { id: 46, name: 'Bunk Rooms' },
      { id: 47, name: 'Sickbay and Science Auxiliary' },
    ],
  },
  {
    title: 'Shuttlecraft & Support Craft',
    locations: [
      { id: 49, name: 'Shuttlecraft Opportunity' },
      { id: 50, name: 'Shuttlecraft Spirit' },
      { id: 51, name: 'Type IV Worker Bee' },
    ],
  },
];

export async function getTourDetail(id: number): Promise<TourDetail> {
  const res = await fetch(`${BASE}/sim/tour/${id}`, { next: { revalidate: 86400 } });
  const html = await res.text();

  const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ??
    html.match(/<title>([^|<]+)/i);
  const name = nameMatch ? nameMatch[1].trim() : '';

  const imgMatch = html.match(/src="(https?:\/\/[^"]*\/tour\/[^"]+)"/i) ??
    html.match(/src="([^"]*\/images\/tour\/[^"]+)"/i);
  const image = imgMatch
    ? (imgMatch[1].startsWith('http') ? imgMatch[1] : `${BASE}${imgMatch[1]}`)
    : null;

  const description = '';
  const location = '';

  return { name, description, location, image };
}
