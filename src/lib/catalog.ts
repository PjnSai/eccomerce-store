// Catalog types and pure helpers. Safe to import from client components:
// this file must never import the database. Reads live in ./queries.ts.

export type ImageAsset = {
  src: string;
  alt: string;
};

export type SizeOption = {
  label: string;
  stock: number;
};

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type Product = {
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  price: number; // in USD
  color: string;
  colors: number;
  description: string;
  details: string[];
  composition: string;
  sizes: SizeOption[];
  image: ImageAsset;
  /** Additional gallery images; the main image is always shown first. */
  gallery: ImageAsset[];
  isNew?: boolean;
};

export type Category = {
  slug: string;
  name: string;
  description: string | null;
  image: ImageAsset | null;
};

/* ---- Stock --------------------------------------------------------------- */

export const LOW_STOCK_THRESHOLD = 3;

export function totalStock(product: Pick<Product, "sizes">) {
  return product.sizes.reduce((sum, size) => sum + size.stock, 0);
}

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return "out_of_stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

/* ---- Formatting ---------------------------------------------------------- */

export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
