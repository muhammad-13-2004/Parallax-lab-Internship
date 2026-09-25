"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { cartSubtotal, useCart } from "@/lib/cart-provider";
import { formatPrice } from "@/lib/format";
import { notifySuccess } from "@/lib/notify";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const [placed, setPlaced] = useState(false);
  const subtotal = cartSubtotal(items);

  if (placed) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <EmptyState
          title="Order received"
          description="This is a demonstration checkout. No payment was processed and nothing will be shipped."
          action={
            <Button asChild>
              <Link href="/">Return to catalog</Link>
            </Button>
          }
        />
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-medium tracking-tight">Checkout</h1>
        <div className="mt-10">
          <EmptyState
            title="Nothing to check out"
            description="Add a product from the catalog before continuing."
            action={
              <Button asChild>
                <Link href="/">Browse catalog</Link>
              </Button>
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-medium tracking-tight">Checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Demonstration only — details stay in this browser and no payment is taken.
      </p>
      <form
        className="mt-8 flex flex-col gap-8"
        onSubmit={(event) => {
          event.preventDefault();
          clear();
          setPlaced(true);
          notifySuccess("Order received", "No payment was processed.");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" name="name" required autoComplete="name" />
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              name="address"
              required
              autoComplete="street-address"
            />
          </div>
          <Input label="City" name="city" required autoComplete="address-level2" />
          <Input
            label="Postal code"
            name="postal"
            required
            autoComplete="postal-code"
          />
        </div>
        <section aria-labelledby="order-summary-heading" className="rounded-xl bg-surface p-5 shadow-border">
          <h2 id="order-summary-heading" className="font-medium">
            Order summary
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4">
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span className="tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-border pt-4 text-base">
            <span>Total</span>
            <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
          </p>
        </section>
        <Button type="submit" size="lg">
          Place order
        </Button>
      </form>
    </main>
  );
}
