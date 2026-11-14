// Loads the SAMPLE catalog into the database. Idempotent, but DESTRUCTIVE for
// seeded products: matching rows are overwritten and their stock rows replaced.
// Never run it against a database holding real products or stock.
// Run with: npm run db:seed  (non-interactive: ALLOW_SEED=1 npm run db:seed)
import { createInterface } from "node:readline/promises";
import { neon } from "@neondatabase/serverless";
import { inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import * as catalogSchema from "./catalog-schema";
import { categories, products, productStock } from "./catalog-schema";
import { seedCategories, seedProducts } from "./seed-data";

// Writes use the admin connection when configured, so the app's DATABASE_URL
// can be a least-privilege role.
const url = process.env.DATABASE_URL_ADMIN ?? process.env.DATABASE_URL;
if (!url) throw new Error("Set DATABASE_URL_ADMIN or DATABASE_URL to seed.");
const db = drizzle(neon(url), { schema: catalogSchema });

async function confirmSeed() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    throw new Error("Refusing to seed in a production environment.");
  }
  const host = new URL(url!).host;
  if (process.env.ALLOW_SEED === "1") return;
  if (!process.stdin.isTTY) {
    throw new Error("Refusing to seed non-interactively. Set ALLOW_SEED=1 to confirm.");
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `This overwrites sample products and their stock on ${host}.
Type "seed" to continue: `,
  );
  rl.close();
  if (answer.trim() !== "seed") throw new Error("Seed cancelled.");
}

async function seed() {
  await confirmSeed();

  // 1. Categories
  await db
    .insert(categories)
    .values(
      seedCategories.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        imageUrl: c.image?.src ?? null,
        imageAlt: c.image?.alt ?? null,
        featured: c.featured ?? false,
        position: c.position ?? 0,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        imageUrl: sql`excluded.image_url`,
        imageAlt: sql`excluded.image_alt`,
        featured: sql`excluded.featured`,
        position: sql`excluded.position`,
      },
    });

  const categoryRows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryId = new Map(categoryRows.map((c) => [c.slug, c.id]));

  // 2. Products. seedProducts is newest first, so stagger created_at backwards
  //    by a minute each to keep that order for "New arrivals".
  const now = Date.now();
  const productValues = seedProducts.map((p, i) => {
    const id = categoryId.get(p.categorySlug);
    if (!id) throw new Error(`Unknown category "${p.categorySlug}" for product "${p.slug}"`);
    return {
      slug: p.slug,
      categoryId: id,
      name: p.name,
      description: p.description,
      details: p.details,
      composition: p.composition,
      priceCents: Math.round(p.price * 100),
      color: p.color,
      colorCount: p.colors,
      images: [p.image, ...p.gallery],
      isNew: p.isNew ?? false,
      createdAt: new Date(now - i * 60_000),
    };
  });

  await db
    .insert(products)
    .values(productValues)
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        categoryId: sql`excluded.category_id`,
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        details: sql`excluded.details`,
        composition: sql`excluded.composition`,
        priceCents: sql`excluded.price_cents`,
        color: sql`excluded.color`,
        colorCount: sql`excluded.color_count`,
        images: sql`excluded.images`,
        isNew: sql`excluded.is_new`,
        createdAt: sql`excluded.created_at`,
        updatedAt: sql`now()`,
      },
    });

  const productRows = await db
    .select({ id: products.id, slug: products.slug })
    .from(products)
    .where(
      inArray(
        products.slug,
        seedProducts.map((p) => p.slug),
      ),
    );
  const productId = new Map(productRows.map((p) => [p.slug, p.id]));

  // 3. Stock: replace each product's rows in one batch (neon-http has no
  //    interactive transactions; db.batch runs the statements in one transaction).
  const stockValues = seedProducts.flatMap((p) =>
    p.sizes.map((size, position) => ({
      productId: productId.get(p.slug)!,
      size: size.label,
      quantity: size.stock,
      position,
    })),
  );

  const ids = [...productId.values()];
  await db.batch([
    db.delete(productStock).where(inArray(productStock.productId, ids)),
    db.insert(productStock).values(stockValues),
  ]);

  const [counts] = await db.execute<{ categories: number; products: number; stock: number }>(sql`
    select
      (select count(*)::int from ${categories}) as categories,
      (select count(*)::int from ${products}) as products,
      (select count(*)::int from ${productStock}) as stock
  `).then((r) => r.rows);

  console.log(
    `Seeded ${counts.categories} categories, ${counts.products} products, ${counts.stock} stock rows.`,
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
