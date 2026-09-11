# Roadmap and deferred work

This repository arrived at `main` as two commits: the template as a whole, then the registration
flow. The build order that produced it is not in the history, so this file tracks the one thing the
history cannot: every item a review found and deliberately left for later instead of fixing on the
spot. `angular-template` and `fastapi-template` keep the same file for the same reason.

## Status

| Pass | Date | Result |
| --- | --- | --- |
| Audit and release | 2026-09-11 | Done, released as v1.0.0 |
| Dependencies and template flag | 2026-09-11 | Done, released as v1.1.0 |

The 2026-09-11 pass measured the gate on a fresh clone before touching anything: `pnpm verify`
green except for `next build` without `.env.local`, 70 spec files, 535 tests, 98.82% statements,
96.81% branches, 100% functions, 98.79% lines; `pnpm test:e2e` 28 passed in 1.8 minutes;
`pnpm audit --prod` failing on two critical advisories in `next` 16.2.12 and one high in `sharp`
0.35.3. It closed the audit, cleared six lint warnings, marked the active theme in both menus, moved
the loading label into the dictionaries, raised the coverage floor to one point under the measured
numbers, pinned pnpm 11 with `engine-strict`, added `cliff.toml`, and wrote the release section into
`CONTRIBUTING.md`. A second batch the same day, at the user's request, split `src/proxy.ts` into
`route-gate.ts`, `session-rotation.ts` and `lib/edge-request.ts`, narrowed the two swallowed cookie
writes in `api-client.ts` to the one error a render produces, split the preference hooks into one
file per concern, raised the TypeScript target to ES2022, and removed the 124 explanatory comments
the code carried; what they explained lives below and in the README. A third batch, after the tag,
replaced the deprecated `prom-client` with `@prometheus-io/client` (a drop-in: one import line
changed), moved every dependency to its latest release including TypeScript 7 and Vitest 5, and
marked the repository as a template on GitHub. The full `pnpm audit`, dev dependencies included,
came back clean after the bumps, so no override was needed for the twelve tooling findings.

## Standing debt, no pass assigned

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
## Settled facts later passes should not re-derive

**Vitest 5 no longer picks up matcher types from the `jest` namespace.** `@types/jest-axe`
augments `jest.Matchers` and `@jest/expect`, which Vitest 4 read through `globals: true` and Vitest
5 does not, so `toHaveNoViolations` became a type error in every axe test. `vitest.d.ts` at the
root declares the matcher on `Assertion` and `AsymmetricMatchersContaining`, the same shape
`@testing-library/jest-dom/vitest` uses for its own matchers. TypeScript 7.0.2 type-checks the
repository with no other change.

**A Playwright bump needs `pnpm exec playwright install chromium`.** The browser build is keyed to
the package version; after `@playwright/test` moves, the suite fails every spec in a few
milliseconds with `Executable doesn't exist` until the new build is downloaded.

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

**Why the code does what it does, formerly in comments.**

- `src/lib/api-client.ts` catches exactly one failure around `writeTokens` and `clearTokens`: the
  error Next raises when a render tries to modify cookies. The render still uses the new access
  token and the proxy persists the rotation on the next request. Anything else is rethrown.
- `src/lib/metrics.ts` keeps the prom-client registry on `globalThis` because a module can be
  evaluated more than once in development and prom-client throws on a duplicate metric name.
- `src/app/globals.css` declares `color-scheme` for both themes; without it the browser paints
  native controls from the system palette, which is how a dark page ends up with an unreadable
  select. `globals.test.ts` holds it.
- `src/features/preferences/components/preference-store.tsx` mirrors the locale cookie into
  `localStorage` so client code can read it without a cookie parser, and the e2e suite uses that
  write as its "a client effect has run" signal. A browser with storage blocked still has the
  cookie, which is why the write may fail quietly.
- `src/i18n/components/language-toggle.tsx` renders each language as a submit button inside a
  form: a click before hydration posts the Server Action and works with no JavaScript, and once
  hydrated the click handler wins because it can refresh the router.
- `src/features/requests/components/outcome-filter.tsx` owns its hidden input rather than using the
  Select's, because the submit has to carry the value just picked and the component's own input is
  one render behind at that point. Picking an outcome filters at once; the text fields keep a
  button because navigating on every keystroke would be worse.
- `src/features/requests/components/requests-pager.tsx` says Older and Newest rather than Previous
  and Next: a cursor walks one way and the way back is the top of the list.
- `src/features/auth/server/jwt-claims.ts` reads `exp` and never verifies: the API owns
  verification and the proxy only needs to know when to ask for a fresh pair.
- `src/features/auth/server/token-exchange.ts` posts the login as an OAuth2 password form, not
  JSON, because that is what the API's `/auth/login` accepts. Logout is best effort: the cookies go
  either way, and a token the API never heard of is no reason to keep a reader signed in.
- `src/features/auth/server/session.ts` caches the session per request because a layout and its
  page both ask and one render should cost one call.
- `src/features/preferences/server/preferences.ts` reads the account's preferences once, at
  sign-in, into cookies every render can read for free; an API that is down is not a reason to fail
  a page that only wanted to know which theme to paint.
- `src/hooks/use-hydrated.ts` exists because a form that submits through `fetch` cannot work before
  its island hydrates: the browser would post the form the plain way to a page path that answers no
  write. Anything gated on it stays visibly disabled until it can act.
- `src/features/auth/password-strength.ts` treats one repeated character and a walk up or down the
  keyboard the same way, since both leave every gap between neighbours identical. It is advisory:
  the form still submits whatever clears the API's floor.
- `src/components/toaster.test.tsx` queries the close control by its slot because Base UI keeps it
  out of the accessibility tree until the viewport is hovered or focused.
- `src/components/account-menu.test.tsx` disables axe's `region` rule because the popup is
  portalled to the body, outside every landmark, by design.
- `src/lib/logger.ts` loads `pino-pretty` only when `LOG_FORMAT=console` asks for it, because it is
  a dev dependency.
- `src/lib/request-id-server.ts` reads the id from async storage in a route handler and from the
  forwarded header in a server component or action, because only the first has a storage context.
- `src/lib/outcome.ts` puts a status of 0, a rejected fetch, on the error branch with 500: no
  answer at all is a failure, not a refusal.
- `e2e/global-teardown.ts` deactivates the account the run registered, because a database that
  outlives the suite otherwise fills with `e2e-*@example.com`.
- `e2e/signed-in/toast.spec.ts` injects the failure at the browser's own route handler, the one hop
  it owns, because the API is not made to fail on demand.
