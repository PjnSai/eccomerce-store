// Sample catalog used only by src/db/seed.ts. The storefront reads from the database.
import type { ImageAsset, SizeOption } from "@/lib/catalog";

export type SeedCategory = {
  slug: string;
  name: string;
  description?: string;
  image?: ImageAsset;
  featured?: boolean;
  position?: number;
};

export type SeedProduct = {
  slug: string;
  name: string;
  categorySlug: string;
  price: number; // USD; stored as cents
  color: string;
  colors: number;
  description: string;
  details: string[];
  composition: string;
  sizes: SizeOption[];
  image: ImageAsset;
  gallery: ImageAsset[];
  isNew?: boolean;
};

const UNSPLASH = "https://images.unsplash.com/photo-";

function unsplash(id: string, alt: string, width = 1600): ImageAsset {
  return { src: `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}&q=80`, alt };
}

/** A zoomed crop of the same photo, used as a sample detail shot. */
function detail(id: string, alt: string, x: number, y: number, zoom = 2): ImageAsset {
  return {
    src: `${UNSPLASH}${id}?auto=format&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${zoom}&w=1200&h=1500&q=80`,
    alt,
  };
}

/** Builds the main image plus two detail crops from one Unsplash photo. */
function photos(id: string, alt: string) {
  return {
    image: unsplash(id, alt, 1200),
    gallery: [
      detail(id, `${alt}, detail`, 0.5, 0.35),
      detail(id, `${alt}, close-up`, 0.5, 0.7, 2.4),
    ],
  };
}

const apparel = (stock: number[]): SizeOption[] =>
  ["XS", "S", "M", "L", "XL"].map((label, i) => ({ label, stock: stock[i] ?? 0 }));

const footwear = (stock: number[]): SizeOption[] =>
  ["36", "37", "38", "39", "40", "41"].map((label, i) => ({ label, stock: stock[i] ?? 0 }));

const oneSize = (stock: number): SizeOption[] => [{ label: "One size", stock }];

export const seedCategories: SeedCategory[] = [
  {
    slug: "knitwear",
    name: "Knitwear",
    description: "Cashmere, merino and mohair in undyed tones.",
    image: unsplash("1558769132-cb1aea458c5e", "Neutral knitwear on a clothing rail", 1200),
    featured: true,
    position: 1,
  },
  {
    slug: "tailoring",
    name: "Tailoring",
    description: "Soft-shouldered suits cut for movement.",
    image: unsplash("1507679799987-c73779587ccf", "Man buttoning a navy suit jacket", 1200),
    featured: true,
    position: 2,
  },
  {
    slug: "outerwear",
    name: "Outerwear",
    description: "Coats in double-faced wool and suede.",
    image: unsplash("1539109136881-3be0616acf4b", "Model in a pale blue coat in a city square", 1200),
    featured: true,
    position: 3,
  },
  { slug: "trousers", name: "Trousers", position: 4 },
  { slug: "jersey", name: "Jersey", position: 5 },
  { slug: "shirts", name: "Shirts", position: 6 },
  { slug: "shoes", name: "Shoes", position: 7 },
  { slug: "bags", name: "Bags", position: 8 },
];

/** Listed newest first: seed timestamps preserve this order for "New arrivals". */
export const seedProducts: SeedProduct[] = [
  {
    slug: "fringed-knit-poncho",
    name: "Fringed knit poncho",
    categorySlug: "knitwear",
    price: 890,
    color: "Ecru",
    colors: 2,
    isNew: true,
    description:
      "An open-stitch poncho knitted from undyed cotton and linen, finished with a hand-knotted fringe. Worn loose over a shirt or a slip dress.",
    details: ["Relaxed, one-piece shape", "V-neck", "Hand-knotted fringe hem", "Made in Portugal"],
    composition: "70% cotton, 30% linen. Hand wash cold, dry flat.",
    sizes: apparel([0, 4, 6, 3, 0]),
    ...photos("1434389677669-e08b4cac3105", "Cream open-knit poncho with fringe on a hanger"),
  },
  {
    slug: "tailored-wool-suit",
    name: "Tailored wool suit",
    categorySlug: "tailoring",
    price: 2450,
    color: "Navy",
    colors: 2,
    isNew: true,
    description:
      "A two-piece suit in fine wool twill with a softly constructed shoulder and a slim, flat-front trouser. Half-lined so it stays light.",
    details: [
      "Two-button jacket",
      "Notch lapels",
      "Half-lined",
      "Flat-front trouser",
      "Made in Italy",
    ],
    composition: "100% virgin wool. Lining: 100% cupro. Dry clean.",
    sizes: apparel([1, 2, 0, 1, 0]),
    ...photos("1617137968427-85924c800a22", "Man in a navy suit walking past a glass building"),
  },
  {
    slug: "suede-bomber",
    name: "Suede bomber",
    categorySlug: "outerwear",
    price: 1980,
    color: "Tobacco",
    colors: 3,
    description:
      "A light bomber in goat suede with ribbed collar, cuffs and hem. Cut close to the body with a slightly dropped shoulder.",
    details: ["Two-way front zip", "Welt pockets", "Ribbed trims", "Made in Italy"],
    composition: "100% goat suede. Trims: 100% wool. Specialist leather clean only.",
    sizes: apparel([3, 5, 6, 4, 2]),
    ...photos("1591047139829-d91aecb6caea", "Tan suede bomber jacket held on a hanger"),
  },
  {
    slug: "silk-cargo-trouser",
    name: "Silk cargo trouser",
    categorySlug: "trousers",
    price: 760,
    color: "Blush",
    colors: 2,
    isNew: true,
    description:
      "Utility pockets reworked in washed silk crêpe. A high, elasticated waist and gathered cuffs give an easy, fluid line.",
    details: ["Elasticated waist", "Patch cargo pockets", "Gathered cuffs", "Made in Italy"],
    composition: "100% silk. Dry clean.",
    sizes: apparel([2, 3, 4, 2, 1]),
    ...photos("1594633312681-425c7b97ccd1", "Blush silk cargo trousers"),
  },
  {
    slug: "cotton-crew-tee",
    name: "Cotton crew tee",
    categorySlug: "jersey",
    price: 220,
    color: "Optic white",
    colors: 4,
    description:
      "A heavyweight jersey tee in long-staple cotton with a narrow ribbed neck. Garment-washed so it keeps its shape.",
    details: ["Regular fit", "Ribbed crew neck", "Double-stitched hems", "Made in Japan"],
    composition: "100% cotton. Machine wash cold.",
    sizes: apparel([6, 10, 12, 8, 5]),
    ...photos("1521572163474-6864f9cf17ab", "Plain white crew-neck t-shirt"),
  },
  {
    slug: "brushed-cotton-shirt",
    name: "Brushed cotton shirt",
    categorySlug: "shirts",
    price: 480,
    color: "Sage",
    colors: 3,
    description:
      "A soft overshirt in brushed cotton flannel, cut with a boxy body and a single chest pocket. Layers easily over knitwear.",
    details: ["Boxy fit", "Mother-of-pearl buttons", "Chest pocket", "Made in Portugal"],
    composition: "100% cotton. Machine wash cold.",
    sizes: apparel([0, 0, 0, 0, 0]),
    ...photos("1523381210434-271e8be1f52b", "Sage green shirts on wooden hangers"),
  },
  {
    slug: "printed-satin-pump",
    name: "Printed satin pump",
    categorySlug: "shoes",
    price: 690,
    color: "Floral print",
    colors: 1,
    description:
      "A pointed pump in printed silk satin on a slim 100mm heel, with a leather sole and lightly padded footbed.",
    details: ["100mm heel", "Pointed toe", "Leather sole", "Made in Italy"],
    composition: "Upper: 100% silk satin. Lining and sole: leather.",
    sizes: footwear([0, 2, 3, 1, 0, 0]),
    ...photos("1543163521-1bf539c55dd2", "Floral satin stiletto pumps on a pale blue set"),
  },
  {
    slug: "double-breasted-coat",
    name: "Double-breasted coat",
    categorySlug: "outerwear",
    price: 2900,
    color: "Navy check",
    colors: 2,
    isNew: true,
    description:
      "A double-breasted coat in brushed wool check, unlined through the body so it drapes softly. Falls just below the knee.",
    details: ["Six-button front", "Peak lapels", "Flap pockets", "Made in Italy"],
    composition: "90% wool, 10% cashmere. Dry clean.",
    sizes: apparel([2, 4, 3, 2, 1]),
    ...photos("1485968579580-b6d095142e6e", "Model in a dark check coat on a city street"),
  },
  {
    slug: "top-handle-bag",
    name: "Top-handle bag",
    categorySlug: "bags",
    price: 2650,
    color: "Lacquer red",
    colors: 3,
    description:
      "A structured top-handle bag in polished calf leather with a turn-lock closure. Fits a phone, cardholder and keys.",
    details: [
      "Turn-lock closure",
      "Detachable shoulder strap",
      "Suede-lined interior",
      "W 24 × H 18 × D 10 cm",
      "Made in Italy",
    ],
    composition: "100% calf leather. Lining: suede.",
    sizes: oneSize(5),
    ...photos("1584917865442-de89df76afd3", "Red leather top-handle bag"),
  },
  {
    slug: "woven-basket-bag",
    name: "Woven basket bag",
    categorySlug: "bags",
    price: 1450,
    color: "Tangerine",
    colors: 2,
    isNew: true,
    description:
      "A hand-woven raffia basket trimmed in smooth leather, with a rigid handle and a flap closure.",
    details: ["Hand-woven body", "Leather flap and handle", "Cotton-lined", "Made in Spain"],
    composition: "Raffia, calf leather trims. Wipe clean.",
    sizes: oneSize(2),
    ...photos("1590874103328-eac38a683ce7", "Orange woven basket bag with leather trim"),
  },
  {
    slug: "chevron-shoulder-bag",
    name: "Chevron shoulder bag",
    categorySlug: "bags",
    price: 1190,
    color: "Rose",
    colors: 2,
    description:
      "A compact flap bag with a contrast chevron panel and a fine chain strap that doubles for shoulder or cross-body wear.",
    details: ["Magnetic flap", "Chain strap", "Card slot inside", "W 22 × H 14 × D 6 cm"],
    composition: "100% calf leather. Lining: leather.",
    sizes: oneSize(0),
    ...photos("1566150905458-1bf1fc113f0d", "Pink shoulder bag with chevron panel on a plinth"),
  },
  {
    slug: "washed-leather-jacket",
    name: "Washed leather jacket",
    categorySlug: "outerwear",
    price: 2200,
    color: "Black",
    colors: 1,
    description:
      "A boxy leather jacket washed and tumbled for a broken-in finish, with a shirt collar and concealed snap front.",
    details: ["Boxy fit", "Concealed snap front", "Side pockets", "Made in Italy"],
    composition: "100% lamb leather. Specialist leather clean only.",
    sizes: apparel([1, 3, 4, 3, 2]),
    ...photos("1520975954732-35dd22299614", "Model in a black leather jacket crouched on a ledge"),
  },
];
