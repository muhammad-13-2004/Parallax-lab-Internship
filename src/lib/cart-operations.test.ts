import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createActor } from "xstate";
import { cartMachine, type CartItemInput } from "@/lib/cart-machine";
import { runOptimisticCartMutation } from "@/lib/cart-operations";

function product(productId: string, quantity = 1): CartItemInput {
  return {
    productId,
    title: `Product ${productId}`,
    price: 50,
    image: "https://example.com/product.jpg",
    stock: 20,
    quantity,
  };
}

function startCart() {
  const actor = createActor(cartMachine);
  actor.start();
  actor.send({ type: "ADD_ITEM", item: product("product-001", 2) });
  actor.send({ type: "ADD_ITEM", item: product("product-002", 3) });
  return actor;
}

describe("optimistic cart operations", () => {
  it("keeps a successful quantity update and emits settlement", async () => {
    const actor = startCart();
    const id = actor.getSnapshot().context.items[0]!.id;
    const events: string[] = [];
    actor.subscribe((snapshot) => {
      const pending = snapshot.context.pending[id];
      events.push(
        pending
          ? "pending"
          : snapshot.context.items.some((item) => item.id === id)
            ? "settled"
            : "removed",
      );
    });

    const result = await runOptimisticCartMutation(
      actor,
      { type: "UPDATE_QUANTITY", id, quantity: 4 },
      async () => {},
    );

    assert.equal(result, "saved");
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 4);
    assert.deepEqual(actor.getSnapshot().context.pending, {});
    assert.ok(events.includes("pending"));
    assert.ok(events.includes("settled"));
    actor.stop();
  });

  it("updates immediately and rolls back a failed quantity update", async () => {
    const actor = startCart();
    const id = actor.getSnapshot().context.items[0]!.id;
    let rejectRequest!: (error: Error) => void;
    const request = new Promise<void>((_resolve, reject) => {
      rejectRequest = reject;
    });

    const operation = runOptimisticCartMutation(
      actor,
      { type: "UPDATE_QUANTITY", id, quantity: 6 },
      () => request,
    );
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 6);
    assert.equal(Object.keys(actor.getSnapshot().context.pending).length, 1);
    rejectRequest(new Error("Service unavailable"));

    assert.equal(await operation, "failed");
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 2);
    assert.equal(actor.getSnapshot().context.items[1]?.quantity, 3);
    assert.deepEqual(actor.getSnapshot().context.pending, {});
    actor.stop();
  });

  it("keeps a successful item removal", async () => {
    const actor = startCart();
    const id = actor.getSnapshot().context.items[0]!.id;

    const result = await runOptimisticCartMutation(
      actor,
      { type: "REMOVE_ITEM", id },
      async () => {},
    );

    assert.equal(result, "saved");
    assert.deepEqual(
      actor.getSnapshot().context.items.map((item) => item.productId),
      ["product-002"],
    );
    assert.deepEqual(actor.getSnapshot().context.pending, {});
    actor.stop();
  });

  it("restores a failed removal at its previous position", async () => {
    const actor = startCart();
    const id = actor.getSnapshot().context.items[0]!.id;
    let rejectRequest!: (error: Error) => void;
    const request = new Promise<void>((_resolve, reject) => {
      rejectRequest = reject;
    });

    const operation = runOptimisticCartMutation(actor, { type: "REMOVE_ITEM", id }, () => request);
    assert.deepEqual(
      actor.getSnapshot().context.items.map((item) => item.productId),
      ["product-002"],
    );
    rejectRequest(new Error("Service unavailable"));

    assert.equal(await operation, "failed");
    assert.deepEqual(
      actor.getSnapshot().context.items.map((item) => item.productId),
      ["product-001", "product-002"],
    );
    assert.equal(actor.getSnapshot().value, "hasItems");
    actor.stop();
  });

  it("rejects a rapid same-item operation while persistence is pending", async () => {
    const actor = startCart();
    const id = actor.getSnapshot().context.items[0]!.id;
    let resolveRequest!: () => void;
    const request = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });

    const first = runOptimisticCartMutation(
      actor,
      { type: "UPDATE_QUANTITY", id, quantity: 4 },
      () => request,
    );
    const second = await runOptimisticCartMutation(
      actor,
      { type: "UPDATE_QUANTITY", id, quantity: 5 },
      async () => {},
    );
    resolveRequest();

    assert.equal(second, "busy");
    assert.equal(await first, "saved");
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 4);
    actor.stop();
  });
});
