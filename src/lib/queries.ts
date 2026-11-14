// Server-side catalog reads. Each query is cached ("use cache") so pages can be
// prerendered with Cache Components; call revalidateTag("products") or
// revalidateTag("categories") after writes to refresh them.
import "server-only";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { categories, products, productStock } from "@/db/catalog-schema";
import type { Category, ImageAsset, Product } from "./catalog";

/** Slugs are lowercase words joined by single hyphens. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG_LENGTH = 80;

/**
 * Rejects anything that can't be a real slug before it reaches the database
 * or becomes a cache key, so arbitrary URLs can't drive DB load or cache churn.
 */
export function isValidSlug(slug: string) {
  return slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug);
}

/** Must match images.remotePatterns in next.config.ts. */
const ALLOWED_IMAGE_PREFIX = "https://images.unsplash.com/photo-";
const PLACEHOLDER_IMAGE = "/placeholder-product.svg";

/** Drops images next/image would refuse, so bad data can't crash a page. */
function safeImages(images: ImageAsset[] | null | undefined): ImageAsset[] {
  return (images ?? []).filter(
    (img) => typeof img?.src === "string" && img.src.startsWith(ALLOWED_IMAGE_PREFIX),
  );
}

/** Every product read loads its category and its stock rows in display order. */
const withRelations = {
  category: true as const,
  stock: { orderBy: [asc(productStock.position)] },
};

// Only used to infer the row type returned by queries that use withRelations.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const typedProductQuery = () => db.query.products.findFirst({ with: withRelations });
type ProductRow = NonNullable<Awaited<ReturnType<typeof typedProductQuery>>>;

function toProduct(row: ProductRow): Product {
  const [image, ...gallery] = safeImages(row.images);
  return {
    slug: row.slug,
    name: row.name,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    price: row.priceCents / 100,
    color: row.color,
    colors: row.colorCount,
    description: row.description,
    details: row.details,
    composition: row.composition,
    sizes: row.stock.map((s) => ({ label: s.size, stock: s.quantity })),
    image: image ?? { src: PLACEHOLDER_IMAGE, alt: row.name },
    gallery,
    isNew: row.isNew,
  };
}

function toCategory(row: typeof categories.$inferSelect): Category {
  const [image] = safeImages(row.imageUrl ? [{ src: row.imageUrl, alt: row.imageAlt ?? row.name }] : []);
  return { slug: row.slug, name: row.name, description: row.description, image: image ?? null };
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", `product:${slug}`);

  if (!isValidSlug(slug)) return undefined;

  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: withRelations,
  });
  return row ? toProduct(row) : undefined;
}

export async function getProductSlugs(): Promise<{ slug: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  return db.select({ slug: products.slug }).from(products).orderBy(asc(products.slug));
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  const rows = await db.query.products.findMany({
    with: withRelations,
    orderBy: [desc(products.createdAt)],
    limit,
  });
  return rows.map(toProduct);
}

export async function getProductsByCategory(categorySlug: string, limit?: number): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "categories");

  if (!isValidSlug(categorySlug)) return [];

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, categorySlug),
    columns: { id: true },
  });
  if (!category) return [];

  const rows = await db.query.products.findMany({
    where: eq(products.categoryId, category.id),
    with: withRelations,
    orderBy: [desc(products.createdAt)],
    limit,
  });
  return rows.map(toProduct);
}

/** Same category first, then the newest of everything else; excludes the product itself. */
export async function getRelatedProducts(slug: string, limit = 4): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");

  if (!isValidSlug(slug)) return [];

  const current = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true, categoryId: true },
  });
  if (!current) return [];

  const sameCategory = await db.query.products.findMany({
    where: and(eq(products.categoryId, current.categoryId), ne(products.id, current.id)),
    with: withRelations,
    orderBy: [desc(products.createdAt)],
    limit,
  });
  if (sameCategory.length >= limit) return sameCategory.map(toProduct);

  const others = await db.query.products.findMany({
    where: and(ne(products.categoryId, current.categoryId), ne(products.id, current.id)),
    with: withRelations,
    orderBy: [desc(products.createdAt)],
    limit: limit - sameCategory.length,
  });
  return [...sameCategory, ...others].map(toProduct);
}

export async function getFeaturedCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  const rows = await db.query.categories.findMany({
    where: eq(categories.featured, true),
    orderBy: [asc(categories.position)],
  });
  return rows.map(toCategory);
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  if (!isValidSlug(slug)) return undefined;

  const row = await db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  return row ? toCategory(row) : undefined;
}

export async function getCategorySlugs(): Promise<{ slug: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");

  return db.select({ slug: categories.slug }).from(categories).orderBy(asc(categories.position));
}
