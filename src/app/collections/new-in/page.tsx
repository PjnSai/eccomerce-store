import type { Metadata } from "next";
import { ProductListing } from "@/components/product-listing";
import { getNewArrivals } from "@/lib/queries";

const NEW_ARRIVALS_LIMIT = 24;

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The latest pieces to arrive — new clothing, bags and shoes, added as they come in.",
};

export default async function NewArrivalsPage() {
  const products = await getNewArrivals(NEW_ARRIVALS_LIMIT);

  return (
    <ProductListing
      title="New arrivals"
      description="The latest pieces to arrive in our workshops, newest first."
      products={products}
    />
  );
}
