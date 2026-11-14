import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/home/section-header";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { formatPrice } from "@/lib/catalog";
import { getProduct, getProductSlugs, getRelatedProducts, isValidSlug } from "@/lib/queries";

// With Cache Components this must return at least one slug, so the database
// has to be migrated and seeded before `npm run build`.
export async function generateStaticParams() {
  return getProductSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Check the format before the cached query so junk URLs never become cache keys.
  if (!isValidSlug(slug)) return {};
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: { images: [product.image.src] },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const product = await getProduct(slug);
  if (!product) notFound();

  const images = [product.image, ...product.gallery];
  const related = await getRelatedProducts(product.slug);
  const isOneSize = product.sizes.length === 1;

  const sections = [
    {
      id: "details",
      title: "Details",
      open: true,
      body: (
        <ul className="stack gap-1">
          {product.details.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    },
    { id: "composition", title: "Composition and care", body: <p>{product.composition}</p> },
    ...(isOneSize
      ? []
      : [
          {
            id: "size-guide",
            title: "Size and fit",
            body: (
              <p>
                Fits true to size. Model is 177 cm and wears a size S. For help choosing a size,
                contact client services.
              </p>
            ),
          },
        ]),
    {
      id: "delivery",
      title: "Delivery and returns",
      body: (
        <p>
          Complimentary delivery in 2–4 business days. Returns are free within 30 days of
          delivery.
        </p>
      ),
    },
  ];

  return (
    <>
      <article className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:pr-gutter">
        <div className="lg:col-span-7">
          <ProductGallery images={images} />
        </div>

        {/* Information panel: sticky beside the gallery on desktop */}
        <div className="container-page pt-6 pb-4 lg:col-span-5 lg:px-0 lg:pt-10">
          <div className="stack gap-8 lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
            <div className="stack gap-3">
              <nav aria-label="Breadcrumb" className="meta">
                <ol className="cluster gap-1.5">
                  <li>
                    <Link href="/" className="link-plain hover:text-ink">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <Link
                      href={`/collections/${product.categorySlug}`}
                      className="link-plain hover:text-ink"
                    >
                      {product.categoryName}
                    </Link>
                  </li>
                </ol>
              </nav>

              <h1 className="heading-page">{product.name}</h1>
              <p className="price text-md">{formatPrice(product.price)}</p>
              <p className="meta">
                {product.color}
                {product.colors > 1 && ` · ${product.colors} colours available`}
              </p>
            </div>

            <PurchasePanel sizes={product.sizes} />

            <p className="max-w-prose-sm text-md text-muted">{product.description}</p>

            <div className="border-t border-line">
              {sections.map((section) => (
                <details
                  key={section.id}
                  id={section.id}
                  open={section.open}
                  className="group border-b border-line"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-base [&::-webkit-details-marker]:hidden">
                    {section.title}
                    <span
                      aria-hidden
                      className="text-lg leading-none transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="pb-5 text-base text-muted">{section.body}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </article>

      <section aria-labelledby="related-title" className="container-page section-lg">
        <SectionHeader
          id="related-title"
          title="You may also like"
          link={{
            label: `More ${product.categoryName.toLowerCase()}`,
            href: `/collections/${product.categorySlug}`,
          }}
        />
        <div className="grid-products">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      </section>
    </>
  );
}
