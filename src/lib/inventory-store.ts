import { promises as fs } from "node:fs";
import path from "node:path";
import productsData from "@/data/products.json";

export type InventorySnapshot = Record<string, number>;

const defaultInventory = Object.fromEntries(
  (productsData as Array<{ id: string; stock: number }>).map((product) => [product.id, product.stock]),
) as InventorySnapshot;

export const INVENTORY_PATH =
  process.env.NORTHLINE_INVENTORY_PATH ?? path.join(process.cwd(), ".northline-inventory.json");

export async function readInventorySnapshot(): Promise<InventorySnapshot> {
  try {
    const file = await fs.readFile(INVENTORY_PATH, "utf8");
    const parsed = JSON.parse(file) as Record<string, unknown>;
    const inventory: InventorySnapshot = {};
    for (const [productId, rawValue] of Object.entries(parsed)) {
      if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
        inventory[productId] = Math.max(0, Math.trunc(rawValue));
      }
    }
    return inventory;
  } catch {
    await writeInventorySnapshot(defaultInventory);
    return { ...defaultInventory };
  }
}

export async function writeInventorySnapshot(snapshot: InventorySnapshot): Promise<InventorySnapshot> {
  const normalized: InventorySnapshot = {};
  for (const [productId, value] of Object.entries(snapshot)) {
    normalized[productId] = Math.max(0, Math.trunc(Number(value) || 0));
  }
  await fs.mkdir(path.dirname(INVENTORY_PATH), { recursive: true });
  await fs.writeFile(INVENTORY_PATH, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function syncInventoryWithCatalog(): Promise<InventorySnapshot> {
  const snapshot = await readInventorySnapshot();
  const merged: InventorySnapshot = { ...defaultInventory };
  for (const [productId, value] of Object.entries(snapshot)) {
    if (productId in merged) {
      merged[productId] = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : merged[productId];
    }
  }
  return writeInventorySnapshot(merged);
}

export async function updateInventoryForProduct(
  productId: string,
  quantity: number,
): Promise<InventorySnapshot> {
  const snapshot = await readInventorySnapshot();
  if (!(productId in defaultInventory)) {
    throw new Error(`Unknown product: ${productId}`);
  }
  const nextQuantity = Math.max(0, Math.trunc(quantity));
  snapshot[productId] = nextQuantity;
  return writeInventorySnapshot(snapshot);
}

export { defaultInventory };
