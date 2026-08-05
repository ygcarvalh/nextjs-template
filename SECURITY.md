# Security

## Reporting a vulnerability

Open a private security advisory through GitHub rather than a public issue.

## What this template does

- **Dependencies.** `pnpm audit --prod` reports no advisories, and CI fails on
  anything moderate or worse. `postcss` and `sharp` are pinned forward in
  `pnpm-workspace.yaml` because the versions Next depends on carry open
  advisories.
- **Headers.** Every response carries a CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a
  `Permissions-Policy`. `poweredByHeader` is off. They are defined once in
  `src/lib/security-headers.ts` and asserted in a test.
- **Sessions.** The cookie is HMAC signed with Web Crypto, `httpOnly`,
  `sameSite=lax`, and carries an expiry that is checked on every read.
- **Authorization.** Middleware redirects anonymous visitors, but it is not the
  boundary. `(protected)/layout.tsx` and the notes route handler both re-check
  the session, so a middleware bypass still renders and returns nothing.
- **Input.** Request bodies are size capped, content-type checked, and parsed
  through zod. A malformed body is a 400 rather than an unhandled 500.
- **Redirects.** The `?next=` parameter is filtered so only same-origin absolute
  paths survive. Protocol-relative, backslash-smuggled, and control-character
  payloads all fall back to a safe path.

## What you must change before deploying

**`src/features/auth/server/cookie-session.ts` is a development adapter.** It
authenticates one seeded account from `AUTH_DEMO_EMAIL` and
`AUTH_DEMO_PASSWORD` and stores no users. The signing and verification are real,
but the account is not. Replace this file with an identity provider. Nothing
outside it imports an implementation, so the change is contained.

Then check the following:

- **`SESSION_SECRET`.** Generate one per environment with
  `openssl rand -base64 32`. The value in `.env.example` is a placeholder.
- **`NEXT_PUBLIC_APP_URL`.** Set it to your real `https://` origin. The session
  cookie takes its `Secure` flag and `__Host-` prefix from this value, and the
  CSP only sends `upgrade-insecure-requests` when it is an https URL. Leaving it
  as an http URL in production means a cookie without `Secure`.
- **Rate limiting.** `src/lib/rate-limit.ts` counts in process memory, so behind
  more than one instance the effective limit multiplies by the instance count.
  Put a shared store behind the same interface before relying on it.
- **The notes store.** `createInMemoryNotesRepository` keeps everything in a
  process-local array. It is a demonstration of the port, not a database.
- **CSP `script-src`.** The policy allows `'unsafe-inline'` because Next injects
  inline bootstrap scripts. Tightening it means generating a per-request nonce in
  middleware and threading it through.
