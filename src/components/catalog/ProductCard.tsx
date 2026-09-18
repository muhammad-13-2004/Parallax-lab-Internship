import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";
import { formatPrice, stockLabel, stockTone } from "@/lib/format";
import type { Product, ViewMode } from "@/types/product";

type ProductCardProps = {
  product: Product;
  layout?: ViewMode;
};

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const tone = stockTone(product.stock);
  const isList = layout === "list";

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-xl bg-card text-card-foreground shadow-border transition-[box-shadow,transform] duration-200 ease-out",
        "hover:shadow-border-hover motion-safe:hover:-translate-y-0.5",
        isList ? "flex flex-col sm:flex-row" : "flex flex-col",
      )}
    >
      <Link
        href={`/products/${product.id}`}
        className={cn(
          "flex min-w-0 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          isList ? "flex-col sm:flex-row" : "flex-col",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-surface-muted",
            isList
              ? "aspect-square w-full sm:h-36 sm:w-36 sm:shrink-0 sm:aspect-auto"
              : "aspect-square w-full",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.title}
            width={900}
            height={900}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover:scale-[1.03]"
          />
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-2 p-4",
            isList && "sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5",
          )}
        >
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{product.category}</Badge>
              <Badge tone={tone}>{stockLabel(product.stock)}</Badge>
            </div>
            <h3 className="font-display text-lg font-medium tracking-tight text-foreground">
              {product.title}
            </h3>
            {isList ? (
              <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                {product.description}
              </p>
            ) : null}
          </div>
          <p
            className={cn(
              "font-medium tabular-nums text-foreground",
              isList ? "text-lg sm:shrink-0 sm:text-right" : "text-base",
            )}
          >
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </article>
  );
}
