import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createActor } from "xstate";
import {
  canAcceptAdd,
  cartCount,
  cartMachine,
  cartSubtotal,
  makeCartItemId,
  type CartItemInput,
} from "./cart-machine";

function product(
  overrides: Partial<CartItemInput> & { productId?: string } = {},
): CartItemInput {
  return {
    productId: "product-001",
    title: "Aero Wireless Headphones",
    price: 50,
    image: "https://example.com/headphones.jpg",
    stock: 24,
    variantLabel: "Color: Graphite",
    quantity: 1,
    ...overrides,
  };
}

function start() {
  const actor = createActor(cartMachine);
  actor.start();
  return actor;
}

describe("cart machine", () => {
  it("starts empty", () => {
    const actor = start();
    assert.equal(actor.getSnapshot().value, "empty");
    assert.deepEqual(actor.getSnapshot().context.items, []);
    actor.stop();
  });

  it("moves from empty to hasItems on ADD_ITEM", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    const snapshot = actor.getSnapshot();
    assert.equal(snapshot.value, "hasItems");
    assert.equal(snapshot.context.items.length, 1);
    assert.equal(snapshot.context.items[0]?.quantity, 1);
    assert.equal(
      snapshot.context.items[0]?.id,
      makeCartItemId("product-001", "Color: Graphite"),
    );
    actor.stop();
  });

  it("increases quantity when the same product is added again", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    actor.send({ type: "ADD_ITEM", item: product({ quantity: 2 }) });
    const item = actor.getSnapshot().context.items[0];
    assert.equal(actor.getSnapshot().value, "hasItems");
    assert.equal(item?.quantity, 3);
    actor.stop();
  });

  it("INCREASE_QUANTITY stays in hasItems and increments", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    const id = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "INCREASE_QUANTITY", id });
    assert.equal(actor.getSnapshot().value, "hasItems");
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 2);
    actor.stop();
  });

  it("DECREASE_QUANTITY reduces quantity but stays in hasItems", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product({ quantity: 3 }) });
    const id = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "DECREASE_QUANTITY", id });
    assert.equal(actor.getSnapshot().value, "hasItems");
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 2);
    actor.stop();
  });

  it("does not decrease below 1", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    const id = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "DECREASE_QUANTITY", id });
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 1);
    assert.equal(actor.getSnapshot().value, "hasItems");
    actor.stop();
  });

  it("UPDATE_QUANTITY sets a valid quantity", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    const id = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "UPDATE_QUANTITY", id, quantity: 5 });
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 5);
    actor.stop();
  });

  it("rejects invalid quantity updates (0, 999999)", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    const id = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "UPDATE_QUANTITY", id, quantity: 0 });
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 1);
    actor.send({ type: "UPDATE_QUANTITY", id, quantity: 999999 });
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 1);
    actor.send({ type: "UPDATE_QUANTITY", id, quantity: -2 });
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 1);
    actor.stop();
  });

  it("returns to empty after removing the last item", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    const id = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "REMOVE_ITEM", id });
    assert.equal(actor.getSnapshot().value, "empty");
    assert.deepEqual(actor.getSnapshot().context.items, []);
    actor.stop();
  });

  it("stays in hasItems after removing one of multiple products", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product() });
    actor.send({
      type: "ADD_ITEM",
      item: product({
        productId: "product-002",
        title: "Field Mechanical Keyboard",
        price: 30,
        variantLabel: "Color: Black",
      }),
    });
    const firstId = actor.getSnapshot().context.items[0]!.id;
    actor.send({ type: "REMOVE_ITEM", id: firstId });
    assert.equal(actor.getSnapshot().value, "hasItems");
    assert.equal(actor.getSnapshot().context.items.length, 1);
    assert.equal(
      actor.getSnapshot().context.items[0]?.title,
      "Field Mechanical Keyboard",
    );
    actor.stop();
  });

  it("CLEAR empties a filled cart", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product({ quantity: 2 }) });
    actor.send({ type: "CLEAR" });
    assert.equal(actor.getSnapshot().value, "empty");
    assert.equal(cartCount(actor.getSnapshot().context.items), 0);
    actor.stop();
  });

  it("computes count and subtotal", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product({ quantity: 2, price: 50 }) });
    actor.send({
      type: "ADD_ITEM",
      item: product({
        productId: "product-b",
        title: "Product B",
        price: 30,
        quantity: 1,
        variantLabel: undefined,
      }),
    });
    const items = actor.getSnapshot().context.items;
    assert.equal(cartCount(items), 3);
    assert.equal(cartSubtotal(items), 130);
    actor.stop();
  });

  it("ignores ADD_ITEM that exceeds stock", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product({ stock: 2, quantity: 2 }) });
    actor.send({ type: "ADD_ITEM", item: product({ stock: 2, quantity: 1 }) });
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 2);
    actor.stop();
  });

  it("does not add an invalid quantity from empty", () => {
    const actor = start();
    actor.send({ type: "ADD_ITEM", item: product({ quantity: 0 }) });
    assert.equal(actor.getSnapshot().value, "empty");
    actor.send({ type: "ADD_ITEM", item: product({ quantity: 999999 }) });
    assert.equal(actor.getSnapshot().value, "empty");
    assert.equal(canAcceptAdd([], product({ quantity: 0 })), false);
    actor.stop();
  });

  it("HYDRATE restores a cart with products", () => {
    const actor = start();
    actor.send({
      type: "HYDRATE",
      items: [
        {
          id: "product-001::",
          productId: "product-001",
          title: "Headphones",
          price: 50,
          image: "https://example.com/h.jpg",
          quantity: 2,
          stock: 10,
        },
      ],
    });
    assert.equal(actor.getSnapshot().value, "hasItems");
    assert.equal(actor.getSnapshot().context.items[0]?.quantity, 2);
    actor.stop();
  });
});
