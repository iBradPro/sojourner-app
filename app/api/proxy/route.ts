const BASE = 'https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api';
const WRITE_KEY = process.env.NEXT_PUBLIC_WRITE_API_KEY ?? '';
const GM_KEY = process.env.GM_API_KEY ?? '';

export async function POST(request: Request) {
  const { path, method, body, token, useGmKey } = await request.json();
  const key = useGmKey ? GM_KEY : (token ?? WRITE_KEY);
  const res = await fetch(`${BASE}${path}`, {
    method: method ?? 'POST',
    headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
