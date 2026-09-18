import { CategoryFilter } from "@/components/catalog/CategoryFilter";
import { SearchField } from "@/components/catalog/SearchField";
import { ViewToggle } from "@/components/catalog/ViewToggle";
import type { ViewMode } from "@/types/product";

type CatalogToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  resultCount: number;
  totalCount: number;
};

export function CatalogToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  view,
  onViewChange,
  resultCount,
  totalCount,
}: CatalogToolbarProps) {
  return (
    <div className="flex flex-col gap-5">
      <SearchField value={query} onChange={onQueryChange} />
      <CategoryFilter
        categories={categories}
        value={category}
        onChange={onCategoryChange}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Showing{" "}
          <span className="font-medium tabular-nums text-foreground">
            {resultCount}
          </span>{" "}
          of <span className="tabular-nums">{totalCount}</span> products
        </p>
        <ViewToggle value={view} onChange={onViewChange} />
      </div>
    </div>
  );
}
