import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import type { ViewMode } from "@/types/product";

type ProductCardSkeletonProps = {
  layout?: ViewMode;
};

export function ProductCardSkeleton({ layout = "grid" }: ProductCardSkeletonProps) {
  const isList = layout === "list";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-card shadow-border",
        isList ? "flex flex-col sm:flex-row" : "flex flex-col",
      )}
    >
      <Skeleton
        className={cn(
          isList
            ? "aspect-square w-full rounded-none sm:h-36 sm:w-36 sm:shrink-0 sm:aspect-auto"
            : "aspect-square w-full rounded-none",
        )}
      />
      <div
        className={cn(
          "flex flex-1 flex-col gap-3 p-4",
          isList && "sm:flex-row sm:items-center sm:justify-between sm:p-5",
        )}
      >
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-6 w-3/4" />
          {isList ? <Skeleton className="h-4 w-full" /> : null}
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  );
}

type CatalogSkeletonProps = {
  layout?: ViewMode;
  count?: number;
};

export function CatalogSkeleton({ layout = "grid", count = 8 }: CatalogSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading products"
      className={
        layout === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "flex flex-col gap-3"
      }
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} layout={layout} />
      ))}
    </div>
  );
}
