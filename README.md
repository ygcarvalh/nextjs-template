# Next.js Template

[![CI](https://github.com/ygcarvalh/nextjs-template/actions/workflows/ci.yml/badge.svg)](https://github.com/ygcarvalh/nextjs-template/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A clone-and-launch starter for scalable Next.js apps: App Router + TypeScript,
Tailwind CSS v4 + shadcn/ui, Biome, Vitest, type-safe env, and dark mode — with a
feature-based architecture, public and private route groups, and a test-first
workflow.

Every claim below is checked by a command you can run, and the landing page
lists those commands.

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

Feature-based: each feature colocates its own components, server code, and tests.
Shared building blocks live in top-level folders.

```
middleware.ts                  # session gate, ?next= preservation, rate limit
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
  env.ts                       # validated, typed environment variables
```

The `notes` feature is the reference vertical slice: a `NotesRepository` port
with an in-memory adapter, a service that scopes every read and write to the
session owner, a thin Route Handler on top, and a client component that talks to
it. Copy it to build new features.

Two boundaries are enforced rather than documented. Components cannot import a
feature's server layer (Biome's `noRestrictedImports`), and middleware is never
the only thing checking a session — the protected layout and the route handler
check it again.

## Requirements

- Node.js 20.9+
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

Open http://localhost:3000. The notes example lives at `/notes`, behind the gate.
Sign in with the seeded credentials from `.env.example`.

## Authentication

`src/features/auth/server/cookie-session.ts` is a development adapter. It signs
a real, tamper-evident cookie, but it authenticates a single account from
environment variables and stores no users.

To use a real identity provider, write an adapter satisfying `SessionProvider`
and change one binding in `src/features/auth/server/session.ts`. Nothing outside
that file names an implementation.

Read [SECURITY.md](SECURITY.md) before deploying.

## Test-driven development

Vitest + Testing Library. Tests are colocated as siblings, and the extension
picks the environment: `*.test.ts` runs in node for server code, `*.test.tsx`
runs in jsdom for components.

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

Defined and validated in `src/env.ts`, which `next.config.ts` imports so an
invalid environment fails the build rather than production. Add new variables
there and import from `@/env` for typed access. Set `SKIP_ENV_VALIDATION=1` to
bypass validation.

`NEXT_PUBLIC_APP_URL` is the single source of truth for the origin. It drives
`metadataBase`, `robots.txt`, the sitemap, whether the session cookie is `Secure`
and `__Host-` prefixed, and whether the CSP sends `upgrade-insecure-requests`.
Set it to your real https origin in production.

## Security

Security headers are defined in `src/lib/security-headers.ts` and applied to
every response. `POST /api/notes` returns 401 without a session, 415 for a
non-JSON content type, 400 for a malformed body, 413 for an oversized one, and
409 at the per-owner limit. The `?next=` parameter is filtered against
open-redirect payloads.

See [SECURITY.md](SECURITY.md) for what to change before deploying.

## Quality tooling

```bash
pnpm lint        # biome check (lint + format + import order)
pnpm format      # biome check --write (apply fixes)
pnpm typecheck   # tsc --noEmit
pnpm build       # production build
pnpm verify      # typecheck + lint + coverage + build
```

Hooks: `lint-staged` on pre-commit, `commitlint` on the commit message, and
typecheck plus tests on pre-push. CI runs the same checks along with Playwright
and `pnpm audit`.

## Styling

Colors, radii, and fonts are tokens in `src/app/globals.css`. Restyling the
template means editing that block, not the components. Tailwind CSS files and
the generated `src/components/ui/**` are excluded from Biome.

## Adding shadcn components

```bash
pnpm dlx shadcn@latest add <component>
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Licensed under [MIT](LICENSE).
