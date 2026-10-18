"use client";

import { AddToCart } from "@/components/catalog/AddToCart";
import { InventoryStatus } from "@/components/inventory/InventoryStatus";
import { Badge } from "@/components/ui/Badge";
import { useInventoryStream } from "@/lib/inventory-client";
import { formatPrice, stockLabel, stockTone } from "@/lib/format";
import type { Product } from "@/types/product";

type ProductDetailStateProps = {
  product: Product;
};

export function ProductDetailState({ product }: ProductDetailStateProps) {
  const { products } = useInventoryStream();
  const liveStock = products[product.id] ?? product.stock;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{product.category}</Badge>
          <Badge tone={stockTone(liveStock)}>{stockLabel(liveStock)}</Badge>
          <InventoryStatus productId={product.id} fallbackStock={product.stock} />
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tight">{product.title}</h1>
        <p className="text-2xl font-medium tabular-nums">{formatPrice(product.price)}</p>
        <p className="max-w-xl text-base leading-7 text-muted-foreground">{product.description}</p>
        <p className="text-sm text-muted-foreground">
          {liveStock > 0 ? `${liveStock} available` : "Currently unavailable"}
        </p>
      </div>
      <AddToCart product={product} liveStock={liveStock} />
    </div>
  );
}
