const BASE = 'https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';
const WRITE_KEY = process.env.NEXT_PUBLIC_WRITE_API_KEY ?? '';

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': API_KEY },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

async function apiWrite<T>(method: string, path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'X-API-Key': WRITE_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `API ${res.status}`);
  }
  return res.json();
}

export interface MyCharacter {
  id: number;
  name: string;
  rank: string | null;
  crew_type: string;
  is_main: boolean;
}

export interface Me {
  user: { id: number; name: string; is_sysadmin: boolean };
  characters: { pc: MyCharacter[]; npc: MyCharacter[] };
  scopes: string[];
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
  posts: (params?: { mission?: number; page?: number; per_page?: number; status?: string; author_id?: number }) =>
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

  me: () =>
    apiWrite<Me>('GET', '/me'),

  createPost: (data: { title: string; body: string; mission_id?: number; authors?: string; status: 'saved' | 'activated' }) =>
    apiWrite<Post>('POST', '/posts', data as Record<string, unknown>),

  updatePost: (id: number, data: { title?: string; body?: string; authors?: string; mission_id?: number; status?: string }) =>
    apiWrite<Post>('PATCH', `/posts/${id}`, data as Record<string, unknown>),

  deletePost: (id: number) =>
    apiWrite<{ deleted: boolean }>('DELETE', `/posts/${id}`),
};
