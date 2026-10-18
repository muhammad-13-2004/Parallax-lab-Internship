import { NextResponse } from "next/server";
import { getProductById } from "@/lib/catalog";
import { readInventorySnapshot } from "@/lib/inventory-store";
import { maxAllowed } from "@/lib/quantity";

type CartMutationBody = {
  type?: unknown;
  id?: unknown;
  quantity?: unknown;
  items?: unknown;
};

export async function POST(request: Request) {
  let body: CartMutationBody;
  try {
    body = (await request.json()) as CartMutationBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.type === "VALIDATE_CHECKOUT") {
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ error: "Checkout validation requires a cart" }, { status: 400 });
    }

    const inventory = await readInventorySnapshot();
    const problems: Array<{ productId: string; available: number; requested: number }> = [];

    for (const item of body.items) {
      if (!item || typeof item !== "object") continue;
      const entry = item as { id?: unknown; quantity?: unknown };
      if (typeof entry.id !== "string" || typeof entry.quantity !== "number") continue;
      const productId = entry.id.split("::", 1)[0];
      const product = productId ? getProductById(productId) : undefined;
      if (!product) continue;
      const available = Math.max(0, inventory[productId] ?? product.stock);
      const requested = Number.isInteger(entry.quantity) ? entry.quantity : 0;
      if (requested > maxAllowed(available)) {
        problems.push({ productId, available, requested });
      }
    }

    if (problems.length > 0) {
      return NextResponse.json(
        {
          error: "One or more items no longer have enough stock for checkout.",
          issues: problems,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  }

  if (
    typeof body.id !== "string" ||
    (body.type !== "UPDATE_QUANTITY" && body.type !== "REMOVE_ITEM")
  ) {
    return NextResponse.json({ error: "Invalid cart operation" }, { status: 400 });
  }

  const productId = body.id.split("::", 1)[0];
  const product = productId ? getProductById(productId) : undefined;
  if (!product) {
    return NextResponse.json({ error: "Product no longer exists" }, { status: 404 });
  }

  const inventory = await readInventorySnapshot();
  const liveStock = Math.max(0, inventory[productId] ?? product.stock);

  if (body.type === "UPDATE_QUANTITY") {
    if (
      typeof body.quantity !== "number" ||
      !Number.isInteger(body.quantity) ||
      body.quantity < 1 ||
      body.quantity > maxAllowed(liveStock)
    ) {
      return NextResponse.json(
        { error: "Requested quantity is no longer available" },
        { status: 409 },
      );
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 180));
  return new NextResponse(null, { status: 204 });
}
