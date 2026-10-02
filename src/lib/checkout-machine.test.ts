import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createActor } from "xstate";
import { checkoutMachine } from "@/lib/checkout-machine";
import type { PaymentFields, ShippingFields } from "@/lib/checkout-validation";

const shipping: ShippingFields = {
  fullName: "Morgan Lee",
  address: "18 Northline Road",
  city: "Portland",
  postalCode: "97205",
  country: "United States",
};

const payment: PaymentFields = {
  cardholderName: "Morgan Lee",
  cardNumber: "4242424242424242",
  expiry: "12/35",
  cvv: "123",
};

function startCheckout(withCart = true) {
  const actor = createActor(checkoutMachine);
  actor.start();
  if (withCart) {
    actor.send({
      type: "SYNC_CART",
      items: [{ id: "item-1", title: "Trail pack", price: 90, quantity: 1 }],
    });
  }
  return actor;
}

function goToShipping(actor: ReturnType<typeof startCheckout>) {
  actor.send({ type: "NEXT" });
}

function goToPayment(actor: ReturnType<typeof startCheckout>) {
  goToShipping(actor);
  actor.send({ type: "SUBMIT_SHIPPING", shipping });
}

describe("checkout machine", () => {
  it("moves from CART to SHIPPING only with cart items", () => {
    const actor = startCheckout(false);
    actor.send({ type: "NEXT" });
    assert.equal(actor.getSnapshot().value, "cart");
    actor.send({
      type: "SYNC_CART",
      items: [{ id: "item-1", title: "Trail pack", price: 90, quantity: 1 }],
    });
    actor.send({ type: "NEXT" });
    assert.equal(actor.getSnapshot().value, "shipping");
    actor.stop();
  });

  it("moves from SHIPPING to PAYMENT only after valid shipping submission", () => {
    const actor = startCheckout();
    goToShipping(actor);
    actor.send({
      type: "SUBMIT_SHIPPING",
      shipping: { ...shipping, postalCode: "!" },
    });
    assert.equal(actor.getSnapshot().value, "shipping");
    actor.send({ type: "SUBMIT_SHIPPING", shipping });
    assert.equal(actor.getSnapshot().value, "payment");
    assert.equal(actor.getSnapshot().context.shipping?.city, "Portland");
    actor.stop();
  });

  it("does not save invalid payment or allow confirmation", () => {
    const actor = startCheckout();
    goToPayment(actor);
    actor.send({ type: "SUBMIT_PAYMENT", payment: { ...payment, cvv: "1" } });
    actor.send({ type: "CONFIRM_ORDER" });
    assert.equal(actor.getSnapshot().value, "payment");
    assert.equal(actor.getSnapshot().context.payment, null);
    assert.equal(actor.getSnapshot().context.order, null);
    actor.stop();
  });

  it("moves from PAYMENT to CONFIRMATION only after payment is saved", () => {
    const actor = startCheckout();
    goToPayment(actor);
    actor.send({ type: "CONFIRM_ORDER" });
    assert.equal(actor.getSnapshot().value, "payment");
    actor.send({ type: "SUBMIT_PAYMENT", payment });
    assert.equal(actor.getSnapshot().value, "payment");
    assert.deepEqual(actor.getSnapshot().context.payment, {
      cardholderName: "Morgan Lee",
      lastFour: "4242",
    });
    actor.send({ type: "CONFIRM_ORDER" });
    assert.equal(actor.getSnapshot().value, "confirmation");
    assert.match(actor.getSnapshot().context.order?.orderNumber ?? "", /^NL-/);
    assert.equal(actor.getSnapshot().context.order?.total, 90);
    actor.stop();
  });

  it("supports back navigation from shipping and payment", () => {
    const actor = startCheckout();
    goToShipping(actor);
    actor.send({ type: "BACK" });
    assert.equal(actor.getSnapshot().value, "cart");
    goToPayment(actor);
    actor.send({ type: "BACK" });
    assert.equal(actor.getSnapshot().value, "shipping");
    actor.stop();
  });

  it("RESET returns to cart and clears checkout data", () => {
    const actor = startCheckout();
    goToPayment(actor);
    actor.send({ type: "SUBMIT_PAYMENT", payment });
    actor.send({ type: "RESET" });
    const snapshot = actor.getSnapshot();
    assert.equal(snapshot.value, "cart");
    assert.deepEqual(snapshot.context.shipping, null);
    assert.deepEqual(snapshot.context.payment, null);
    assert.deepEqual(snapshot.context.order, null);
    assert.equal(snapshot.context.cartItems.length, 1);
    actor.stop();
  });
});
