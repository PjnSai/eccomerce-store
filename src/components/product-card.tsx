import Image from "next/image";
import Link from "next/link";
import { formatPrice, stockStatus, totalStock, type Product } from "@/lib/catalog";

type ProductCardProps = {
  product: Product;
  sizes?: string;
};

export function ProductCard({
  product,
  sizes = "(min-width: 64rem) 25vw, (min-width: 48rem) 33vw, 50vw",
}: ProductCardProps) {
  const status = stockStatus(totalStock(product));
  const badge =
    status === "out_of_stock" ? "Sold out" : status === "low_stock" ? "Few left" : product.isNew ? "New" : null;

  return (
    <article className="group relative">
      <div className="media aspect-product">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {badge && <span className="absolute left-3 top-3 bg-paper px-2 py-1 text-xs">{badge}</span>}
      </div>
      <div className="product-meta">
        <h3>
          <Link href={`/products/${product.slug}`} className="link-plain after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="price">{formatPrice(product.price)}</p>
      </div>
      <p className="meta mt-0.5">
        {product.colors} {product.colors === 1 ? "colour" : "colours"}
      </p>
    </article>
  );
}
