import type { CatalogResponse, Product } from "@/types/product";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogResponse> {
  const response = await fetch("/api/products", {
    signal,
    cache: "no-store",
  });
  return readJson<CatalogResponse>(response);
}

export async function fetchProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    signal,
    cache: "no-store",
  });
  if (response.status === 404) {
    throw new Error("Product not found");
  }
  const data = await readJson<{ product: Product }>(response);
  return data.product;
}

export { filterProducts } from "@/lib/filter";
