export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

export type QuantityResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

export function maxAllowed(stock: number) {
  return Math.min(Math.max(0, stock), MAX_QUANTITY);
}

export function parseQuantity(
  raw: string,
  stock = MAX_QUANTITY,
): QuantityResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, message: "Enter a quantity" };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, message: "Quantity must be a whole number" };
  }
  const value = Number(trimmed);
  if (value < MIN_QUANTITY) {
    return { ok: false, message: "Quantity must be at least 1" };
  }
  if (value > MAX_QUANTITY) {
    return { ok: false, message: `Quantity cannot exceed ${MAX_QUANTITY}` };
  }
  const available = maxAllowed(stock);
  if (available <= 0) {
    return { ok: false, message: "This item is out of stock" };
  }
  if (value > available) {
    return { ok: false, message: `Only ${available} in stock` };
  }
  return { ok: true, value };
}
