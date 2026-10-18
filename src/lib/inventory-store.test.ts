import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { POST } from "@/app/api/cart/route";
import { readInventorySnapshot, updateInventoryForProduct } from "@/lib/inventory-store";

describe("inventory checkout validation", () => {
  it("rejects checkout when stock falls below the cart quantity", async () => {
    const snapshotBefore = await readInventorySnapshot();
    const restored = await updateInventoryForProduct("product-001", 1);
    const response = await POST(
      new Request("http://localhost/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "VALIDATE_CHECKOUT",
          items: [{ id: "product-001::Graphite", quantity: 2 }],
        }),
      }),
    );

    assert.equal(response.status, 409);
    const payload = (await response.json()) as { error?: string };
    assert.match(payload.error ?? "", /stock|inventory/i);

    await updateInventoryForProduct("product-001", snapshotBefore["product-001"] ?? restored["product-001"] ?? 24);
  });
});
