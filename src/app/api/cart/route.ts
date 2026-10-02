import { NextResponse } from "next/server";
import { getProductById } from "@/lib/catalog";
import { maxAllowed } from "@/lib/quantity";

type CartMutationBody = {
  type?: unknown;
  id?: unknown;
  quantity?: unknown;
};

export async function POST(request: Request) {
  let body: CartMutationBody;
  try {
    body = (await request.json()) as CartMutationBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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

  if (body.type === "UPDATE_QUANTITY") {
    if (
      typeof body.quantity !== "number" ||
      !Number.isInteger(body.quantity) ||
      body.quantity < 1 ||
      body.quantity > maxAllowed(product.stock)
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
