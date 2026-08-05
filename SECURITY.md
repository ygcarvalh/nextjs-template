# Security

## Reporting a vulnerability

Open a private security advisory through GitHub rather than a public issue.

## What the template already does

`pnpm audit --prod` reports no advisories, and CI fails the build on anything moderate or worse. `postcss` and `sharp` are pinned forward in `pnpm-workspace.yaml`, since the versions Next depends on carry open advisories.

Every response carries a CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, a `Referrer-Policy`, and a `Permissions-Policy`. `poweredByHeader` is off, so responses no longer name the framework. All six headers are defined once in `src/lib/security-headers.ts` and asserted in a test, so dropping one fails the suite.

The session cookie is HMAC signed with Web Crypto, `httpOnly`, `sameSite=lax`, and carries an expiry that is checked on every read. Middleware redirects anonymous visitors, but it is not the authorization boundary: `(protected)/layout.tsx` and the notes route handler both check the session again, so a bypass at the middleware layer still renders and returns nothing.

Request bodies are size capped, content-type checked, and parsed through zod, so a malformed body produces a 400 instead of an unhandled 500. The `?next=` parameter is filtered down to same-origin absolute paths. Protocol-relative, backslash-smuggled, and control-character payloads all fall back to a safe path.

## What you must change before deploying

`src/features/auth/server/cookie-session.ts` is a development adapter. It authenticates one seeded account from `AUTH_DEMO_EMAIL` and `AUTH_DEMO_PASSWORD` and stores no users. The signing and verification are real, but the account is not. Replace this file with an identity provider. Nothing outside it imports an implementation, so the change stays contained.

Then work through the following:

- Generate a real `SESSION_SECRET` for each environment with `openssl rand -base64 32`. The value in `.env.example` is a placeholder.
- Point `NEXT_PUBLIC_APP_URL` at your actual https origin. The session cookie takes its `Secure` flag and `__Host-` prefix from that value, and the CSP only sends `upgrade-insecure-requests` when it is an https URL. Leave it as an http URL in production and you ship a cookie without `Secure`.
- Put a shared store behind `src/lib/rate-limit.ts` before you rely on it. It counts in process memory, so behind more than one instance the effective limit multiplies by the instance count.
- Replace `createInMemoryNotesRepository`. It holds everything in a process-local array and exists to show what the port is for.
- Decide what to do about `'unsafe-inline'` on `script-src`. The policy allows it because Next injects inline bootstrap scripts. Tightening it means generating a per-request nonce in middleware and threading it through.
