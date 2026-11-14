# Security review and remediation

- **Reviewed:** `main` @ `90510ca` (2026-11-14)
- **Fixed on branch:** `security-hardening`
- **Related:** [`database-roles.md`](./database-roles.md), [`../reviews/catalog-database-review.md`](../reviews/catalog-database-review.md)

## Results

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | `@better-auth/cli` bundled old copies of `better-auth` (1.4.22, critical advisories), `drizzle-orm` (0.41, SQL injection through identifiers) and `lodash` (high) | High (dev tools) | ✅ Replaced with the `auth` CLI 1.7.23. Critical and high advisories went from 1 and 7 to **0** |
| 2 | No HTTP security headers; `X-Powered-By` sent | Medium | ✅ CSP (`frame-ancestors`, `base-uri`, `form-action`, `object-src`), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and HSTS on every route; `poweredByHeader: false` |
| 3 | Any `/products/<slug>` triggered a DB query and a cache entry | Medium | ✅ `isValidSlug()` (lowercase, hyphenated, ≤80 chars) runs before the cached query in the page and inside the queries. Unknown slugs now return a real **HTTP 404** |
| 4 | The app connects to the DB with the owner role | Medium | 🟡 Code ready: migrations and seed use `DATABASE_URL_ADMIN` when set. **You still need to** create a restricted role in Neon ([guide](./database-roles.md)) and add `DATABASE_URL_ADMIN` to `.env.example`, which tool permissions blocked me from editing |
| 5 | The seed overwrites data and has no guard | Medium | ✅ Refuses in production; asks you to type `seed` (showing the target host), or needs `ALLOW_SEED=1` when non-interactive |
| 6 | `BETTER_AUTH_SECRET` unset; trusted origins not explicit | Medium | ✅ Explicit `secret`, `baseURL` and `trustedOrigins`. Production refuses to serve auth without a 32+ character secret and `BETTER_AUTH_URL` (skipped during `next build`). **You still need to** set the secret with `npx auth secret` |
| 7 | Auth rate-limit counts kept in each server's memory | Low | ✅ `rateLimit.storage: "database"`, with stricter rules for sign-in, sign-up and password reset. **Needs** migration `0001_auth` applied |
| 8 | `auth.ts` not protected from client imports | Low | ✅ An ESLint `no-restricted-imports` rule blocks `@/db`, `@/lib/auth` and `@/lib/queries` in `src/components/**`. `server-only` can't be used in `auth.ts`, because the Better Auth CLI refuses to load configs that import it |
| 9 | Empty or invalid image `src` crashed pages | Low | ✅ `safeImages()` keeps only allowed Unsplash photo URLs and falls back to `/placeholder-product.svg` |
| 10 | Dev-tool advisories (esbuild through drizzle-kit, typescript-eslint/minimatch) | Low | ⏸ Accepted. No upstream fix yet: latest `drizzle-kit` 0.31.11 and `typescript-eslint` 8.72.2 are still affected. Dev-only, never shipped. Don't run `npm audit fix --force`, which would downgrade drizzle-kit to 0.18 |
| 11 | `better-auth` patch update | Info | ✅ 1.7.18 → 1.7.23 |
| 12 | Future cart and checkout must re-check price and stock on the server | Info | 📝 Design note, below |
| 13 | Image optimizer allowed all of `images.unsplash.com` | Info | ✅ Limited to `pathname: "/photo-**"` |
| 14 | Any explicitly set `BETTER_AUTH_SECRET` was accepted (only length checked, only in production). Better Auth itself just **warns** about short or low-entropy secrets, and also reads `AUTH_SECRET` and the `BETTER_AUTH_SECRETS` rotation list. The secret signs HS256 tokens (email verification), signed cookies and OAuth state, so a guessable one allows forgery | High | ✅ `src/lib/auth-secret.ts` rejects secrets that are short, the default, placeholder or dictionary values, keyboard walks, repetitive, sequential or low-entropy (<128 bits). It checks `BETTER_AUTH_SECRET`, `AUTH_SECRET` and **every** `BETTER_AUTH_SECRETS` version, in all environments including `next build`, and never prints the secret. Tested: 0 false positives in 60,000 generated secrets, 15/15 weak values rejected |

## Verification (production build, `next start`)

- Every response sends the six security headers, and `X-Powered-By` is absent.
- `/`, `/products/tailored-wool-suit`, `/products/brushed-cotton-shirt` and `/products/top-handle-bag` return 200. In Chrome, all images load with no script errors.
- `/products/does-not-exist`, an SQL-injection-style slug, a 200-character slug and `/products/UPPER_case` all return **404** with the not-found page and `noindex`.
- Image optimizer: an allowed photo returns 200. A non-`/photo-` path, another host and quality 100 each return 400.
- `/api/auth/ok` without a secret returns 500 with `BETTER_AUTH_SECRET must be set…`, so it fails closed.
- `npm audit`: 0 critical, 0 high, 11 moderate (all dev-only, item 10).
- `npm run typecheck` and `npm run lint` are clean. A probe component importing `@/db` or `@/lib/auth` fails lint.
- Secret strength:
  - A build with `BETTER_AUTH_SECRET=passwordpassword…` **fails** with "too weak".
  - At runtime a weak secret makes `/api/auth/*` return 500 while the shop pages still return 200, and the value never appears in the response or the logs.
  - A generated secret is accepted. Auth then needs the `rate_limit` table, which arrives with migration `0001_auth`.
- `npm run db:seed` run non-interactively without `ALLOW_SEED` refuses before touching the DB.

## Remaining actions for you
1. Set `BETTER_AUTH_SECRET`: `npx auth secret`, then add it to `.env.local` and the host's environment.
2. Apply migration `0001_auth` (Better Auth tables plus `rate_limit`) with `npm run db:migrate`.
3. Create the least-privilege role ([guide](./database-roles.md)) and split `DATABASE_URL` / `DATABASE_URL_ADMIN`.
4. Add `DATABASE_URL_ADMIN=` (optional) to `.env.example`.

## Design notes for the cart and checkout (item 12)
- Recalculate price and stock on the server; never trust a price or quantity sent from the browser.
- Decrement stock with a guarded update, such as `UPDATE product_stock SET quantity = quantity - $n WHERE id = $id AND quantity >= $n`, and treat 0 updated rows as "sold out".
- Call `revalidateTag("product:<slug>")` after each stock change.
- Give server actions and route handlers input validation (e.g. zod) and rate limits. Validate the newsletter form on the server too.

## OWASP Top 10 and common-vulnerability pass (round 3)

### Fixed

| # | Finding | Fix |
|---|---|---|
| 15 | **Newsletter form leaked email addresses into URLs.** It had no `method` or `action`, only a JS `onSubmit`, so before hydration, with JS blocked or after a script error, the browser sent `GET /?email=…`. The address then reached the address bar, history, server and proxy logs, and the `Referer` header. Reproduced: `GET http://localhost:3100/?email=jane.doe%40example.com` | The form posts to a Server Action (`src/app/actions/newsletter.ts`) through `useActionState`, so it submits as **POST** with or without JS. Verified with JS disabled: `POST /`, the URL stays clean and the confirmation shows |
| 16 | Newsletter input was only validated in the browser | Server-side `parseEmail()` (`src/lib/validation.ts`): length-capped before any regex, rejects header injection (newline + `Bcc:`), quotes, angle brackets and `..`. 16/16 malicious inputs rejected; ReDoS probes take ≤0.03 ms, even at 1 MB |
| 17 | Newsletter had no abuse protection | Per-IP rate limit (5 per 10 min) with a memory-bounded store (`src/lib/rate-limit.ts`), a shared fallback bucket when no trusted IP exists, a honeypot field, and a 16 kb Server Action body limit |
| 18 | Newsletter responses could enable enumeration or reflection | One generic success message for every valid address. Input is never echoed back |
| 19 | **Better Auth rate limiting could become a sign-in lockout.** With no resolvable client IP, it falls back to one shared bucket (`rate-limiter/index.mjs:245`), so a single attacker could block sign-in for everyone. Default `x-forwarded-for` is also client-spoofable | `TRUSTED_IP_HEADERS` (e.g. `x-real-ip` on Vercel, `cf-connecting-ip` on Cloudflare) feeds both Better Auth's `ipAddressHeaders` and the newsletter limiter (`src/lib/client-ip.ts`). Only single, well-formed IPs are trusted, and production refuses to serve auth without it |
| 20 | **Account enumeration at sign-up.** Better Auth answers `USER_ALREADY_EXISTS` unless verification is required (`sign-up.mjs:155,210`) | Email/password is pre-configured (still `enabled: false`) with `requireEmailVerification`, `autoSignIn: false`, 12–128 character passwords, 30-minute reset tokens and `revokeSessionsOnPasswordReset` |
| 21 | Session-hijacking hardening | `useSecureCookies` in production (Secure + `__Secure-` prefix, on top of the HttpOnly/SameSite=Lax defaults), 7-day sessions refreshed daily, `freshAge` 10 min for sensitive actions, and CSRF/origin checks left on |
| 22 | CSP covered framing only | Full policy: `default-src 'self'`, scripts from self only (+ SRI hashes on every Next.js chunk), `script-src-attr 'none'`, `object-src`/`frame-src 'none'`, `base-uri`/`form-action 'self'`, `frame-ancestors 'none'`, and `upgrade-insecure-requests` on HTTPS. Added `Cross-Origin-Opener-Policy` and `Cross-Origin-Resource-Policy: same-origin` |

### Verified (production build, browser and crafted requests)
- **CSRF:** a page on another origin that auto-submits a copy of the form is aborted ("origin … does not match … Aborting the action"), as are replays with `Origin: https://evil.example` and `Origin: null`. Same-origin submissions work.
- **DoS:** a 60 KB body returns 413 ("Body exceeded 16kb limit"). The 6th newsletter attempt from one IP is limited, and other visitors are unaffected.
- **XSS:** an `<img onerror>` payload in the email field is rejected, and `?email=<script>` / `?q="><svg onload>` are never reflected. 0 CSP violations and 0 page errors with hydration working.
- **Clickjacking:** `frame-ancestors 'none'` + `X-Frame-Options: DENY`.
- **Host header:** `Host: evil.example` is never echoed. PUT/DELETE/PATCH/TRACE return 405.
- **Secrets:** no DB URL or secret appears in `.next/static` client bundles.

### Accepted / not applicable

| Item | Reason |
|---|---|
| `script-src 'unsafe-inline'` | The App Router streams page data in inline scripts. A fully strict CSP needs per-request nonces (Next's CSP guide), which force dynamic rendering of every page and lose the static/cached catalog. Risk is low: React escapes all output and there is no `dangerouslySetInnerHTML`. Revisit if the site renders user HTML |
| Trusted Types (`require-trusted-types-for 'script'`) | Tested: it breaks Next.js' chunk loader (`TrustedScriptURL` assignment), so it's not enabled |
| Newsletter persistence and double opt-in | No email provider yet. The action is the integration point and its comments describe the double opt-in requirement |
| Per-instance newsletter rate limiting | Fine for a no-op form. Move to a shared store (DB or Redis) when it writes data or sends email |
| A09 Logging & monitoring | No security event logging or alerting yet. Add it with the auth flows (failed sign-ins, rate-limit hits, CSP reports) |

### OWASP Top 10 (2021) status

| Category | Status |
|---|---|
| A01 Broken Access Control | No protected data yet. Server Actions must verify auth themselves when added (see `CLAUDE.md`) |
| A02 Cryptographic Failures | Secret strength enforced, HSTS, Secure cookies in production, TLS to Neon |
| A03 Injection | Drizzle parameterises every query (no raw SQL in request paths). React output escaping + CSP. Email header injection rejected |
| A04 Insecure Design | Enumeration-safe responses, rate limits, honeypot. Price and stock re-checks are required at checkout (design notes above) |
| A05 Security Misconfiguration | Security headers, CSP, COOP/CORP, no `X-Powered-By`, body limit, image allowlist |
| A06 Vulnerable Components | `npm audit`: 0 critical / 0 high (11 moderate, dev-only, no upstream fix) |
| A07 Identification & Authentication Failures | Password policy, verification-gated sign-up, session lifetimes and revocation, IP-keyed rate limits |
| A08 Software & Data Integrity | SRI on all Next.js script chunks, committed lockfile |
| A09 Logging & Monitoring | Not yet implemented (see above) |
| A10 SSRF | No server-side fetching of user-supplied URLs. Image optimizer limited to Unsplash `/photo-` paths |

### New action for you
- Set `TRUSTED_IP_HEADERS` on the host (and in `.env.example`, which tool permissions block me from editing): `x-real-ip` on Vercel, `cf-connecting-ip` behind Cloudflare, or the header your proxy overwrites.
