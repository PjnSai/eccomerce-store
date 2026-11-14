// Catalog tables: categories, products and per-size stock.
// Kept out of schema.ts because `npm run auth:generate` overwrites that file.
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export type ProductImage = { src: string; alt: string };

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  description: text(),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  featured: boolean().notNull().default(false),
  position: integer().notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull(),
    details: text().array().notNull().default(sql`'{}'::text[]`),
    composition: text().notNull(),
    priceCents: integer("price_cents").notNull(),
    color: text().notNull(),
    colorCount: integer("color_count").notNull().default(1),
    /** Ordered; the first image is the main product image. */
    images: jsonb().$type<ProductImage[]>().notNull().default([]),
    isNew: boolean("is_new").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("products_category_id_idx").on(t.categoryId),
    index("products_created_at_idx").on(t.createdAt),
    check("products_price_cents_non_negative", sql`${t.priceCents} >= 0`),
  ],
);

export const productStock = pgTable(
  "product_stock",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text().notNull(),
    quantity: integer().notNull().default(0),
    position: integer().notNull().default(0),
  },
  (t) => [
    unique("product_stock_product_size_unique").on(t.productId, t.size),
    index("product_stock_product_id_idx").on(t.productId),
    check("product_stock_quantity_non_negative", sql`${t.quantity} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  stock: many(productStock),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, { fields: [productStock.productId], references: [products.id] }),
}));
