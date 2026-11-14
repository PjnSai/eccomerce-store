import { stockStatus, type StockStatus as Status } from "@/lib/catalog";

const styles: Record<Status, { dot: string; text: string }> = {
  in_stock: { dot: "bg-success", text: "" },
  low_stock: { dot: "bg-sale", text: "text-sale" },
  out_of_stock: { dot: "bg-subtle", text: "text-muted" },
};

/** Small dot + label describing availability for a stock count. */
export function StockStatus({ stock, className = "" }: { stock: number; className?: string }) {
  const status = stockStatus(stock);
  const label =
    status === "out_of_stock" ? "Sold out" : status === "low_stock" ? `Only ${stock} left` : "In stock";

  return (
    <p className={`flex items-center gap-2 text-base ${className}`} role="status">
      <span aria-hidden className={`size-1.5 rounded-full ${styles[status].dot}`} />
      <span className={styles[status].text}>{label}</span>
    </p>
  );
}
