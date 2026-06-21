const BASE = 'https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': API_KEY },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

export interface Post {
  id: number;
  title: string;
  content: string;
  mission_id: number | null;
  authors: string | null;
  status: string;
  date: string;
  summary?: string | null;
  ordered?: { day?: number; time?: string; date?: string; stardate?: string };
  age_gated?: boolean;
}

export interface Mission {
  id: number;
  title: string | null;
  description: string | null;
  status: string;
  start: string | null;
  end: string | null;
}

export interface Character {
  id: number;
  first_name: string | null;
  last_name: string | null;
  suffix: string | null;
  status: string;
  rank: number | null;
  user_id: number | null;
  display_name?: string | null;
  preferred_name: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
}

export const api = {
  posts: (params?: { mission?: number; page?: number; per_page?: number; status?: string }) =>
    apiFetch<Paginated<Post>>('/posts', params as Record<string, string | number>),

  post: (id: number) =>
    apiFetch<Post>(`/posts/${id}`),

  missions: (params?: { status?: string; page?: number; per_page?: number }) =>
    apiFetch<Paginated<Mission>>('/missions', params as Record<string, string | number>),

  mission: (id: number) =>
    apiFetch<Mission>(`/missions/${id}`),

  characters: (params?: { status?: string; page?: number; per_page?: number }) =>
    apiFetch<Paginated<Character>>('/characters', params as Record<string, string | number>),

  character: (id: number) =>
    apiFetch<Character>(`/characters/${id}`),
};
