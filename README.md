# Next.js Template

A clone-and-launch starter for scalable Next.js apps: App Router + TypeScript,
Tailwind CSS v4 + shadcn/ui, Biome, Vitest, type-safe env, and dark mode — with a
feature-based architecture and a test-first workflow.

## Stack

- [Next.js](https://nextjs.org) (App Router) + React 19 + TypeScript
- [pnpm](https://pnpm.io)
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com)
- [Biome](https://biomejs.dev) — lint + format (no ESLint/Prettier)
- [Vitest](https://vitest.dev) + Testing Library + jsdom
- [next-themes](https://github.com/pacocoursey/next-themes) — dark mode
- [`@t3-oss/env-nextjs`](https://env.t3.gg) + [zod](https://zod.dev) — type-safe env
- [Husky](https://typicode.github.io/husky) — pre-commit lint hook

## Architecture

Feature-based: each feature colocates its own components, server code, and tests.
Shared building blocks live in top-level folders.

```
src/
  app/                       # routes, layouts, API route handlers
    api/health/route.ts      # GET /api/health
    api/notes/route.ts       # GET/POST /api/notes (example REST slice)
    notes/page.tsx           # renders the notes feature
  features/
    notes/
      types.ts               # zod schema + types
      server/notes-store.ts  # data access ("server-only")
      components/            # feature UI (client)
      __tests__/             # feature tests
  components/
    ui/                      # shadcn primitives (generated; excluded from lint)
    theme-provider.tsx       # next-themes provider
    mode-toggle.tsx          # dark-mode toggle
  lib/utils.ts               # cn() and shared helpers
  hooks/                     # shared hooks
  env.ts                     # validated, typed environment variables
```

The `notes` feature is the reference vertical slice: a Route Handler
(`app/api/notes`) backed by a server-only store, consumed by a client component
(`features/notes/components/notes-widget.tsx`). Copy it to build new features.

## Requirements

- Node.js 20+
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

Open http://localhost:3000. The notes example lives at `/notes`.

## Test-driven development

Vitest + Testing Library, jsdom environment. Tests are colocated with the code
they cover (`*.test.ts` / `*.test.tsx`).

Red → green → refactor:

1. Write a failing test next to the code (a `__tests__` folder or a sibling file).
2. Run it and watch it fail.
3. Write the minimal code to pass.
4. Refactor with the test as a safety net.

```bash
pnpm test           # run once
pnpm test:watch     # watch mode
```

## Adding a feature

Copy the `notes` slice and rename:

1. `src/features/<name>/types.ts` — zod schema + types.
2. `src/features/<name>/server/` — server-only data access.
3. `src/app/api/<name>/route.ts` — Route Handler (or a Server Action).
4. `src/features/<name>/components/` — client components.
5. `src/app/<name>/page.tsx` — the page.
6. Colocate tests under `src/features/<name>/__tests__/`.

## Environment variables

Defined and validated in `src/env.ts`. Add new variables there (server or client)
and import from `@/env` for typed, validated access. Set `SKIP_ENV_VALIDATION=1` to
bypass validation (e.g. in some CI steps).

## Quality tooling

```bash
pnpm lint        # biome check (lint + format + import order)
pnpm format      # biome check --write (apply fixes)
pnpm typecheck   # tsc --noEmit
pnpm build       # production build
```

A Husky pre-commit hook runs `pnpm lint` on every commit. Tailwind CSS files and
the generated `src/components/ui/**` are excluded from Biome.

## Adding shadcn components

```bash
pnpm dlx shadcn@latest add <component>
```
