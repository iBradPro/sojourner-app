# Sojourner App — Project Memory

A mobile-first PWA companion app for the USS Sojourner Star Trek PBEM sim, built by Brad (iBradPro) with Claude Code. Reece ([SC] sysadmin) manages the SimCentral Nova backend and API.

## What This App Is

A mobile companion for writers in the USS Sojourner sim hosted on SimCentral Suite (Nova). Writers use it to read posts, compose/edit drafts, browse the crew manifest, and check mission info — all from their phone. The aesthetic is LCARS (Star Trek computer UI) using a custom color palette.

## Tech Stack

- **Next.js** (App Router, latest) — see AGENTS.md for important version caveats
- **React 19**, **Tailwind CSS v4**
- **Railway** for hosting — deploy with `railway up --detach` (GitHub webhook is broken, do NOT rely on auto-deploy)
- **SimCentral Suite REST API** at `https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api`
- **OpenAPI spec**: `https://sojourner.simcentral.org/extensions/nova_ext_sim_central/Api/openapi` (versioned — check this first for new endpoints)
- **Nova site** at `https://sojourner.simcentral.org` — character pages scraped for bios/images

## API Auth

- `NEXT_PUBLIC_API_KEY` — read-only key (used server-side for character/mission/post fetching)
- `NEXT_PUBLIC_WRITE_API_KEY` — write key bound to Brad's Nova user (used for compose/edit/delete)
- `GM_API_KEY` — sysadmin key (for GM-only operations)
- All write operations go through `/app/api/proxy/route.ts` to keep keys server-side
- API version as of last update: **v1.21.3**

## LCARS Color Palette

```
--lcars-orange:   #FF9900   (primary CTAs, active nav, section bulbs)
--lcars-peach:    #FFCC99   (post titles, character names, headings)
--lcars-purple:   #9999CC   (inactive nav, subtitles, rule lines)
--lcars-lavender: #BBAADD   (page headings, card left borders, section labels)
--lcars-salmon:   #CC6666
--lcars-tan:      #FF9966
--lcars-bg:       #000000
--lcars-panel:    #0d0d0d
```

## Key Design Patterns

- `.lcars-label` — section headers with orange bulb pill + purple rule line
- `.lcars-card` — dark panel cards with lavender left border
- Active nav tab: orange (`#FF9900`) pill with black icon/text
- Inactive nav: purple (`#9999CC`) icons and text
- Bottom nav has 6 tabs: Home (doors icon), Write (pen), Posts (PADD), Tour (ship), Crew (users), Settings (warp core)
- Custom SVG icons defined inline in `components/Nav.tsx` and `components/SojoShipIcon.tsx`

## App Structure

```
app/
  page.tsx              — Home: ship hero image, USS Sojourner title, sim premise, stats
  posts/
    page.tsx            — Paginated post list
    [id]/page.tsx       — PADD-style post reader
  compose/
    page.tsx            — Draft list + compose form (WriteTabs + ComposeForm)
  crew/
    page.tsx            — Crew manifest (scraped from Nova manifest page in one fetch)
    [id]/page.tsx       — Character profile (scraped from Nova character page)
  tour/                 — Ship tour locations with image galleries
  missions/             — Mission list/detail
  settings/             — Settings page
  api/proxy/route.ts    — Server-side proxy for all write API calls

components/
  Nav.tsx               — Bottom nav with custom SVG icons
  ComposeForm.tsx       — Post compose/edit form with locking
  RichTextEditor.tsx    — contentEditable WYSIWYG (bold/italic/underline)
  PostReader.tsx        — Post reader with text size controls (persisted to localStorage)
  WriteTabs.tsx         — Tabs switching between draft list and compose form
  CharacterImageViewer.tsx — Tappable character avatar with fullscreen lightbox
  SojoShipIcon.tsx      — Top-down Starfleet ship SVG for Tour nav button
  ImageGallery.tsx      — Tour image gallery with pinch-zoom

lib/
  api.ts                — All API types and fetch functions (read + write + lock endpoints)
  utils.ts              — scrapeCharacterProfile(), getDepartment(), formatPostContent()
  tour.ts               — Static tour location data
  token.ts              — Client-side write token retrieval
```

## Post Edit Locking (v1.21.3)

Implemented in `ComposeForm.tsx`. When opening an existing draft:
- `POST /posts/{id}/lock` — acquire lock on mount
- `PUT /posts/{id}/lock` — heartbeat every 5 minutes
- `DELETE /posts/{id}/lock` — release on save or navigate away
- If 409 returned, another writer holds the lock — show warning banner, disable all inputs
- New posts (no draft.id) don't need a lock

## Crew Manifest

The crew list (`app/crew/page.tsx`) scrapes `https://sojourner.simcentral.org/personnel/index` in a **single fetch** — that page contains department headers (`<h2 class="dept">`), character IDs, positions (`<span class="position">`), and thumbnail images. No per-character scraping on the list page. Individual character profile pages (`app/crew/[id]/page.tsx`) do scrape the full Nova character page for bio sections.

Both crew pages use `export const revalidate = 3600` for ISR caching.

## Performance Notes

- Crew list: 1 fetch (manifest page) → fast
- Character detail: 1 fetch (character page scrape) → cached 1hr per character
- Posts/home: dynamic (personalized) — no page-level caching
- Railway wipes Next.js ISR cache on each deploy — first load after deploy is always cold

## Text Size

User's preferred text size is saved to `localStorage` key `textSize` (0–4 index). Both PostReader and RichTextEditor read/write this shared key so size stays consistent.

## Deployment

```bash
railway up --detach
```

GitHub remote is `https://github.com/iBradPro/sojourner-app` (private). Railway does NOT auto-deploy from GitHub — always run `railway up --detach` manually after committing.

## People

- **Brad** (iBradPro) — writer, sim GM, app owner
- **Reece** — SimCentral sysadmin, manages Nova backend and API tokens, reviews OpenAPI spec updates
