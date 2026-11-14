# Plan: Move the product catalog into Postgres (Drizzle + Neon)

- **Status:** Implemented. Migrated and seeded on Neon on 2026-11-14.
- **Source:** the approved plan `inspect-the-current-ecommerce-bubbly-corbato.md`, updated here to match what was actually built. Changes from that plan are marked **(changed)**.
- **Review notes:** [`docs/reviews/catalog-database-review.md`](../reviews/catalog-database-review.md)

## Context

All products, categories and per-size stock used to be hard-coded in `src/lib/catalog.ts`. Drizzle and Neon were already wired up, but there were no tables yet. The goal was to move the catalog into a real database (products, categories and stock only) without changing how the storefront looks.

**Out of scope:** carts, orders, payments, reviews, wishlists and variants. Stock is per size, but a size is only a label and a count. It has no price, SKU or colour of its own.

## Database structure

```
categories                        products                                 product_stock
──────────                        ────────                                 ─────────────
id          int identity PK  ◄──┐ id            int identity PK      ◄──┐  id          int identity PK
slug        text UNIQUE         └ category_id   int FK NOT NULL         └─ product_id  int FK NOT NULL (ON DELETE CASCADE)
name        text                  (ON DELETE RESTRICT)                     size        text      ('M', '38', 'One size')
description text NULL             slug          text UNIQUE                quantity    int ≥ 0 (CHECK) default 0
image_url   text NULL             name          text                       position    int       (display order)
image_alt   text NULL             description   text                       UNIQUE (product_id, size)
featured    bool default false    details       text[]   default '{}'      INDEX (product_id)
position    int default 0         composition   text
created_at  timestamptz           price_cents   int CHECK ≥ 0
                                  color         text
                                  color_count   int default 1
                                  images        jsonb  [{src,alt}, …], first = main image
                                  is_new        bool default false
                                  created_at    timestamptz default now()
                                  updated_at    timestamptz default now()
                                  INDEX (category_id), INDEX (created_at)
```

**Relationships:** one category has many products, and one product has many `product_stock` rows (one per size). They're declared with Drizzle `relations()`, so `db.query.products.findFirst({ with: { category: true, stock: true } })` works.

**Design choices**
- **Prices are integer cents**, so money never goes through floating point. The query layer converts them to dollars, so `formatPrice` and the components are unchanged.
- **Images are a `jsonb` array on the product.** The storefront only ever reads the whole list, so an images table can come later.
- **`details` is `text[]`**: a short, ordered bullet list.
- **There is no `status`/`published` column**, so every row is live.
- **There are 8 categories:** Knitwear, Tailoring, Outerwear, Trousers, Jersey, Shirts, Shoes and Bags. The three homepage collection tiles are the featured categories, in positions 1 to 3.

## Files

| File | What it does |
|---|---|
| `src/db/catalog-schema.ts` **(changed)** | Defines `categories`, `products`, `productStock` and their `relations`. The plan put these in `src/db/schema.ts`, but the Better Auth CLI **overwrites** that file whenever it exists (`overwrite: fileExist` in `@better-auth/cli`'s generator). So the catalog lives in its own file, and `schema.ts` is reserved for generated auth tables. |
| `src/db/index.ts` | Merges both schemas: `drizzle(sql, { schema: { ...authSchema, ...catalogSchema } })`. |
| `drizzle.config.ts` | `schema: ["./src/db/schema.ts", "./src/db/catalog-schema.ts"]`. |
| `src/db/seed-data.ts` | Sample categories and the 12 products, used only by the seed. It also holds the `unsplash`/`detail`/`photos`/`apparel`/`footwear`/`oneSize` helpers. |
| `src/db/seed.ts` | Idempotent seed. Upserts categories and products by slug, then replaces each product's stock rows in a single `db.batch([...])`, because neon-http has no interactive transactions. `created_at` is staggered so new arrivals keep their current order. |
| `src/lib/catalog.ts` | Types (`Product`, `Category`, `ImageAsset`, `SizeOption`, `StockStatus`) and pure helpers (`totalStock`, `stockStatus`, `LOW_STOCK_THRESHOLD`, `formatPrice`). Client components import it, so it must never import `db`. `Product` gained `categoryName` and `categorySlug`. |
| `src/lib/content.ts` | Static marketing copy: `site`, `navigation`, `hero`, `editorial` and `boutique`. |
| `src/lib/queries.ts` | Server-only cached reads. They map DB rows to the existing `Product` shape (cents to dollars, stock rows to `sizes`, `images[0]` to `image`, the rest to `gallery`). |
| `src/app/page.tsx` | Async. Awaits `getNewArrivals(8)`, `getProductsByCategory("bags", 4)` and `getFeaturedCategories()`. |
| `src/app/products/[slug]/page.tsx` | `generateStaticParams` uses `getProductSlugs()`. The page and its metadata await `getProduct`, and the breadcrumb and "More …" links use `categorySlug`/`categoryName`. |
| `src/components/home/collection-tiles.tsx` | Takes `Category[]`. It handles a missing image or description. |
| Header, footer, hero, layout | Import `@/lib/content` instead of `@/lib/catalog`. |
| `package.json` | `tsx` and `server-only` added, and a `db:seed` script: `tsx --env-file=.env.local src/db/seed.ts`. |
| `CLAUDE.md`, `README.md` | Catalog, caching and seed notes. |

`ProductCard`, `PurchasePanel`, `StockStatus` and `ProductGallery` were not changed.

### Query layer (`src/lib/queries.ts`)

Because `cacheComponents: true` is on, every read uses:

```ts
"use cache";
cacheLife("hours");
cacheTag("products"); // "categories" for category reads, plus "product:<slug>" in getProduct
```

- `getProduct(slug)`: the product with its category and its stock ordered by `position`, or `undefined`.
- `getProductSlugs()`: `{ slug }[]` for `generateStaticParams`. It must return at least one slug, so the database has to be seeded before `next build`.
- `getNewArrivals(limit = 8)`: newest `created_at` first.
- `getProductsByCategory(slug, limit?)`.
- `getRelatedProducts(slug, limit = 4)` **(changed)**: takes a slug instead of the whole product, because a cached function's arguments become its cache key. It returns same-category products first, then the newest of the rest, and excludes the product itself.
- `getFeaturedCategories()`: `featured = true`, ordered by `position`.

### Behaviour changes
- **New arrivals** is now "the newest 8" rather than a hand-picked list. The seed timestamps keep the previous order.
- **"Bags and leather goods"** now reads the Bags category, so it shows 3 products. The washed leather jacket (Outerwear) dropped out, which was the plan's default.

## Migration approach

Versioned migrations, not `db:push`:

1. Write the schema.
2. `npm run db:generate` creates `drizzle/0000_catalog.sql`. The SQL was reviewed: foreign keys, checks, the unique constraint and the indexes.
3. `npm run db:migrate` applied it to Neon. ✅
4. `npm run db:seed` loaded 8 categories, 12 products and 49 stock rows. ✅ Running it again leaves the counts unchanged.
5. Later, `npm run auth:generate` writes `schema.ts` without touching the catalog tables, and `db:generate` produces migration `0001`.

## Verification

| Check | Result |
|---|---|
| `npm run typecheck`, `npm run lint` | ✅ Pass |
| Migration, seed and queries against in-memory Postgres (PGlite) | ✅ Seeding twice keeps 8/12/49 rows, new arrivals keep their order, the suit's stock is XS=1 S=2 M=0 L=1 XL=0, Bags returns 3, featured is knitwear/tailoring/outerwear, a negative quantity is rejected, and deleting a category that has products is blocked |
| `db:migrate` and `db:seed` (twice) on Neon | ✅ 8 categories, 12 products, 49 stock rows |
| `npm run build` against Neon | ✅ The homepage and all 12 `/products/[slug]` pages are pre-built (revalidate 1h, expire 1d) |
| Browser check of DB-backed pages | ⬜ **Not done yet.** Check `/`, `/products/brushed-cotton-shirt` (sold out), `/products/tailored-wool-suit` (low stock), `/products/top-handle-bag` (one size) and `/products/does-not-exist` |
| Edit a quantity in Drizzle Studio and see it on the site | ⬜ Not done yet. The change only shows after the cache window or a rebuild |
