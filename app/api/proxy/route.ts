const BASE = 'https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api';
const WRITE_KEY = process.env.NEXT_PUBLIC_WRITE_API_KEY ?? '';

export async function POST(request: Request) {
  const { path, method, body } = await request.json();
  const res = await fetch(`${BASE}${path}`, {
    method: method ?? 'POST',
    headers: { 'X-API-Key': WRITE_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
