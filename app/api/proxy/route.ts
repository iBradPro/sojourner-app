const BASE = 'https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api';
const GM_KEY = process.env.GM_API_KEY ?? '';

/*
 * This route exists so Nova keys stay server-side. Until 2026-10-12 it also
 * did three things it should not have, and anyone who found the URL could use
 * them, because the repo is public and there is no sign-in:
 *
 *   1. With no token in the body it fell back to the site's write key, which is
 *      bound to Brad's Nova user. A stranger could create, edit and delete
 *      posts as him. Verified from a cold terminal: it returned a saved draft.
 *   2. The caller could simply ask for the GM key with "useGmKey": true.
 *   3. It forwarded ANY path to Nova, so it was a general purpose proxy.
 *
 * Now: a caller must present their own token, GM access is proven rather than
 * claimed, and only the endpoints this app actually uses are reachable.
 */

const ALLOWED_PREFIXES = ['/me', '/posts', '/tokens', '/missions', '/characters'];
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);

function pathAllowed(path: unknown): path is string {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('..')) return false;
  const base = path.split('?')[0];
  return ALLOWED_PREFIXES.some((p) => base === p || base.startsWith(p + '/'));
}

// Ask Nova who the caller is. The GM key is only used once Nova itself says
// this token belongs to a sysadmin, never because the request asked nicely.
async function callerIsGM(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/me`, { headers: { 'X-API-Key': token }, cache: 'no-store' });
    if (!res.ok) return false;
    const me = await res.json();
    return Boolean(me?.user?.is_sysadmin) || Boolean(me?.scopes?.includes('posts:read.all'));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== 'object') {
    return Response.json({ error: 'Bad request.' }, { status: 400 });
  }

  const { path, method, body, token, useGmKey } = payload as {
    path?: unknown; method?: unknown; body?: Record<string, unknown>;
    token?: unknown; useGmKey?: unknown;
  };

  if (typeof token !== 'string' || token.length < 8) {
    return Response.json(
      { error: 'A personal API token is required. Open Settings in the app to add yours.' },
      { status: 401 },
    );
  }

  const verb = typeof method === 'string' ? method.toUpperCase() : 'POST';
  if (!ALLOWED_METHODS.has(verb)) {
    return Response.json({ error: 'Method not allowed.' }, { status: 405 });
  }
  if (!pathAllowed(path)) {
    return Response.json({ error: 'Path not allowed.' }, { status: 403 });
  }

  let key = token;
  if (useGmKey === true) {
    if (!GM_KEY || !(await callerIsGM(token))) {
      return Response.json({ error: 'GM access required.' }, { status: 403 });
    }
    key = GM_KEY;
  }

  const res = await fetch(`${BASE}${path}`, {
    method: verb,
    headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  const text = await res.text();
  try {
    return Response.json(JSON.parse(text), { status: res.status });
  } catch {
    return Response.json({ error: 'Upstream returned a non-JSON response.' }, { status: 502 });
  }
}
