# CarbonWise — Carbon Footprint Awareness Platform

> **[Challenge 3] Carbon Footprint Awareness Platform** — a solution that helps
> individuals understand, track, and reduce their carbon footprint through
> simple actions and personalized insights.

**Chosen vertical:** individual carbon footprint awareness and reduction.

CarbonWise is a privacy-first web app. You answer a few lifestyle questions, it
estimates your weekly and monthly CO₂e, shows where your emissions come from,
and a rule-based assistant (**EcoGuide**) recommends the highest-impact actions
tailored to you. All personal data stays in your browser — there is no account
and no database.

---

## Problem statement

Most people want to lower their environmental impact but don't know where their
emissions actually come from or which changes matter most. Generic tips ignore
personal context (diet, commute, household, local environment). CarbonWise turns
a short profile into a concrete, prioritized, and *personalized* reduction plan,
and makes progress easy to track over time.

## Approach and logic

1. **Deterministic core.** Emission factors live in
   `src/lib/emissions/factors.ts` and the calculator in
   `src/lib/emissions/calculator.ts` is built from small, pure, fully-tested
   functions. Footprint = Transport + Home Energy + Food + Shopping + Waste
   (shared resources like home energy and waste are divided by household size),
   plus any manually-added activities.
2. **Eco score.** The weekly footprint is mapped onto a 0–100 score between a
   sustainable target and a high-impact reference lifestyle.
3. **EcoGuide.** A set of pure rules (`src/lib/recommendations/`) inspect the
   profile, footprint and optional environmental context (air quality, pollen,
   solar potential) and emit ranked recommendations. The user's stated goal
   boosts the matching category; estimated kg CO₂e saved breaks ties.
4. **Local insights.** When the user opens the *Local Insights* tab, the app
   lazily calls eight Google Maps Platform APIs through server-side proxies and
   renders maps, air quality, solar, pollen, places and local time.

## Feature list

- Landing page with the challenge value proposition and privacy/demo explanation.
- Accessible onboarding/profile form (optional location, household, diet,
  commute, travel, electricity, shopping, recycling, goal).
- Carbon calculator with category breakdown, top contributor, confidence level,
  and manual activity entry.
- **EcoGuide** personalized assistant: title, explanation, estimated savings,
  difficulty, cost, time, impact, "why this is personal", and plan/done actions.
- Tracking dashboard: eco score, weekly/monthly footprint, category cards,
  lightweight SVG trend chart, goals & completed actions, a "What changed?"
  panel, JSON export, and delete-all.
- Eight Google Maps Platform integrations (see below), all with demo fallbacks.
- Works fully offline in demo mode; progressive enhancement keeps the calculator
  usable without any network.

## The 8 Google APIs

| # | Google API | What it does in CarbonWise | Access |
|---|------------|----------------------------|--------|
| A | **Maps JavaScript API** | Interactive map of the user's area, lazy-loaded only when the Local Insights tab opens; accessible fallback if the browser key is missing or the script fails. | Browser key via `/api/config` |
| B | **Geocoding API** | Converts a city/address into approximate (rounded) coordinates to anchor local insights. | Server proxy `/api/google/geocode` |
| C | **Routes API** | Compares commute options (drive, transit, bike, walk) and estimates emissions per option using field masks. | Server proxy `/api/google/routes` |
| D | **Places API (New)** | Finds nearby eco-friendly places: recycling centers, EV charging, bike shops, transit stations, farmers markets, plant-forward restaurants. | Server proxy `/api/google/places` |
| E | **Air Quality API** | Shows current local air quality and health guidance; feeds EcoGuide (e.g. "leave the car on high-pollution days"). | Server proxy `/api/google/air-quality` |
| F | **Solar API** | Shows rooftop solar potential; degrades to useful home-energy advice where unavailable; feeds EcoGuide's solar suggestion. | Server proxy `/api/google/solar` |
| G | **Pollen API** | Shows the local pollen forecast for health-aware low-carbon outdoor activity suggestions. | Server proxy `/api/google/pollen` |
| H | **Time Zone API** | Converts location to local timezone for reminder copy and daily-summary timestamps. | Server proxy `/api/google/timezone` |

Every server proxy validates input with Zod, uses hardcoded upstream URLs,
applies an `AbortController` timeout, normalizes errors, caches briefly, and is
rate-limited per IP. When `GOOGLE_MAPS_SERVER_API_KEY` is absent, the proxies
return typed demo fixtures from `src/test/fixtures/google/` and the UI shows a
**“Demo data”** badge.

## Architecture

```
src/
  app/
    api/
      config/route.ts        # runtime public config (browser key + demoMode)
      health/route.ts        # Cloud Run health probe
      google/<api>/route.ts  # 7 server-side Google proxies
    layout.tsx, page.tsx, globals.css
  components/                # assistant, calculator, dashboard, forms,
                             # layout, maps, ui  (accessible, mostly presentational)
  hooks/                     # useCarbonState, useRuntimeConfig, useLocationInsights
  lib/
    emissions/               # factors.ts + pure calculator
    recommendations/         # EcoGuide rules + ranking
    google/                  # one typed client per API + schemas, errors,
                             # cache, rateLimit, http, handler, config
    maps/loader.ts           # lazy Maps JS loader
    storage/                 # typed local-storage adapter + history
    utils/, validation/, insights.ts
  test/fixtures/google/      # labelled demo fixtures
tests/e2e/                   # Playwright journey
```

Data flow: **UI → hooks → pure lib logic** (calculator/recommendations) for the
core experience, and **UI → `/api/google/*` proxies → typed Google clients** for
location insights. The server-side key never crosses into the browser bundle.

## Security practices

- **No secrets in the repo.** `.env.example` documents the variables; real keys
  are provided only at runtime. The server key is read solely in
  `src/lib/google/config.ts` and never sent to the client.
- **Strict input validation** with Zod on every request body and search param,
  including max input lengths and numeric ranges.
- **Hardcoded upstream URLs** — user input is never used to build a request URL.
- **Per-IP token-bucket rate limiting** and a short-TTL response cache on every
  proxy. Every external call has an `AbortController` timeout.
- **Normalized, safe error messages** — upstream payloads are never forwarded.
- **Security headers / CSP** set in `next.config.ts`: `default-src 'self'`,
  scoped `script-src`/`connect-src`/`img-src` for Google Maps domains,
  `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`, plus
  `Referrer-Policy`, `X-Content-Type-Options`, and `Permissions-Policy`.
- **No `dangerouslySetInnerHTML`.** All dynamic strings are rendered by React,
  which escapes them.
- The browser Maps key is public by nature — **restrict it in the Google Cloud
  Console by HTTP referrer and by API** (Maps JavaScript API only).
- `npm run audit` validates production dependencies; the dependency surface is
  intentionally small (Next, React, Zod at runtime).

## Accessibility practices

- Semantic landmarks (`header`, `nav`, `main`, `footer`) and a logical heading
  order; a **skip-to-content** link is the first focusable element.
- Full keyboard support with **visible focus styles** (`:focus-visible`).
- Form fields use real `<label>`s; descriptions and error messages are connected
  via `aria-describedby`, and invalid fields set `aria-invalid`.
- Calculation results and form feedback use `aria-live` status regions, so
  updates are announced to screen readers.
- **Status is never communicated by color alone** — demo/live, top contributor,
  trend direction, and confidence all use text and icons.
- WCAG AA color contrast; `prefers-reduced-motion` is respected.
- Automated accessibility tests with **jest-axe** cover the major views
  (`src/test/a11y.test.tsx`), in addition to the Playwright journey.

## Testing strategy

- **Vitest + React Testing Library + jsdom** for unit and component tests;
  **jest-axe** for accessibility; **Playwright** for the essential e2e flow.
- Coverage thresholds are **100%** for statements, branches, functions and lines
  (`vitest.config.ts`). Only test files, demo fixtures, type-only files and the
  generated-boilerplate root layout are excluded — never application logic.
- Google APIs are **mocked**; tests never hit the network.
- Covered areas: emission calculations, recommendation logic, local-storage
  adapter, profile validation, Google request validation, demo fallback, error
  normalization, rate limiter, cache, dashboard rendering, calculator flow,
  assistant recommendations, accessibility, and the e2e journey.

### Run the tests

```bash
npm install
npm run typecheck      # tsc --noEmit (strict mode)
npm run lint           # ESLint (next/core-web-vitals + next/typescript)
npm run test           # unit + component + a11y
npm run test:coverage  # enforces 100% thresholds
npm run test:e2e       # Playwright journey (builds + starts in demo mode)
npm run audit          # npm audit on production deps
npm run validate       # typecheck + lint + coverage + build
```

> Before the first `npm run test:e2e`, install the browser once:
> `npx playwright install chromium`.

## Google Cloud Run deployment

The app uses Next.js **standalone** output (`output: "standalone"`) and listens
on `process.env.PORT`. Google API keys are **not** required at build time.

```bash
# 1. Set your project
gcloud config set project YOUR_PROJECT_ID

# 2. Build the container with Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/carbonwise

# 3. Deploy to Cloud Run (demo mode — no keys)
gcloud run deploy carbonwise \
  --image gcr.io/YOUR_PROJECT_ID/carbonwise \
  --region us-central1 \
  --allow-unauthenticated

# 4. (Optional) enable live Google data by setting keys at runtime
gcloud run services update carbonwise \
  --region us-central1 \
  --set-env-vars GOOGLE_MAPS_SERVER_API_KEY=xxx,GOOGLE_MAPS_BROWSER_API_KEY=yyy
```

Health check: `GET /api/health` → `{ "status": "ok", "version": "...", "demoMode": <bool> }`.

You can also run the container locally:

```bash
docker build -t carbonwise .
docker run -p 8080:8080 carbonwise   # then open http://localhost:8080
```

## Environment variables

Copy `.env.example` to `.env.local` for local development (optional — the app
runs without it).

| Variable | Purpose | Exposure |
|----------|---------|----------|
| `GOOGLE_MAPS_SERVER_API_KEY` | Server-side key for the 7 proxied APIs. | **Server only**, never sent to the browser. |
| `GOOGLE_MAPS_BROWSER_API_KEY` | Public key for the Maps JavaScript API. | Public — restrict by HTTP referrer + API. |
| `NODE_ENV` | Standard Node environment. | — |

## Demo mode

- **No `GOOGLE_MAPS_SERVER_API_KEY`** → all proxied APIs return clearly labelled
  **“Demo data”** fixtures, so the full experience works offline.
- **No `GOOGLE_MAPS_BROWSER_API_KEY`** → the interactive map shows an accessible
  fallback; every other feature still works.
- Real Google integrations exist in the code and are used automatically when the
  keys are present.

## Assumptions

- Emission factors are simplified, public-dataset approximations (DEFRA/EPA/Our
  World in Data) suitable for an awareness tool, not audit-grade accounting.
- Home energy and waste are shared household resources, so their totals are
  divided by household size for a per-person estimate.
- "One profile per browser" — there is no multi-user/account concept by design.
- Coordinates are rounded to ~1.1 km before storage for privacy.

## Repository notes

- **Repository size:** kept well under 10 MB. No `node_modules`, build output,
  coverage, screenshots, videos, or large assets are committed (see
  `.gitignore`). The only asset is a tiny inline SVG icon.
- **Branching:** a single `main` branch; the repository is public.
- **No secrets** are committed; configuration is provided via environment
  variables at runtime.
