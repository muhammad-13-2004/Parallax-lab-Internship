import productsData from "@/data/products.json";
import { filterProducts } from "@/lib/filter";
import { getProductImages } from "@/lib/product-images";
import type { Product } from "@/types/product";

const products = productsData as Product[];

export function getAllProducts(): Product[] {
  return products;
}

export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function getCategories(): string[] {
  return [...new Set(products.map((product) => product.category))].sort();
}

export { filterProducts, getProductImages };
