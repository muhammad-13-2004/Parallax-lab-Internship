"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMachine } from "@xstate/react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { checkoutMachine } from "@/lib/checkout-machine";
import {
  paymentSchema,
  shippingSchema,
  type PaymentFields,
  type ShippingFields,
} from "@/lib/checkout-validation";
import { cartSubtotal, useCart } from "@/lib/cart-provider";
import { formatPrice } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";

const steps = ["Cart", "Shipping", "Payment", "Confirmation"];

const emptyShipping: ShippingFields = {
  fullName: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
};

const emptyPayment: PaymentFields = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

function toFieldErrors(issues: readonly { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

function displayCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

export function CheckoutFlow() {
  const { items, clear } = useCart();
  const [snapshot, send, actor] = useMachine(checkoutMachine);
  const [shipping, setShipping] = useState<ShippingFields>(emptyShipping);
  const [payment, setPayment] = useState<PaymentFields>(emptyPayment);
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    send({
      type: "SYNC_CART",
      items: items.map(({ id, title, price, quantity }) => ({
        id,
        title,
        price,
        quantity,
      })),
    });
  }, [items, send]);

  const cartItems = snapshot.context.cartItems;
  const subtotal = cartSubtotal(items);
  const currentStep = snapshot.matches("cart")
    ? 0
    : snapshot.matches("shipping")
      ? 1
      : snapshot.matches("payment")
        ? 2
        : 3;

  function submitShipping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = shippingSchema.safeParse(shipping);
    send({ type: "SUBMIT_SHIPPING", shipping });
    if (!result.success) {
      setShippingErrors(toFieldErrors(result.error.issues));
      notifyError("Please fix the highlighted fields.");
      return;
    }
    setShippingErrors({});
    setShipping(result.data);
    notifySuccess("Shipping information saved");
  }

  function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = paymentSchema.safeParse(payment);
    send({ type: "SUBMIT_PAYMENT", payment });
    if (!result.success) {
      setPaymentErrors(toFieldErrors(result.error.issues));
      notifyError("Please fix the highlighted fields.");
      return;
    }
    setPaymentErrors({});
    setPayment(emptyPayment);
    notifySuccess("Payment details saved", "No payment was processed.");
  }

  function confirmOrder() {
    send({ type: "CONFIRM_ORDER" });
    if (actor.getSnapshot().matches("confirmation")) {
      clear();
      notifySuccess("Order confirmed");
    }
  }

  if (snapshot.matches("cart") && cartItems.length === 0) {
    return (
      <EmptyState
        title="Nothing to check out"
        description="Add a product from the catalog before continuing."
        action={
          <Button asChild>
            <Link href="/">Browse catalog</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Checkout progress">
        <ol className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => {
            const active = index === currentStep;
            const complete = index < currentStep;
            return (
              <li key={step}>
                <div
                  aria-current={active ? "step" : undefined}
                  className={`flex min-h-14 flex-col justify-center border-t-2 pt-2 text-xs sm:flex-row sm:items-center sm:justify-start sm:gap-2 sm:text-sm ${
                    active || complete
                      ? "border-primary text-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <span className="font-semibold tabular-nums">
                    {complete ? "Done" : `0${index + 1}`}
                  </span>
                  <span>{step}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="min-w-0" aria-live="polite">
          {snapshot.matches("cart") ? (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display text-2xl font-medium tracking-tight">
                  Review your cart
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Check items and quantities before entering delivery details.
                </p>
              </div>
              <ul className="divide-y divide-border border-y border-border">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-4 text-sm">
                    <span className="min-w-0 break-words">
                      {item.title} <span className="text-muted-foreground">× {item.quantity}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/cart">Edit cart</Link>
                </Button>
                <Button onClick={() => send({ type: "NEXT" })} disabled={cartItems.length === 0}>
                  Continue to shipping
                </Button>
              </div>
            </div>
          ) : null}

          {snapshot.matches("shipping") ? (
            <form className="flex flex-col gap-6" onSubmit={submitShipping} noValidate>
              <div>
                <h2 className="font-display text-2xl font-medium tracking-tight">
                  Shipping details
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Where should we send your order?
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  name="fullName"
                  autoComplete="name"
                  value={shipping.fullName}
                  error={shippingErrors.fullName}
                  onChange={(event) => setShipping({ ...shipping, fullName: event.target.value })}
                />
                <Input
                  label="Country"
                  name="country"
                  autoComplete="country-name"
                  value={shipping.country}
                  error={shippingErrors.country}
                  onChange={(event) => setShipping({ ...shipping, country: event.target.value })}
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Street address"
                    name="address"
                    autoComplete="street-address"
                    value={shipping.address}
                    error={shippingErrors.address}
                    onChange={(event) => setShipping({ ...shipping, address: event.target.value })}
                  />
                </div>
                <Input
                  label="City"
                  name="city"
                  autoComplete="address-level2"
                  value={shipping.city}
                  error={shippingErrors.city}
                  onChange={(event) => setShipping({ ...shipping, city: event.target.value })}
                />
                <Input
                  label="Postal code"
                  name="postalCode"
                  autoComplete="postal-code"
                  value={shipping.postalCode}
                  error={shippingErrors.postalCode}
                  onChange={(event) => setShipping({ ...shipping, postalCode: event.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => send({ type: "BACK" })}>
                  Back to cart
                </Button>
                <Button type="submit">Continue to payment</Button>
              </div>
            </form>
          ) : null}

          {snapshot.matches("payment") ? (
            snapshot.context.payment ? (
              <div className="flex flex-col gap-6">
                <div>
                  <h2 className="font-display text-2xl font-medium tracking-tight">
                    Review payment
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Demo checkout only. No payment is processed.
                  </p>
                </div>
                <div className="border-y border-border py-4">
                  <p className="font-medium">{snapshot.context.payment.cardholderName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Card ending in {snapshot.context.payment.lastFour}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" onClick={() => send({ type: "BACK" })}>
                    Back to shipping
                  </Button>
                  <Button onClick={confirmOrder}>Confirm order</Button>
                </div>
              </div>
            ) : (
              <form className="flex flex-col gap-6" onSubmit={submitPayment} noValidate>
                <div>
                  <h2 className="font-display text-2xl font-medium tracking-tight">
                    Payment details
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Demo only. Use test data; no payment is processed or stored.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Name on card"
                      name="cardholderName"
                      autoComplete="cc-name"
                      value={payment.cardholderName}
                      error={paymentErrors.cardholderName}
                      onChange={(event) =>
                        setPayment({ ...payment, cardholderName: event.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Card number"
                      name="cardNumber"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={displayCardNumber(payment.cardNumber)}
                      error={paymentErrors.cardNumber}
                      onChange={(event) =>
                        setPayment({
                          ...payment,
                          cardNumber: event.target.value.replace(/\D/g, "").slice(0, 19),
                        })
                      }
                    />
                  </div>
                  <Input
                    label="Expiry (MM/YY)"
                    name="expiry"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    maxLength={5}
                    value={payment.expiry}
                    error={paymentErrors.expiry}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                      setPayment({
                        ...payment,
                        expiry:
                          digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits,
                      });
                    }}
                  />
                  <Input
                    label="Security code"
                    name="cvv"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={payment.cvv}
                    error={paymentErrors.cvv}
                    onChange={(event) =>
                      setPayment({
                        ...payment,
                        cvv: event.target.value.replace(/\D/g, "").slice(0, 4),
                      })
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="secondary" onClick={() => send({ type: "BACK" })}>
                    Back to shipping
                  </Button>
                  <Button type="submit">Review order</Button>
                </div>
              </form>
            )
          ) : null}

          {snapshot.matches("confirmation") && snapshot.context.order ? (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Confirmed
                </p>
                <h2 className="mt-2 font-display text-3xl font-medium tracking-tight">
                  Thank you for your order.
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Order {snapshot.context.order.orderNumber}. No payment was processed.
                </p>
              </div>
              <p className="text-sm">
                Shipping to {snapshot.context.shipping?.fullName} in{" "}
                {snapshot.context.shipping?.city}, {snapshot.context.shipping?.country}.
              </p>
              <Button asChild className="w-fit">
                <Link href="/">Continue shopping</Link>
              </Button>
            </div>
          ) : null}
        </section>

        <aside
          aria-labelledby="checkout-summary-heading"
          className="border-t border-border pt-5 lg:sticky lg:top-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"
        >
          <h2 id="checkout-summary-heading" className="font-medium">
            Order summary
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {(snapshot.context.order?.items ?? cartItems).map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">
                  {item.title} × {item.quantity}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-border pt-4 font-medium">
            <span>Total</span>
            <span className="tabular-nums">
              {formatPrice(snapshot.context.order?.total ?? subtotal)}
            </span>
          </p>
        </aside>
      </div>
    </div>
  );
}
