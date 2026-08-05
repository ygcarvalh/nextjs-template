# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-08-05

### Changed

- Bumped `next` to 16.2.12, `react` and `react-dom` to 19.2.8, and `lucide-react` to 1.28.0.
- Bumped the dev toolchain: `@biomejs/biome` to 2.5.6, `@vitejs/plugin-react` to 6.0.5, `shadcn` to 4.16.1, and `jsdom` to 30.0.1. The `jsdom` major only changes the test environment.

## [0.2.0] - 2026-08-05

### Added

- Public and private route groups. `(public)` holds the landing and sign-in pages; `(protected)` sits behind a session check and holds the notes example.
- A session seam: `SessionProvider` as the port, an HMAC signed-cookie adapter as the implementation, and a single binding in `src/features/auth/server/session.ts` to swap it.
- Sign-in and sign-out as Server Actions, which get CSRF origin checking for free.
- `middleware.ts` — redirects anonymous visitors, preserves the intended destination in `?next=`, and rate limits `/api/notes` and the sign-in POST.
- A `NotesRepository` port with an in-memory adapter, and a `NotesService` that scopes every read and write to the session owner.
- Security headers on every response — CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`.
- App Router boundaries: `error.tsx`, `global-error.tsx`, `loading.tsx`, and two `not-found.tsx` files (global, and one inside the protected group).
- `robots.ts`, `sitemap.ts`, `metadataBase`, OpenGraph and Twitter metadata, and a `viewport` export.
- Coverage thresholds, accessibility assertions via `jest-axe`, and a Playwright suite covering sign-in, note creation, sign-out, the open-redirect guard, the 404 status, and the response headers.
- GitHub Actions running typecheck, lint, coverage, build, end-to-end tests, and `pnpm audit`, plus Dependabot for npm and actions.
- `lint-staged` on pre-commit, `commitlint` on commit-msg, and typecheck plus tests on pre-push.
- `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, and this changelog.
- CI and license badges in the README, plus screenshots of the landing page in both themes, the notes board, sign-in, and the 404.

### Changed

- Icons from `lucide-react`, which was already a dependency, now mark the primary actions, the empty board, and both error states.
- Redesigned the landing page, sign-in page, 404, and notes board. The palette and type scale live entirely in `src/app/globals.css`, so restyling means editing tokens rather than components.
- `POST /api/notes` now returns 401 without a session, 415 for a non-JSON content type, 400 for a malformed body, 413 for an oversized one, and 409 at the per-owner limit.
- Tests are colocated as siblings. `*.test.ts` runs in node and `*.test.tsx` in jsdom, so server modules never see a `window`.
- Biome forbids components from importing a feature's server layer.

### Fixed

- `pnpm typecheck` failed on a clean checkout. `src/env.ts` declared `PUBLIC_APP_URL` as a client variable without the `NEXT_PUBLIC_` prefix that `@t3-oss/env-nextjs` requires, which also meant the value would have been unreadable in the browser.
- `src/env.ts` was never imported, so environment validation never ran. `next.config.ts` now imports it and an invalid environment fails the build.
- `--font-sans` referenced itself in `globals.css`, so the loaded sans font was never applied and the browser default was used instead.
- `POST /api/notes` threw on a malformed body and returned a 500.
- The notes widget cleared the input after a failed save. It now keeps the text and reports why the save was refused.

### Security

- Upgraded `next` to 16.2.11, clearing eight advisories including a middleware bypass and two server-side request forgery paths.
- Pinned `postcss` and `sharp` forward through pnpm overrides, clearing the remaining transitive advisories. `pnpm audit --prod` reports none.
- Disabled `poweredByHeader`, so responses no longer advertise the framework.

## [0.1.0] - 2026-07-21

### Added

- Initial template: Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Biome, Vitest, next-themes, and a type-safe env module.

[Unreleased]: https://github.com/ygcarvalh/nextjs-template/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/ygcarvalh/nextjs-template/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/ygcarvalh/nextjs-template/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/ygcarvalh/nextjs-template/releases/tag/v0.1.0
