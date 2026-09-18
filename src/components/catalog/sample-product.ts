import type { Product } from "@/types/product";

export const sampleProduct: Product = {
  id: "product-001",
  title: "Aero Wireless Headphones",
  description:
    "Over-ear wireless headphones with active noise cancellation, 32-hour battery life, and a breathable knit headband for all-day listening.",
  price: 229,
  category: "Electronics",
  image:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&h=900&q=80",
  variants: [{ name: "Color", options: ["Graphite", "Ivory", "Sage"] }],
  stock: 24,
};

export const lowStockProduct: Product = {
  ...sampleProduct,
  id: "product-008",
  title: "Field Camera Compact",
  stock: 3,
};

export const outOfStockProduct: Product = {
  ...sampleProduct,
  id: "product-058",
  title: "Tinted Lip Balm Set",
  category: "Beauty",
  stock: 0,
};
