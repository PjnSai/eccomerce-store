"use client";

import { useState } from "react";
import type { SizeOption } from "@/lib/catalog";
import { StockStatus } from "./stock-status";

type PurchasePanelProps = {
  sizes: SizeOption[];
};

/**
 * Size selection, availability and the add-to-bag action.
 * The bag is not connected yet; adding only shows a confirmation.
 */
export function PurchasePanel({ sizes }: PurchasePanelProps) {
  const isOneSize = sizes.length === 1;
  const total = sizes.reduce((sum, s) => sum + s.stock, 0);
  const soldOut = total === 0;

  const [selected, setSelected] = useState<string | null>(isOneSize ? sizes[0].label : null);
  const [added, setAdded] = useState(false);
  const [showSizeError, setShowSizeError] = useState(false);

  const selectedSize = sizes.find((s) => s.label === selected);
  const stockShown = selectedSize ? selectedSize.stock : total;

  function addToBag() {
    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }
    setAdded(true);
  }

  return (
    <div className="stack gap-6">
      {!isOneSize && (
        <fieldset className="stack gap-3">
          <div className="flex items-baseline justify-between">
            <legend className="text-base">
              Size{selected ? <span className="text-muted"> — {selected}</span> : null}
            </legend>
            <a href="#size-guide" className="link text-sm">
              Size guide
            </a>
          </div>
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${Math.min(sizes.length, 6)}, minmax(0, 1fr))` }}
          >
            {sizes.map((size) => {
              const unavailable = size.stock === 0;
              const isSelected = selected === size.label;
              return (
                <label
                  key={size.label}
                  className={[
                    "flex h-11 cursor-pointer items-center justify-center border text-base transition-colors",
                    isSelected ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
                    unavailable
                      ? "cursor-not-allowed border-line-soft text-subtle line-through hover:border-line-soft"
                      : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="size"
                    value={size.label}
                    className="sr-only"
                    disabled={unavailable}
                    checked={isSelected}
                    onChange={() => {
                      setSelected(size.label);
                      setAdded(false);
                      setShowSizeError(false);
                    }}
                  />
                  {size.label}
                  {unavailable && <span className="sr-only"> (sold out)</span>}
                </label>
              );
            })}
          </div>
          {showSizeError && (
            <p className="text-sm text-danger" role="alert">
              Please select a size.
            </p>
          )}
        </fieldset>
      )}

      <StockStatus stock={stockShown} />

      {soldOut ? (
        <div className="stack gap-3">
          <button type="button" className="btn btn-primary btn-block" disabled>
            Sold out
          </button>
          <button type="button" className="btn btn-secondary btn-block">
            Notify me when available
          </button>
        </div>
      ) : (
        <div className="stack gap-3">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={addToBag}
            disabled={selectedSize?.stock === 0}
          >
            Add to bag
          </button>
          {added && (
            <p className="text-base" role="status">
              Added to your bag{selected && !isOneSize ? ` — size ${selected}` : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
