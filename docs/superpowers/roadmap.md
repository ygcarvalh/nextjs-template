# Roadmap and deferred work

This repository arrived at `main` as two commits: the template as a whole, then the registration
flow. The build order that produced it is not in the history, so this file tracks the one thing the
history cannot: every item a review found and deliberately left for later instead of fixing on the
spot. `angular-template` and `fastapi-template` keep the same file for the same reason.

## Status

| Pass | Date | Result |
| --- | --- | --- |
| Audit and release | 2026-09-11 | Done, released as v1.0.0 |

The 2026-09-11 pass measured the gate on a fresh clone before touching anything: `pnpm verify`
green except for `next build` without `.env.local`, 70 spec files, 535 tests, 98.82% statements,
96.81% branches, 100% functions, 98.79% lines; `pnpm test:e2e` 28 passed in 1.8 minutes;
`pnpm audit --prod` failing on two critical advisories in `next` 16.2.12 and one high in `sharp`
0.35.3. It closed the audit, cleared six lint warnings, marked the active theme in both menus, moved
the loading label into the dictionaries, raised the coverage floor to one point under the measured
numbers, pinned pnpm 11 with `engine-strict`, added `cliff.toml`, and wrote the release section into
`CONTRIBUTING.md`.

## Standing debt, no pass assigned

- **`prom-client` is deprecated upstream.** The registry marks 15.1.3 as replaced by
  `@prometheus-io/client`. `src/lib/metrics.ts` and `src/app/api/metrics/route.ts` are the only
  importers. It is a dependency change and waits for a yes.
- **`pnpm audit` without `--prod` reports twelve findings.** On 2026-09-11: `fast-uri` and `js-yaml`
  (high), `hono`, `qs` and `vitest` (moderate), all reached through the shadcn CLI, Vitest and their
  parsers. None of them ships. `pnpm audit --prod --audit-level moderate` is clean, and that is the
  command the gate and the landing page's ledger claim. Overrides in `pnpm-workspace.yaml` would
  silence them; each is a dependency change.
- **Dependencies were left where the initial commit pinned them, apart from the three security
  bumps.** Outdated on 2026-09-11: `@base-ui/react` 1.6.0 to 1.8.0, `lucide-react` 1.28 to 1.44,
  `react` and `react-dom` 19.2.8 to 19.3.0, `zod` 4.4.3 to 4.6.1, `@biomejs/biome` 2.5.6 to
  2.5.13, `@playwright/test` 1.62.1 to 1.63.0, `shadcn` 4.16 to 4.21, and majors for `typescript`
  (7), `vitest` and `@vitest/coverage-v8` (5). Dependabot groups the routine ones weekly.
- **`src/proxy.ts` carries five jobs.** Request logging, two rate limiters, the token refresh, the
  session gate and the signed-out-only redirect all live in one file, because the proxy is the only
  layer that can write a cookie and rewrite the forwarded `cookie` header at once. It is the file
  that grows with every new public path. When it does, `gate.ts` and `refresh.ts` under
  `src/features/auth/server/` are the extraction, and `src/proxy.test.ts` already exercises both
  halves separately.
- **`src/lib/api-client.ts` swallows two failures on purpose.** A server component cannot write or
  clear a cookie, so `persist` and the refused-refresh branch catch and continue; the proxy repeats
  the write on the next request. Both `catch` blocks carry the explanation in a comment, which is the
  one place this repository prefers a comment to a name. A `canWriteCookies()` probe would make the
  branch explicit and remove both comments.
- **`tsconfig.json` targets ES2017.** It is what `create-next-app` writes. Node 22 and every browser
  the CSP is written for run ES2022, and the lower target costs downlevelled `async` and class
  fields in the client bundle. Raising it changes the build output and waits for a measurement.
- **The root failure screen is English only.** `src/app/global-error.tsx` renders when the root
  layout itself throws, before any provider exists, so no dictionary can reach it. It is the one
  deliberate exception to the rule that every visible string lives in both dictionaries. The
  `loading.tsx` label moved into the dictionaries in the 2026-09-11 pass because `loading.tsx`
  renders inside the layout and can await `getDictionary()`.
- **`pnpm verify` fails on a fresh clone until `.env.local` exists.** `src/env.ts` has no default
  for `API_URL` because an unset one is meant to fail a build rather than production, and the build
  step of `verify` imports it. `README.md` and `CONTRIBUTING.md` say so; the alternative is a
  `verify` that exports a placeholder, which would hide exactly the failure the validation exists
  to surface.
- **The code carries explanatory comments.** About a hundred, most of them the "why" behind a
  non-obvious branch. The house rule for new code is self-documenting names and no comments;
  existing ones stay until the code around them is touched for another reason.
- **The repository is not marked as a template on GitHub.** `gh repo edit --template` is a remote
  write and waits for a yes.

## Settled facts later passes should not re-derive

**The landing page's ledger is held to the config by a test.** `src/features/verification/gates.ts`
declares the coverage floor, the browser-flow count and the header count; `gates.test.ts` reads
`vitest.config.ts`, counts `test(` in `e2e/**/*.spec.ts` and measures `securityHeaders`, and fails
when any claim drifts. Raising a threshold or adding a spec therefore means editing `gates.ts` in
the same commit; the 2026-09-11 pass hit exactly that when the floor moved from 95 to 97.

**A `vi.mock` factory cannot reference a top-level import.** The call is hoisted above the imports,
so a factory that closes over `ptBR` throws `Cannot access '__vi_import_2__' before
initialization`. The form that works is an async factory that imports the module itself:
`vi.mock("@/i18n/server", async () => { const { ptBR } = await import(...); return {...}; })`.
`src/app/loading.test.tsx` is the example.

**The test extension picks the runtime, and the split is load bearing.** `*.test.ts` runs in node,
`*.test.tsx` in jsdom. `@t3-oss/env-nextjs` decides whether server variables are readable by looking
for a `window`, so a server module tested under jsdom refuses to hand over `API_URL`. A component
test that needs a server module mocks it rather than importing it.

**`aria-current` on a menu item marks the active choice without a second icon.** Both the account
menu and the theme toggle read `useCurrentTheme()`, which is `parseTheme(useTheme().theme)`, and set
`aria-current="true"` on the matching item. `next-themes` reports `undefined` until it has mounted,
so no item is marked during the first render and nothing mismatches on hydration; the menu content
is only rendered once open, which is always after mount.

**Server Action or route handler is decided by what the reply is for.** A Server Action when the
answer is a navigation, a redirect or fresh data the route has to show; a route handler when the form
only needs to know whether the write worked, because every action reply re-renders the route and a
route that reads the API three times keeps the button on "Saving" past the answer. The profile and
password forms in `/settings` are the route-handler case and keep their submit disabled until
`useHydrated` flips.

**Server Actions are not rate limited at the proxy.** A 429 is not a response React can read from an
action, so the form would stay pending forever. `src/proxy.ts` throttles gated API paths and the two
credential POSTs; everything worth throttling beyond that is throttled by the API, which can answer
with a message.

**The browser suite runs on one worker for the API's sake.** `POST /auth/login` and `/auth/refresh`
are capped at ten a minute per IP and registration at five, and the suite registers one account per
run and deactivates it on the way out. A `429` from `global-setup.ts` is that limit, and the error
says so. `e2e/support.ts` retries a submit until its outcome appears because React hydrates island
by island and a click that lands first does nothing.

**The direct `document.cookie` assignments in tests are deliberate.** Biome's `noDocumentCookie`
prefers the Cookie Store API, which jsdom does not implement. `biome.json` turns the rule off for
`**/*.test.tsx` and nowhere else; `src/lib/request.test.tsx` seeds the jar that way to exercise the
page-cookie fallback for the correlation id.
