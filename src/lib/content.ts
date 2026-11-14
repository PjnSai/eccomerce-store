// Static marketing content. Product and category data come from the database.
import type { ImageAsset } from "./catalog";

function unsplash(id: string, alt: string, width = 1600): ImageAsset {
  return {
    src: `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`,
    alt,
  };
}

export const site = {
  name: "Halden",
  tagline: "Considered clothing and objects for everyday use.",
};

export const navigation = [
  { label: "New in", href: "/collections/new-in" },
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Bags", href: "/collections/bags" },
  { label: "Shoes", href: "/collections/shoes" },
  { label: "Journal", href: "/journal" },
];

export const hero = {
  season: "Autumn–Winter 2026",
  title: "The quiet season",
  images: [
    unsplash("1539533018447-63fcce2678e3", "Model in a belted camel coat on stone steps", 1400),
    unsplash("1554412933-514a83d2f3c8", "Model in a black wool coat and wide-brimmed hat", 1400),
  ],
  links: [
    { label: "Shop women", href: "/collections/women" },
    { label: "Shop men", href: "/collections/men" },
  ],
};

export const editorial = {
  eyebrow: "The edit",
  title: "Made to be worn for years",
  body: "Each piece is produced in small runs by family-owned workshops, using natural fibres that soften and settle with wear.",
  link: { label: "Discover the collection", href: "/collections/knitwear" },
  image: unsplash("1490481651871-ab68de25d43d", "Ivory and earth-toned garments on a white rail", 1600),
};

export const boutique = {
  eyebrow: "Visit us",
  title: "Our boutiques",
  body: "Book a private appointment with a stylist, arrange alterations, or collect your online order in store.",
  link: { label: "Find a boutique", href: "/stores" },
  image: unsplash("1445205170230-053b83016050", "Warmly lit boutique interior with clothing rails", 2000),
};
