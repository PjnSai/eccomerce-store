# eCommerce Store

Next.js (App Router) + TypeScript + Tailwind CSS + Better Auth + Drizzle ORM + Neon Postgres.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL and BETTER_AUTH_SECRET
npm run db:migrate           # create the catalog tables (drizzle/0000_catalog.sql)
npm run db:seed              # load the sample catalog
npm run dev
```

## Structure

- `src/db/index.ts` — Drizzle client (Neon HTTP driver)
- `src/db/schema.ts` — Better Auth tables (generated; overwritten by `auth:generate`)
- `src/db/catalog-schema.ts` — categories, products, per-size stock
- `src/lib/queries.ts` — cached catalog reads used by pages
- `src/lib/auth.ts` — Better Auth server instance (Drizzle adapter)
- `src/lib/auth-client.ts` — Better Auth React client
- `src/app/api/auth/[...all]/route.ts` — Better Auth route handler
- `drizzle.config.ts` — drizzle-kit config (reads `.env.local`)

## Scripts

`dev`, `build`, `start`, `lint`, `typecheck`, `db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`, `auth:generate`
