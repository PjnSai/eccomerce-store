"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ImageAsset } from "@/lib/catalog";

/**
 * Small screens: full-width swipeable carousel with a counter.
 * Desktop: images stacked in a grid (first full width, then pairs) so the
 * sticky information panel scrolls alongside.
 */
export function ProductGallery({ images }: { images: ImageAsset[] }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLUListElement>(null);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  return (
    <div>
      {/* Mobile / tablet carousel */}
      <div className="relative lg:hidden">
        <ul
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          aria-label="Product images"
        >
          {images.map((image, i) => (
            <li key={image.src} className="media aspect-product w-full shrink-0 snap-start">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload={i === 0}
                sizes="100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
        <p className="absolute bottom-3 right-gutter bg-paper/90 px-2 py-1 text-xs tabular-nums" aria-hidden>
          {index + 1} / {images.length}
        </p>
      </div>

      {/* Desktop grid */}
      <ul className="hidden grid-cols-2 gap-1 lg:grid">
        {images.map((image, i) => (
          <li key={image.src} className={`media aspect-product ${i === 0 ? "col-span-2" : ""}`}>
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload={i === 0}
              sizes={i === 0 ? "58vw" : "29vw"}
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
