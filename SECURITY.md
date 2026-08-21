# Security

## Reporting a vulnerability

Open a private security advisory through GitHub rather than a public issue.

## What the template already does

`pnpm audit --prod` reports no advisories, and CI fails the build on anything moderate or worse. `postcss` and `sharp` are pinned forward in `pnpm-workspace.yaml`, since the versions Next depends on carry open advisories.

Every response carries a CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, and a `Permissions-Policy`. `poweredByHeader` is off, so responses no longer name the framework. All six headers are defined once in `src/lib/security-headers.ts` and asserted in a test, so dropping one fails the suite.

Tokens never reach the browser. The access and refresh tokens the API mints are stored as `httpOnly`, `sameSite=lax` cookies, `Secure` and `__Host-` prefixed on an https origin, and only server code reads them. `src/proxy.ts` redirects anonymous visitors on cookie presence alone, which is not the authorization boundary: `(protected)/layout.tsx` asks the API who the caller is, and the API verifies the token on every call, so a bypass at the proxy layer still renders and returns nothing.

The gate denies by default. Everything not named in `PUBLIC_PAGES` or `PUBLIC_API` requires a session, so a route added later is protected until someone deliberately opens it.

Signing out revokes rather than forgets. The refresh token is posted to `POST /auth/logout`, which marks its row on the API revoked, so a token copied out of this browser beforehand stops working too. Changing a password revokes every session the account has. Access tokens already issued still live out their 30 minutes, which is the remaining window.

An inbound `x-request-id` is filtered before it reaches a log line or a cookie. `src/lib/request-id.ts` accepts at most 64 characters of `[A-Za-z0-9_-]` and mints a fresh ID for anything else, because the header is caller-controlled: a newline in it would let that caller write forged entries into the log stream, and the value is echoed back in a response header and a readable cookie.

Request logs record metadata only. Both the edge line in `src/proxy.ts` and the route line in `src/lib/with-route-logging.ts` carry method, path, status, duration, client IP, and correlation ID. Bodies, query values, headers, and cookies never reach either one, so the template ships no redaction list and does not need one.

The `x-request-id` cookie is deliberately readable by scripts. It holds nothing but an opaque per-request identifier, which the client error boundary reads to show the user a reference they can quote. Marking it `httpOnly` would defeat its only purpose; it grants no access and carries no session state.

The account endpoints act on the caller and only on the caller. `PATCH /api/account` and `POST /api/account/password` take no identifier: they check the session, then call `/users/me` and `/auth/password` on the API, which resolves the account from the bearer token. There is nothing in either body for a caller to point at somebody else's row. What comes back on a refusal is the API's own sentence plus the correlation id, never the submitted values.

Request bodies are size capped, content-type checked, and parsed through zod, so a malformed body produces a 400 instead of an unhandled 500. The `?next=` parameter is filtered down to same-origin absolute paths. Protocol-relative, backslash-smuggled, and control-character payloads all fall back to a safe path.

## What you must change before deploying

`src/features/auth/server/api-session.ts` is the adapter that ships. It holds no users and verifies no passwords: the sibling `fastapi-template` does both, and this file only exchanges credentials for tokens and asks who the caller is. Replace it with another identity provider if you have one; nothing outside it imports an implementation, so the change stays contained.

Then work through the following:

- Point `API_URL` at the environment's own API. There is no secret to generate on this side any more: the API signs the tokens, and this app only carries them.
- Point `NEXT_PUBLIC_APP_URL` at your actual https origin. The session cookie takes its `Secure` flag and `__Host-` prefix from that value, and the CSP only sends `upgrade-insecure-requests` when it is an https URL. Leave it as an http URL in production and you ship a cookie without `Secure`.
- Put a shared store behind `src/lib/rate-limit.ts` before you rely on it. It counts in process memory, so behind more than one instance the effective limit multiplies by the instance count.
- Replace `createInMemoryNotesRepository`. It holds everything in a process-local array and exists to show what the port is for.
- Decide what to do about `'unsafe-inline'` on `script-src`. The policy allows it because Next injects inline bootstrap scripts. Tightening it means generating a per-request nonce in `src/proxy.ts` and threading it through.
- Keep `connect-src 'self'`. The browser talks only to this app, and every call to the API is made server-side; a page that fetched the API directly would need the origin allowed here and a token in the browser, which is the arrangement this template exists to avoid.
- A correlation id is shown to whoever hit the failure, and that is deliberate: it identifies a request in your logs and grants nothing. Turn it off per account in settings if a screenshot with an id in it worries you.
