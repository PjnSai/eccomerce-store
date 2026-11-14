import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/lib/catalog";
import { SectionHeader } from "./section-header";

export function CollectionTiles({ collections }: { collections: Category[] }) {
  return (
    <section aria-labelledby="collections-title" className="section-lg">
      <div className="container-page">
        <SectionHeader id="collections-title" title="Featured collections" />
      </div>

      {/* Swipeable row on small screens, three columns on desktop */}
      <ul className="flex snap-x snap-mandatory gap-grid-x overflow-x-auto scroll-px-gutter px-gutter pb-2 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
        {collections.map((collection) => (
          <li key={collection.slug} className="w-[78vw] shrink-0 snap-start md:w-auto">
            <Link href={`/collections/${collection.slug}`} className="group block">
              <div className="media aspect-product">
                {collection.image && (
                  <Image
                    src={collection.image.src}
                    alt={collection.image.alt}
                    fill
                    sizes="(min-width: 48rem) 33vw, 78vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="mt-5 stack gap-1">
                <h3 className="text-lg">{collection.name}</h3>
                {collection.description && (
                  <p className="text-base text-muted">{collection.description}</p>
                )}
                <span className="mt-2 text-base underline underline-offset-4 decoration-1 group-hover:text-muted">
                  Explore
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
