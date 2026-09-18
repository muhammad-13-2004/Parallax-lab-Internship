export type ProductVariant = {
  name: string;
  options: string[];
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  variants: ProductVariant[];
  stock: number;
};

export type CatalogResponse = {
  products: Product[];
  categories: string[];
};

export type ViewMode = "grid" | "list";
