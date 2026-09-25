import type { Product } from "@/types/product";

export function getProductImages(product: Product): string[] {
  const crops = ["top", "left", "entropy"];
  const variants = crops.map((crop) => {
    try {
      const url = new URL(product.image);
      url.searchParams.set("crop", crop);
      return url.toString();
    } catch {
      return product.image;
    }
  });
  return [product.image, ...variants];
}
