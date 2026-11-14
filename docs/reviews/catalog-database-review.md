# Review: storefront build and catalog database

- **Date:** 2026-11-14
- **Scope:** everything since the initial `create-next-app` commit: setup, design system, homepage, product page and the catalog database. As of this review, nothing was committed.
- **Plan:** [`docs/plans/catalog-database.md`](../plans/catalog-database.md)

Tick each item once it has been reviewed or resolved.

## What changed

1. **Setup** (`package.json`, `next.config.ts`, `drizzle.config.ts`, `.env.example`, `src/lib/auth*.ts`, `src/app/api/auth/[...all]/route.ts`):
   - Next.js 16, Tailwind v4, Better Auth, Drizzle and Neon, plus `tsx` and `server-only`.
   - New npm scripts: `db:*`, `auth:generate` and `typecheck`.
   - `next.config.ts` allows images from `images.unsplash.com` and sets `qualities: [75]`, which Next 16 requires.
2. **Design system** (`src/app/globals.css`, `src/app/layout.tsx`): colour, type, spacing and container tokens, plus classes like `btn-*`, `link-*`, `grid-products`, `media`, `product-meta` and `field`. It uses one font, Inter Tight, in one weight.
3. **Storefront UI** (`src/components/**`, `src/app/page.tsx`, `src/app/products/[slug]/page.tsx`, `src/app/not-found.tsx`): the header (transparent over the hero, with a mobile menu), footer, homepage sections, product cards with stock badges, and the product page with gallery, size picker, stock status, detail sections and related products.
4. **Catalog database:**
   - `src/db/catalog-schema.ts` and `drizzle/0000_catalog.sql`.
   - Cached reads in `src/lib/queries.ts`.
   - Types and helpers in `src/lib/catalog.ts`, and marketing copy in `src/lib/content.ts`.
   - Seed in `src/db/seed-data.ts` and `src/db/seed.ts`.

## High: affects real data or users

- [ ] **1. Product data and stock can be up to an hour out of date.**
  - Every query uses `cacheLife("hours")`, and pages are pre-built. Editing stock in Drizzle Studio won't show until the cache expires or you rebuild.
  - Before real orders change stock, the order code must call `revalidateTag("product:<slug>")` or `revalidateTag("products")`. Otherwise customers will see sold-out sizes as available.
- [ ] **2. The seed overwrites data, so never run it against a database with real products.**
  - For every product it matches by slug, it overwrites all fields, resets `created_at`, and deletes and re-creates the stock rows. Products not in the seed file are left alone.
  - The problem code is in `src/db/seed.ts`:
    ```ts
    db.delete(productStock).where(inArray(productStock.productId, ids)),
    db.insert(productStock).values(stockValues),
    ```
  - Consider a guard that refuses to run in production.
- [ ] **3. "Add to bag", "Notify me" and the newsletter form only pretend to work.** They show a confirmation but save nothing. Make sure that's acceptable wherever this is deployed before the cart exists.
- [ ] **4. `BETTER_AUTH_SECRET` isn't set.** The build logs `You are using the default secret`. Set it before any sign-in work, for example with `npx @better-auth/cli secret`.

## Medium: decisions you might want made differently

- [ ] **5. The catalog tables are in `src/db/catalog-schema.ts`, not `schema.ts` (a departure from the plan).** The Better Auth CLI replaces `schema.ts` entirely whenever it exists (`overwrite: fileExist`). Both files are listed in `drizzle.config.ts` and merged in `src/db/index.ts`.
- [ ] **6. Unknown product URLs return HTTP 200, not 404.** They show the not-found page and are marked `noindex`. Next 16 with Cache Components doesn't allow `dynamicParams`, and its docs recommend calling `notFound()`, which the page does. Check that this is acceptable for SEO.
- [ ] **7. The build depends on the database.** `generateStaticParams` must return at least one slug, and `src/db/index.ts` throws on import if `DATABASE_URL` is missing. CI or any deploy needs a reachable, seeded database at build time.
- [ ] **8. "Bags and leather goods" shows 3 items instead of 4.** It reads the Bags category, so the washed leather jacket dropped out. That was the plan's default.
- [ ] **9. Tailwind's built-in text sizes were changed.** `text-sm` is 12px, `text-base` 13px and `text-md` 14px, which is smaller than Tailwind's defaults.

## Lower: worth knowing

- [ ] **10. A product with no images gets an empty image source**, and `next/image` throws on that. All seeded products have images, but nothing in the database prevents an empty `images` array. The fallback is in `src/lib/queries.ts`:
  ```ts
  image: image ?? { src: "", alt: row.name },
  ```
- [ ] **11. Images:**
  - All images load directly from Unsplash.
  - The extra product images are zoomed crops of one photo.
  - Two bag photos (woven basket, top-handle) show small maker's marks on the clasps.
  - Replace these with your own photos before launch.
- [ ] **12. Many links lead to pages that don't exist yet:** collections, search, account, cart, journal, stores, and the help and legal pages.
- [ ] **13. Small notes:**
  - `@better-auth/cli` is 1.4.x while `better-auth` is 1.7.x. Check that `auth:generate` works when you first use it.
  - drizzle-kit warns about `sslmode=require`; changing it to `sslmode=verify-full` in `DATABASE_URL` keeps today's behaviour in the next major version of `pg`.
  - `updated_at` only updates automatically through Drizzle writes, not raw SQL.

## Verification status

- ✅ Typecheck and lint pass.
- ✅ Migration applied on Neon. The seed was run twice with the same counts: 8 categories, 12 products and 49 stock rows.
- ✅ `npm run build` pre-builds the homepage and all 12 product pages from the database.
- ✅ Before the database switch, the UI was checked in Chrome at 1440px and 390px.
- ⬜ **Gap:** the database-backed pages haven't been opened in a browser yet.

## Suggested follow-ups

- [ ] Browser check of the database-backed pages (see the plan's verification table).
- [ ] Add a production guard to `src/db/seed.ts`.
- [ ] Commit in logical chunks: setup, design system, UI, then the catalog database.
