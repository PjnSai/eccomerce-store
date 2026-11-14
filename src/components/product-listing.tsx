import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./product-card";

type ProductListingProps = {
  title: string;
  description?: string | null;
  products: Product[];
};

/** Collection page body: breadcrumb, title with piece count, intro and product grid. */
export function ProductListing({ title, description, products }: ProductListingProps) {
  return (
    <section aria-labelledby="listing-title" className="container-page section">
      <header className="stack mb-6 gap-3 lg:mb-8">
        <nav aria-label="Breadcrumb" className="meta">
          <ol className="cluster gap-1.5">
            <li>
              <Link href="/" className="link-plain hover:text-ink">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>

        <div className="flex items-baseline justify-between gap-4">
          <h1 id="listing-title" className="heading-page">
            {title}
          </h1>
          {products.length > 0 && (
            <p className="meta">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          )}
        </div>
        {description && <p className="max-w-prose-sm text-md text-muted">{description}</p>}
      </header>

      {products.length > 0 ? (
        <div className="grid-products">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="stack items-center gap-4 py-20 text-center">
          <p className="text-md text-muted">New pieces are on their way. Check back soon.</p>
          <Link href="/" className="btn btn-secondary mt-2">
            Return to the homepage
          </Link>
        </div>
      )}
    </section>
  );
}
