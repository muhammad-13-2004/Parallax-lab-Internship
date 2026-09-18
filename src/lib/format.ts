export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function stockLabel(stock: number) {
  if (stock <= 0) return "Out of stock";
  if (stock <= 5) return `Low stock · ${stock} left`;
  if (stock <= 12) return `${stock} in stock`;
  return "In stock";
}

export function stockTone(stock: number): "danger" | "warn" | "ok" {
  if (stock <= 0) return "danger";
  if (stock <= 5) return "warn";
  return "ok";
}
