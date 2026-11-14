import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product-listing";
import { getCategory, getCategorySlugs, getProductsByCategory, isValidSlug } from "@/lib/queries";

// /collections/new-in is its own static route and takes precedence over this one.
// With Cache Components this must return at least one slug, so seed before building.
export async function generateStaticParams() {
  return getCategorySlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  // Check the format before the cached query so junk URLs never become cache keys.
  if (!isValidSlug(slug)) return {};
  const category = await getCategory(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Shop ${category.name.toLowerCase()}.`,
    openGraph: category.image ? { images: [category.image.src] } : undefined,
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  const category = await getCategory(slug);
  if (!category) notFound();

  const products = await getProductsByCategory(category.slug);

  return (
    <ProductListing title={category.name} description={category.description} products={products} />
  );
}
