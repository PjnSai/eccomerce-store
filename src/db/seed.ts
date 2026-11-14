// Loads the sample catalog into the database. Safe to re-run: categories and
// products are upserted by slug and each product's stock rows are replaced.
// Run with: npm run db:seed
import { inArray, sql } from "drizzle-orm";
import { db } from "./index";
import { categories, products, productStock } from "./catalog-schema";
import { seedCategories, seedProducts } from "./seed-data";

async function seed() {
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
