# Next.js Template

[![CI](https://github.com/ygcarvalh/nextjs-template/actions/workflows/ci.yml/badge.svg)](https://github.com/ygcarvalh/nextjs-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A clone-and-launch starter for scalable Next.js apps: App Router + TypeScript, Tailwind CSS v4 + shadcn/ui, Biome, Vitest, type-safe env, and dark mode — with a feature-based architecture and a test-first workflow.

Everything the landing page claims about this repo is checked by a command you can run yourself, and it lists them.

![The landing page, with a sticky ledger listing the repository's quality gates and the command behind each one](docs/screenshots/landing-light.png)

<details>
<summary>More screenshots</summary>

The same page in dark mode. Both themes come from one token block in `src/app/globals.css`.

![The landing page in dark mode](docs/screenshots/landing-dark.png)

The notes example, behind the session gate. Covers are served through `next/image` from the one remote host the CSP allows.

![The notes board, showing four notes with cover images](docs/screenshots/notes-light.png)

Sign-in, and the 404 that any unmatched URL returns with a real 404 status.

![The sign-in page](docs/screenshots/login-light.png)

![The 404 page](docs/screenshots/not-found-light.png)

</details>

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- [pnpm](https://pnpm.io)
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)
- [Biome](https://biomejs.dev) — lint + format (no ESLint/Prettier)
- [Vitest](https://vitest.dev) + Testing Library + jsdom
- [Playwright](https://playwright.dev) — end-to-end, against the production build
- [jest-axe](https://github.com/nickcolley/jest-axe) — accessibility assertions
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode
- [`@t3-oss/env-nextjs`](https://env.t3.gg) + [zod](https://zod.dev) — type-safe env
- [Husky](https://typicode.github.io/husky) + lint-staged + commitlint — hooks

## Architecture

Feature-based: each feature colocates its own components, server code, and tests. Shared building blocks live in top-level folders.

```
middleware.ts                  # correlation id, session gate, ?next=, rate limit
instrumentation.ts             # server-boot hook: logger and metrics
src/
  app/
    (public)/                  # marketing chrome
      page.tsx                 # /
      login/page.tsx           # /login
    (protected)/               # session required
      layout.tsx               # re-checks the session, then renders
      notes/page.tsx           # /notes
      not-found.tsx            # 404 inside the app shell
    api/health/route.ts        # GET /api/health
    api/metrics/route.ts       # GET /api/metrics, for Prometheus
    api/notes/route.ts         # GET/POST /api/notes
    not-found.tsx              # 404 for any unmatched URL
    error.tsx, global-error.tsx, loading.tsx
    robots.ts, sitemap.ts
  features/
    auth/
      server/
        session-provider.ts    # the port
        cookie-session.ts      # the adapter — replace this one
        session.ts             # the composition point
        session-token.ts       # HMAC sign/verify, edge safe
        auth-actions.ts        # sign in / sign out (Server Actions)
        safe-redirect.ts       # open-redirect guard
      components/login-form.tsx
    notes/
      server/
        notes-repository.ts    # the port
        in-memory-notes-repository.ts
        notes-service.ts       # use cases, scoped to the session owner
      components/notes-widget.tsx
    verification/              # the ledger shown on the landing page
  components/
    ui/                        # shadcn primitives (generated; excluded from lint)
  lib/
    security-headers.ts, http.ts, rate-limit.ts, utils.ts
    logger.ts, metrics.ts, with-route-logging.ts
    request-id.ts, request-context.ts, request-id-client.ts
  env.ts                       # validated, typed environment variables
```

The `notes` feature is the reference vertical slice: a `NotesRepository` port with an in-memory adapter, a service that scopes every read and write to the session owner, a thin Route Handler on top, and a client component that talks to it. Copy it to build new features.

Two boundaries have tooling behind them. Biome's `noRestrictedImports` stops components importing a feature's server layer, and the session is checked twice: middleware redirects early, then the protected layout and the route handler check again before anything renders or returns.

## Requirements

- Node.js 22.13+
- pnpm 9+

## Setup

```bash
pnpm install
cp .env.example .env.local
```

## Develop

```bash
pnpm dev
```

Open http://localhost:3000. The notes example lives at `/notes`, behind the gate. Sign in with the seeded credentials from `.env.example`.

`pnpm dev:logs` runs the same server and tees everything into the shared log directory the search stack reads. See [Observability](#observability).

## Authentication

`src/features/auth/server/cookie-session.ts` is a development adapter. It signs a real, tamper-evident cookie, but it authenticates a single account from environment variables and stores no users.

To use a real identity provider, write an adapter satisfying `SessionProvider` and change one binding in `src/features/auth/server/session.ts`. Nothing outside that file names an implementation.

Read [SECURITY.md](SECURITY.md) before deploying.

## Observability

Every request carries a correlation ID, and every log line is one JSON object that includes it. A user who quotes the reference off an error screen has handed you everything you need to find the request.

`middleware.ts` mints the ID. A caller that already sent `x-request-id` keeps it, which is how an upstream service or a native client stitches its logs to these; anyone else gets a fresh one. Inbound values are checked against `[A-Za-z0-9_-]{1,64}` and replaced when they fail, because a header is untrusted input and a newline in it would forge log lines.

The ID leaves in three directions: forwarded on the request so route handlers see it, set on the response header so a `fetch` caller can read it, and dropped in a readable `x-request-id` cookie so the client error boundary can quote it without a round trip. A cookie rather than a `<meta>` tag, because reading `headers()` in the root layout would cost the landing page its static rendering.

Two loggers write, because the edge runtime cannot run pino:

- `middleware.ts` writes one `request.received` line per request with a hand-built `console.log(JSON.stringify(...))`. This is the only record of a page load.
- `src/lib/logger.ts` is pino, for everything in the Node runtime. `withRouteLogging` wraps a route handler and writes one `request` line with the status and duration. `AsyncLocalStorage` carries the ID, so no call site has to pass it.

```json
{"level":"info","timestamp":"2026-08-20T20:29:45.997Z","service":"nextjs-template","request_id":"single-sink-002","method":"GET","path":"/api/health","status_code":200,"duration_ms":0.304,"event":"request"}
```

Lines record method, path, status, duration, client IP and the correlation ID. Bodies, query values and headers stay out, so there is no redaction list to keep current.

`LOG_FORMAT=console` swaps the JSON for a readable stream while you work. `LOG_FILE` adds a file sink on top of stdout, for a platform that wants one.

Prometheus metrics are served at `/api/metrics`, from `prom-client`. Set `METRICS_ENABLED=false` to withdraw the route. The counters live in the process, so behind more than one Node worker each reports only its own share.

### Searching the logs

This template writes the logs and serves the metrics; something else has to store and search them. One Loki per project also means one Grafana per project, and two queries every time an ID crosses a service boundary.

The companion `devstack` repository runs Loki, Grafana, Alloy and Prometheus once for every project on the machine. Run the app with `pnpm dev:logs` and its output lands in `~/.local/state/devlogs/`, which is where that stack looks:

```bash
pnpm dev:logs        # writes ~/.local/state/devlogs/<package name>.jsonl
```

Set `DEV_LOG_DIR` to write somewhere else. Then register `/api/metrics` by dropping one file into that repository's `prometheus/targets/`; its README has the details.

Set `SERVICE_NAME` in `.env.local` when you derive a project from this template. It becomes the `service` label in Loki and the filter in every query, so `jobtrail-web` and `loreweave-web` left on the default name would collapse into one stream.

Without `devstack` everything still works: `pnpm dev` prints the same JSON, and `jq` reads it.

## Test-driven development

Vitest + Testing Library. Tests are colocated as siblings, and the extension picks the environment: `*.test.ts` runs in node for server code, `*.test.tsx` runs in jsdom for components.

Red → green → refactor:

1. Write a failing test next to the code.
2. Run it and watch it fail.
3. Write the minimal code to pass.
4. Refactor with the test as a safety net.

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
pnpm test:coverage  # with enforced thresholds
pnpm test:e2e       # Playwright, against a production build
```

## Adding a feature

Copy the `notes` slice and rename:

1. `src/features/<name>/types.ts` — zod schema + types.
2. `src/features/<name>/server/<name>-repository.ts` — the port.
3. `src/features/<name>/server/<name>-service.ts` — use cases, taking the port.
4. `src/features/<name>/server/index.ts` — bind the adapter.
5. `src/app/api/<name>/route.ts` — a thin HTTP adapter, or a Server Action.
6. `src/features/<name>/components/` — client components.
7. Colocate tests as siblings of the files they cover.

## Environment variables

Defined and validated in `src/env.ts`, which `next.config.ts` imports so an invalid environment fails the build rather than production. Add new variables there and import from `@/env` for typed access. Set `SKIP_ENV_VALIDATION=1` to bypass validation.

Everything that needs to know the origin reads `NEXT_PUBLIC_APP_URL`: `metadataBase`, `robots.txt`, the sitemap, whether the session cookie is `Secure` and `__Host-` prefixed, and whether the CSP sends `upgrade-insecure-requests`. Set it to your real https origin in production.

## Security

Security headers are defined in `src/lib/security-headers.ts` and applied to every response. `POST /api/notes` returns 401 without a session, 415 for a non-JSON content type, 400 for a malformed body, 413 for an oversized one, and 409 at the per-owner limit. The `?next=` parameter is filtered against open-redirect payloads, and an inbound `x-request-id` is filtered before it reaches a log line.

See [SECURITY.md](SECURITY.md) for what to change before deploying.

## Quality tooling

```bash
pnpm lint        # biome check (lint + format + import order)
pnpm format      # biome check --write (apply fixes)
pnpm typecheck   # tsc --noEmit
pnpm build       # production build
pnpm verify      # typecheck + lint + coverage + build
```

Hooks: `lint-staged` on pre-commit, `commitlint` on the commit message, and typecheck plus tests on pre-push. CI runs the same checks along with Playwright and `pnpm audit`.

## Styling

Colors, radii, and fonts are tokens in `src/app/globals.css`. Restyling the template means editing that block, not the components. Tailwind CSS files and the generated `src/components/ui/**` are excluded from Biome.

## Adding shadcn components

```bash
pnpm dlx shadcn@latest add <component>
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
