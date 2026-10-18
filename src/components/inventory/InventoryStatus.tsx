"use client";

import { Badge } from "@/components/ui/Badge";
import { useInventoryStream } from "@/lib/inventory-client";
import { stockLabel, stockTone } from "@/lib/format";

type InventoryStatusProps = {
  productId?: string;
  fallbackStock?: number;
};

export function InventoryStatus({ productId, fallbackStock }: InventoryStatusProps) {
  const { status, products, error } = useInventoryStream();
  const liveStock = productId ? products[productId] ?? fallbackStock : undefined;
  const label =
    status === "connected"
      ? "Connected"
      : status === "reconnecting"
        ? "Reconnecting"
        : "Offline";

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      <span
        aria-hidden="true"
        className={[
          "inline-block size-2 rounded-full",
          status === "connected" ? "bg-emerald-500" : status === "reconnecting" ? "bg-amber-500" : "bg-slate-400",
        ].join(" ")}
      />
      <span className="font-medium text-foreground">{label}</span>
      {productId && typeof liveStock === "number" ? (
        <Badge tone={stockTone(liveStock)}>{stockLabel(liveStock)}</Badge>
      ) : null}
      {error ? <span className="sr-only">{error}</span> : null}
    </div>
  );
}
