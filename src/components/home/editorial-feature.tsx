import Image from "next/image";
import Link from "next/link";
import type { ImageAsset } from "@/lib/catalog";

type EditorialFeatureProps = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  link: { label: string; href: string };
  image: ImageAsset;
  /** Put the image on the right on desktop */
  reverse?: boolean;
};

/** Large image beside a short block of copy; stacks on small screens. */
export function EditorialFeature({
  id,
  eyebrow,
  title,
  body,
  link,
  image,
  reverse = false,
}: EditorialFeatureProps) {
  return (
    <section aria-labelledby={id} className="section-lg">
      <div className="grid lg:grid-cols-12 lg:items-center">
        <div
          className={[
            "media aspect-product sm:aspect-landscape lg:col-span-7 lg:aspect-[4/3]",
            reverse ? "lg:order-2 lg:col-start-6" : "",
          ].join(" ")}
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 64rem) 58vw, 100vw"
            className="object-cover"
          />
        </div>
        <div
          className={[
            "container-page stack items-start gap-4 pt-8 lg:col-span-4 lg:px-0 lg:pt-0",
            reverse ? "lg:order-1 lg:col-start-2 lg:row-start-1" : "lg:col-start-9 lg:pr-gutter",
          ].join(" ")}
        >
          <p className="meta">{eyebrow}</p>
          <h2 id={id} className="text-2xl">
            {title}
          </h2>
          <p className="max-w-prose-sm text-muted">{body}</p>
          <Link href={link.href} className="btn btn-secondary mt-4">
            {link.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
