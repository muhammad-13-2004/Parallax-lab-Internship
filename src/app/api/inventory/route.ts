import { NextResponse } from "next/server";
import { readInventorySnapshot, updateInventoryForProduct } from "@/lib/inventory-store";

export async function GET() {
  const products = await readInventorySnapshot();
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { productId?: unknown; quantity?: unknown };
    const quantity = body.quantity;

    if (typeof body.productId !== "string" || typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: "Inventory update requires productId and quantity" }, { status: 400 });
    }

    const updated = await updateInventoryForProduct(body.productId, quantity);
    return NextResponse.json({ productId: body.productId, quantity: updated[body.productId] ?? quantity }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Inventory update failed",
      },
      { status: 400 },
    );
  }
}
