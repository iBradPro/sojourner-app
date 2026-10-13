/*
 * Read-only MCP server for the USS Sojourner sim.
 *
 * Added 2026-10-12 so Bradley's Sojo project on claude.ai can see live sim
 * data while he writes: posts in progress as well as published ones.
 *
 * Shape: Streamable HTTP, JSON-RPC 2.0 over POST, added to Claude as a custom
 * connector with "No sign-in". The shared secret lives in the URL path rather
 * than a request header because Claude's request-header auth is still a
 * limited beta, and a path works on every account today.
 *
 * This route can only read. It uses the Nova read key, never the write or GM
 * key, so a leaked URL cannot change anything in the sim.
 */

const BASE = 'https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api';
const READ_KEY = process.env.NEXT_PUBLIC_API_KEY ?? '';
const SECRET = process.env.MCP_SECRET ?? '';

const MAX_TEXT = 120000;         // keep a single tool result sane
const SEARCH_PAGE_SIZE = 500;    // Nova caps per_page at 500
const SEARCH_MAX_PAGES = 4;

type Json = Record<string, unknown>;

async function nova(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    headers: { 'X-API-Key': READ_KEY },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Nova returned ' + res.status + ' for ' + path);
  return res.json();
}

function clip(s: string) {
  return s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) + '\n\n[truncated]' : s;
}

function textResult(value: unknown) {
  const body = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text: clip(body) }] };
}

/* ---------- tools ---------- */

const TOOLS = [
  {
    name: 'list_posts',
    description:
      'List sim posts, newest first. status "any" includes in-progress drafts as well as published posts, "saved" is drafts only, "activated" is published only. Body text is omitted by default so the list stays small; use get_post for the full text.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['any', 'saved', 'activated'], description: 'Default "any".' },
        mission_id: { type: 'integer', description: 'Limit to one mission.' },
        page: { type: 'integer', description: '1-indexed, default 1.' },
        per_page: { type: 'integer', description: 'Default 25, max 100.' },
        include_content: { type: 'boolean', description: 'Default false.' },
      },
    },
  },
  {
    name: 'get_post',
    description:
      'Get one post in full, including its body text. Works for drafts in progress as well as published posts.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer', description: 'The post id.' } },
      required: ['id'],
    },
  },
  {
    name: 'search_posts',
    description:
      'Find posts whose title or body contains a phrase, across drafts and published posts. Returns matches with a surrounding snippet. Use this to check what has already been established before writing.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text to look for, case insensitive.' },
        status: { type: 'string', enum: ['any', 'saved', 'activated'], description: 'Default "any".' },
        limit: { type: 'integer', description: 'Max matches to return, default 10.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_missions',
    description:
      'List the sim missions (story arcs). Optional status filter such as current, upcoming or completed.',
    inputSchema: {
      type: 'object',
      properties: { status: { type: 'string', description: 'e.g. current, upcoming, completed.' } },
    },
  },
  {
    name: 'list_characters',
    description:
      'List crew members with rank, name and position. Set include_bio true to attach each bio.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'crew_type filter, default "active". Use "any" for everyone.' },
        include_bio: { type: 'boolean', description: 'Default false.' },
        per_page: { type: 'integer', description: 'Default 200.' },
      },
    },
  },
  {
    name: 'get_character',
    description: 'Get one character in full, including their bio sections.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'integer', description: 'The character id.' } },
      required: ['id'],
    },
  },
];

function rows(payload: unknown): Json[] {
  const d = (payload as Json)?.data;
  return Array.isArray(d) ? (d as Json[]) : [];
}

async function runTool(name: string, args: Json) {
  switch (name) {
    case 'list_posts': {
      const includeContent = args.include_content === true;
      return textResult(
        await nova('/posts', {
          status: (args.status as string) ?? 'any',
          mission_id: args.mission_id as number | undefined,
          page: (args.page as number) ?? 1,
          per_page: Math.min(Number(args.per_page ?? 25) || 25, 100),
          content: includeContent ? undefined : 0,
        }),
      );
    }

    case 'get_post': {
      if (args.id === undefined) throw new Error('id is required');
      const id = Number(args.id);
      try {
        return textResult(await nova('/posts/' + id));
      } catch (err) {
        // Nova's single-post endpoint only serves published posts: a draft
        // returns 404 there. Drafts DO come back from the list endpoint with
        // status=any, so fall back to finding it there. Without this, the
        // in-progress posts this connector exists for would be unreadable.
        for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
          const list = rows(await nova('/posts', { status: 'any', page, per_page: SEARCH_PAGE_SIZE }));
          const hit = list.find((p) => Number(p.id) === id);
          if (hit) return textResult(hit);
          if (list.length < SEARCH_PAGE_SIZE) break;
        }
        throw new Error('No post with id ' + id + ' (' + (err as Error).message + ')');
      }
    }

    case 'search_posts': {
      const needle = String(args.query ?? '').toLowerCase();
      if (!needle) throw new Error('query is required');
      const limit = Math.min(Number(args.limit ?? 10) || 10, 50);
      const status = (args.status as string) ?? 'any';

      const matches: Json[] = [];
      let scanned = 0;
      for (let page = 1; page <= SEARCH_MAX_PAGES; page++) {
        const list = rows(await nova('/posts', { status, page, per_page: SEARCH_PAGE_SIZE }));
        if (list.length === 0) break;
        scanned += list.length;
        for (const post of list) {
          const title = String(post.title ?? '');
          const whole = title + '\n' + String(post.content ?? '');
          const at = whole.toLowerCase().indexOf(needle);
          if (at === -1) continue;
          const from = Math.max(0, at - 160);
          matches.push({
            id: post.id,
            title,
            status: post.status,
            mission: post.mission ?? post.mission_id,
            date: post.created_at ?? post.updated_at,
            snippet:
              (from > 0 ? '...' : '') +
              whole.slice(from, at + needle.length + 240).trim() +
              '...',
          });
          if (matches.length >= limit) break;
        }
        if (matches.length >= limit || list.length < SEARCH_PAGE_SIZE) break;
      }
      return textResult({
        query: args.query,
        scanned_posts: scanned,
        match_count: matches.length,
        matches,
      });
    }

    case 'list_missions':
      return textResult(
        await nova('/missions', { status: args.status as string | undefined, per_page: 200 }),
      );

    case 'list_characters':
      return textResult(
        await nova('/characters', {
          status: (args.status as string) ?? 'active',
          include: args.include_bio === true ? 'bio' : undefined,
          per_page: Math.min(Number(args.per_page ?? 200) || 200, 500),
        }),
      );

    case 'get_character': {
      if (args.id === undefined) throw new Error('id is required');
      return textResult(await nova('/characters/' + Number(args.id)));
    }

    default:
      throw new Error('Unknown tool: ' + name);
  }
}

/* ---------- JSON-RPC plumbing ---------- */

const ok = (id: unknown, result: unknown) => Response.json({ jsonrpc: '2.0', id, result });
const fail = (id: unknown, code: number, message: string) =>
  Response.json({ jsonrpc: '2.0', id, error: { code, message } });

async function handle(message: Json) {
  const { id, method, params } = message as { id?: unknown; method?: string; params?: Json };

  switch (method) {
    case 'initialize':
      return ok(id, {
        // Echo the client's protocol version so this keeps working as the spec moves.
        protocolVersion: (params?.protocolVersion as string) ?? '2025-06-18',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'uss-sojourner', version: '1.0.0' },
        instructions:
          'Live data from the USS Sojourner play-by-post Star Trek sim. Posts are the canon of the story: "activated" posts are published, "saved" posts are drafts still being written. Search before assuming something has not happened yet. Everything here is read-only.',
      });

    case 'ping':
      return ok(id, {});

    case 'tools/list':
      return ok(id, { tools: TOOLS });

    case 'tools/call': {
      const name = String(params?.name ?? '');
      const args = (params?.arguments as Json) ?? {};
      try {
        return ok(id, await runTool(name, args));
      } catch (err) {
        // Tool failures come back as results, not protocol errors, so Claude
        // can read the reason and try something else.
        return ok(id, {
          content: [{ type: 'text', text: 'Tool error: ' + (err as Error).message }],
          isError: true,
        });
      }
    }

    case 'resources/list':
      return ok(id, { resources: [] });

    case 'prompts/list':
      return ok(id, { prompts: [] });

    default:
      return fail(id, -32601, 'Method not found: ' + method);
  }
}

export async function POST(request: Request, ctx: RouteContext<'/api/mcp/[secret]'>) {
  const { secret } = await ctx.params;
  if (!SECRET || secret !== SECRET) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }
  if (!READ_KEY) {
    return Response.json({ error: 'Server is missing its Nova read key.' }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
      { status: 400 },
    );
  }
  if (Array.isArray(body)) {
    return Response.json(
      { jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Batches are not supported' } },
      { status: 400 },
    );
  }

  // Notifications carry no id and expect no response body.
  const single = body as Json;
  if (single.id === undefined) return new Response(null, { status: 202 });

  return handle(single);
}

export async function GET() {
  // No server-initiated stream. The spec allows refusing the SSE channel.
  return Response.json({ error: 'This MCP endpoint accepts POST only.' }, { status: 405 });
}
