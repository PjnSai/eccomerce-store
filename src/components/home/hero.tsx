import Image from "next/image";
import Link from "next/link";
import { hero } from "@/lib/content";

export function Hero() {
  const [primary, secondary] = hero.images;

  return (
    <section
      aria-labelledby="hero-title"
      className="relative h-[100svh] min-h-[34rem] overflow-hidden bg-ink text-paper"
    >
      {/* One image on small screens, a diptych on desktop */}
      <div className="absolute inset-0 grid lg:grid-cols-2">
        <div className="relative">
          <Image
            src={primary.src}
            alt={primary.alt}
            fill
            preload
            sizes="(min-width: 64rem) 50vw, 100vw"
            className="object-cover object-[50%_30%]"
          />
        </div>
        <div className="relative hidden lg:block">
          <Image
            src={secondary.src}
            alt={secondary.alt}
            fill
            sizes="50vw"
            className="object-cover object-[50%_25%]"
          />
        </div>
      </div>

      {/* Legibility scrims for header (top) and copy (bottom) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

      <div className="container-page relative flex h-full flex-col items-start justify-end gap-4 pb-12 lg:items-center lg:pb-16 lg:text-center">
        <p className="text-sm text-paper/80">{hero.season}</p>
        <h1 id="hero-title" className="heading-display max-w-[14ch]">
          {hero.title}
        </h1>
        <div className="cluster mt-2 gap-x-8 gap-y-3">
          {hero.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn btn-text text-base text-paper hover:text-paper/70"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
