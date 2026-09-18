"use client";

import { useEffect, useMemo, useState } from "react";
import { CatalogToolbar } from "@/components/catalog/CatalogToolbar";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogSkeleton } from "@/components/catalog/ProductCardSkeleton";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchCatalog, filterProducts } from "@/lib/api";
import type { Product, ViewMode } from "@/types/product";

const VIEW_KEY = "northline-view";

export function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "list" || stored === "grid") {
      setView(stored);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetchCatalog(controller.signal)
      .then((data) => {
        setProducts(data.products);
        setCategories(data.categories);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, []);

  const results = useMemo(
    () => filterProducts(products, query, category),
    [products, query, category],
  );

  function handleViewChange(next: ViewMode) {
    setView(next);
    window.localStorage.setItem(VIEW_KEY, next);
  }

  function resetFilters() {
    setQuery("");
    setCategory("All");
  }

  return (
    <section className="flex flex-col gap-8" aria-labelledby="catalog-heading">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Catalog
        </p>
        <h1
          id="catalog-heading"
          className="font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl"
        >
          Considered goods
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Everyday objects from the studio, the trail, and the kitchen — made to
          last and easy to live with.
        </p>
      </header>

      <CatalogToolbar
        query={query}
        onQueryChange={setQuery}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        view={view}
        onViewChange={handleViewChange}
        resultCount={status === "ready" ? results.length : 0}
        totalCount={products.length}
      />

      {status === "loading" ? <CatalogSkeleton layout={view} /> : null}

      {status === "error" ? (
        <EmptyState
          title="Unable to load products"
          description="The catalog could not be retrieved. Check your connection and try again."
          action={
            <Button onClick={() => window.location.reload()}>Try again</Button>
          }
        />
      ) : null}

      {status === "ready" && results.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Nothing matches that search and category. Clear the filters to see the full catalog."
          action={
            <Button variant="secondary" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : null}

      {status === "ready" && results.length > 0 ? (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-3"
          }
        >
          {results.map((product) => (
            <ProductCard key={product.id} product={product} layout={view} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
