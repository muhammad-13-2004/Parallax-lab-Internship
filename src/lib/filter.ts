import type { Product } from "@/types/product";

export function filterProducts(
  list: Product[],
  query: string,
  category: string,
): Product[] {
  const needle = query.trim().toLowerCase();
  const categoryFilter = category.trim();
  const matchAll = !categoryFilter || categoryFilter === "All";

  return list.filter((product) => {
    const matchesCategory = matchAll || product.category === categoryFilter;
    if (!matchesCategory) return false;
    if (!needle) return true;
    return (
      product.title.toLowerCase().includes(needle) ||
      product.description.toLowerCase().includes(needle) ||
      product.category.toLowerCase().includes(needle)
    );
  });
}
