import { CollectionTiles } from "@/components/home/collection-tiles";
import { EditorialFeature } from "@/components/home/editorial-feature";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { SectionHeader } from "@/components/home/section-header";
import { ProductCard } from "@/components/product-card";
import { boutique, editorial } from "@/lib/content";
import { getFeaturedCategories, getNewArrivals, getProductsByCategory } from "@/lib/queries";

export default async function Home() {
  const [newArrivals, accessories, collections] = await Promise.all([
    getNewArrivals(8),
    getProductsByCategory("bags", 4),
    getFeaturedCategories(),
  ]);

  return (
    <>
      <Hero />

      {/* Intro statement */}
      <section className="container-narrow section-xl text-center">
        <p className="text-2xl text-balance">
          A wardrobe built slowly — natural fibres, quiet colour and cuts that hold their shape
          season after season.
        </p>
      </section>

      <section aria-labelledby="new-arrivals-title" className="container-page section">
        <SectionHeader
          id="new-arrivals-title"
          title="New arrivals"
          link={{ label: "View all", href: "/collections/new-in" }}
        />
        <div className="grid-products">
          {newArrivals.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <EditorialFeature id="editorial-title" {...editorial} />

      <CollectionTiles collections={collections} />

      <section aria-labelledby="accessories-title" className="container-page section-lg">
        <SectionHeader
          id="accessories-title"
          title="Bags and leather goods"
          link={{ label: "Shop bags", href: "/collections/bags" }}
        />
        <div className="grid-products">
          {accessories.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <EditorialFeature id="boutique-title" reverse {...boutique} />

      <Newsletter />
    </>
  );
}
