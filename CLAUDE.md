# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Stack

Next.js 16 (App Router, `src/` dir, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Better Auth · Drizzle ORM · Neon Postgres. Package manager is npm. Path alias `@/*` → `src/*`.

Next.js 16 has breaking changes from older versions — read the relevant guide in `node_modules/next/dist/docs/` before using Next APIs you're unsure of.

## Commands

```bash
npm run dev            # dev server (http://localhost:3000)
npm run build          # production build — needs a migrated + seeded DB (see below)
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run auth:generate  # Better Auth CLI (`auth` package): overwrites src/db/schema.ts
npm run db:generate    # drizzle-kit: create SQL migration in drizzle/
npm run db:migrate     # apply migrations
npm run db:push        # push schema directly (no migration files)
npm run db:studio      # Drizzle Studio
npm run db:seed        # load SAMPLE catalog; destructive for seeded rows, asks to confirm (ALLOW_SEED=1 non-interactive)
```

No test framework is set up yet.

## Architecture

- **Database** — `src/db/index.ts` exports `db`, a Drizzle client over the Neon HTTP driver (`drizzle-orm/neon-http`), typed with everything exported from `src/db/schema.ts` (auth) and `src/db/catalog-schema.ts` (catalog). It throws at import time when `DATABASE_URL` is unset, so anything importing `db` (including `next build`) needs that env var.
- **Auth** — `src/lib/auth.ts` is the Better Auth server instance using the Drizzle adapter (`provider: "pg"`). It's mounted at `/api/auth/*` by `src/app/api/auth/[...all]/route.ts` via `toNextJsHandler`. `src/lib/auth-client.ts` exports the React client (`authClient`). Keep `nextCookies()` as the last entry in `plugins` so server actions can set cookies.
- **Schema flow** — Better Auth tables are generated, not hand-written: after changing auth config (plugins, fields), run `npm run auth:generate`, then `db:generate` + `db:migrate` (or `db:push`). The generator **overwrites** `src/db/schema.ts`, so app tables live in `src/db/catalog-schema.ts` (both are listed in `drizzle.config.ts`). Use versioned migrations (`db:generate` + `db:migrate`) and commit `drizzle/`.
- **Catalog** — `categories` 1→n `products` 1→n `product_stock` (one row per size). Prices are integer cents; product images are an ordered `jsonb` array (first = main image). Pages read through `src/lib/queries.ts` (server-only), which maps rows to the `Product`/`Category` types in `src/lib/catalog.ts`. `catalog.ts` holds only types and pure helpers because client components import it — never import `db` there. Static marketing copy (nav, hero, editorial) lives in `src/lib/content.ts`.
- **Caching** — `cacheComponents` is on, so every DB read in `queries.ts` uses `"use cache"` + `cacheLife` + `cacheTag("products" | "categories" | "product:<slug>")`; call `revalidateTag` after writes. `generateStaticParams` for `/products/[slug]` must return at least one slug, so the DB must be seeded before `next build`.
- **Config/env** — `drizzle.config.ts` loads `.env.local` via dotenv; Next.js loads it automatically. Required vars are listed in `.env.example`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`. Optional `DATABASE_URL_ADMIN` is used by drizzle-kit and the seed (owner role), so `DATABASE_URL` can be least-privilege — see `docs/security/database-roles.md`.
- **Security rules** — see `docs/security/security-review.md`.
  - Security headers live in `next.config.ts` (`headers()`).
  - Validate route params before cached queries (`isValidSlug` in `queries.ts`): cached function args become cache keys.
  - Images must match `images.remotePatterns`; `safeImages()` in `queries.ts` enforces the same prefix.
  - Components in `src/components/**` must not import `@/db`, `@/lib/auth` or `@/lib/queries` (ESLint `no-restricted-imports`).
  - Don't add `import "server-only"` to `src/lib/auth.ts` (the Better Auth CLI refuses it) or `src/db/index.ts` (the `tsx` seed imports it).
  - Every configured auth secret (`BETTER_AUTH_SECRET`, `AUTH_SECRET`, each `BETTER_AUTH_SECRETS` version) must pass `validateAuthSecrets` in `src/lib/auth-secret.ts`, in every environment including `next build`. Generate secrets with `npx auth secret`. Production also requires a secret and `BETTER_AUTH_URL`.
  - Auth rate limiting uses `storage: "database"` (`rate_limit` table).
  - Forms must POST: use a Server Action (`<form action={...}>`), never a JS-only `onSubmit` without `method`/`action` (a GET fallback leaks fields into the URL). Validate every field server-side (`src/lib/validation.ts`), rate-limit (`src/lib/rate-limit.ts`, keyed by `clientIp()` from `src/lib/client-ip.ts`), and return enumeration-safe, non-reflecting responses. Server Actions must check auth themselves.
  - Client IPs come only from `TRUSTED_IP_HEADERS` (required in production for auth). Never read `x-forwarded-for` directly.
  - The CSP in `next.config.ts` allows scripts from `'self'` only (+ `'unsafe-inline'` for App Router payloads, SRI on chunks). Don't add third-party script/connect origins casually. Trusted Types break Next.js.
