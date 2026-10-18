"use client";

import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { getProductImages } from "@/lib/product-images";
import type { Product } from "@/types/product";

type ProductGalleryProps = {
  product: Product;
};

const zoomScale = 2.5;

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = useMemo(() => getProductImages(product), [product]);
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const current = images[active] ?? product.image;

  function move(delta: number) {
    if (images.length === 0) return;
    setActive((index) => (index + delta + images.length) % images.length);
    setZoomed(false);
  }

  function updateLens(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setLens({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setZoomed((value) => !value);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          aria-label={`Product image ${active + 1} of ${images.length}. Press Enter to toggle zoom.`}
          onKeyDown={handleKeyDown}
          onPointerMove={updateLens}
          onPointerLeave={() => setZoomed(false)}
          onClick={() => setZoomed((value) => !value)}
          className={cn(
            "relative overflow-hidden rounded-2xl bg-surface shadow-border ring-1 ring-border/75",
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
        >
          <div className="relative aspect-square">
            <img
              src={current}
              alt={`${product.title}, image ${active + 1} of ${images.length}`}
              width={900}
              height={900}
              className={cn(
                "h-full w-full object-cover transition-transform duration-200 ease-out",
                zoomed && "scale-[1.12]",
              )}
            />

            {zoomed ? (
              <div className="pointer-events-none absolute inset-0">
                <div
                  aria-hidden="true"
                  className="absolute h-[30%] w-[30%] min-h-24 min-w-24 overflow-hidden rounded-lg border-2 border-white/90 bg-black/5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                  style={{
                    left: `${lens.x}%`,
                    top: `${lens.y}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundImage: `url("${current}")`,
                    backgroundSize: `${zoomScale * 100}% ${zoomScale * 100}%`,
                    backgroundPosition: `${lens.x}% ${lens.y}%`,
                    backgroundRepeat: "no-repeat",
                  }}
                />
              </div>
            ) : null}
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(event) => {
                  event.stopPropagation();
                  move(-1);
                }}
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-lg text-foreground shadow-lg backdrop-blur-sm transition hover:bg-background"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(event) => {
                  event.stopPropagation();
                  move(1);
                }}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border/70 bg-background/85 text-lg text-foreground shadow-lg backdrop-blur-sm transition hover:bg-background"
              >
                ›
              </button>
            </>
          ) : null}

          <div className="absolute right-3 top-3 rounded-full border border-border/70 bg-background/85 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
            {zoomed ? "Zoomed" : "Zoom"}
          </div>
        </div>
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
                onClick={() => {
                  setActive(index);
                  setZoomed(false);
                }}
                className={cn(
                  "overflow-hidden rounded-md bg-surface transition-[box-shadow,transform] duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selected
                    ? "scale-[1.01] shadow-[0_0_0_2px_var(--ring)]"
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
