import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  paymentSchema,
  passesLuhn,
  shippingSchema,
  type PaymentFields,
  type ShippingFields,
} from "@/lib/checkout-validation";

const validShipping: ShippingFields = {
  fullName: "Morgan Lee",
  address: "18 Northline Road",
  city: "Portland",
  postalCode: "97205",
  country: "United States",
};

function futureExpiry() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 2);
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
}

const validPayment: PaymentFields = {
  cardholderName: "Morgan Lee",
  cardNumber: "4242424242424242",
  expiry: futureExpiry(),
  cvv: "123",
};

describe("checkout validation", () => {
  it("trims valid shipping values and rejects missing or overlong fields", () => {
    const result = shippingSchema.safeParse({
      ...validShipping,
      fullName: " Morgan Lee ",
    });
    assert.equal(result.success, true);
    if (result.success) assert.equal(result.data.fullName, "Morgan Lee");

    assert.equal(shippingSchema.safeParse({ ...validShipping, address: "Road" }).success, false);
    assert.equal(
      shippingSchema.safeParse({ ...validShipping, city: "a".repeat(81) }).success,
      false,
    );
  });

  it("validates card number checksum, expiry, and security code", () => {
    assert.equal(passesLuhn("4242424242424242"), true);
    assert.equal(passesLuhn("4242424242424241"), false);
    assert.equal(paymentSchema.safeParse(validPayment).success, true);
    assert.equal(
      paymentSchema.safeParse({ ...validPayment, cardNumber: "4242424242424241" }).success,
      false,
    );
    assert.equal(paymentSchema.safeParse({ ...validPayment, expiry: "13/35" }).success, false);
    assert.equal(paymentSchema.safeParse({ ...validPayment, cvv: "12" }).success, false);
  });

  it("rejects expired cards", () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const expired = `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getFullYear()).slice(-2)}`;
    assert.equal(paymentSchema.safeParse({ ...validPayment, expiry: expired }).success, false);
  });
});
