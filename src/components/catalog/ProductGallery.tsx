"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { getProductImages } from "@/lib/product-images";
import type { Product } from "@/types/product";

type ProductGalleryProps = {
  product: Product;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = getProductImages(product);
  const [active, setActive] = useState(0);
  const current = images[active] ?? product.image;

  function move(delta: number) {
    setActive((index) => (index + delta + images.length) % images.length);
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="overflow-hidden rounded-xl bg-surface shadow-border"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
        }}
      >
        <img
          src={current}
          alt={`${product.title}, image ${active + 1} of ${images.length}`}
          width={900}
          height={900}
          className="aspect-square w-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <div
          role="tablist"
          aria-label={`${product.title} images`}
          className="grid grid-cols-4 gap-2"
        >
          {images.map((src, index) => {
            const selected = index === active;
            return (
              <button
                key={`${src}-${index}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                onClick={() => setActive(index)}
                className={cn(
                  "overflow-hidden rounded-md bg-surface transition-[box-shadow] duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected
                    ? "shadow-[0_0_0_2px_var(--ring)]"
                    : "shadow-border hover:shadow-border-hover",
                )}
              >
                <img
                  src={src}
                  alt=""
                  width={160}
                  height={160}
                  className="aspect-square w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
