"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { QuantitySelector } from "@/components/catalog/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  canAcceptDecrease,
  canAcceptIncrease,
  canAcceptUpdate,
} from "@/lib/cart-machine";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-provider";
import { formatPrice } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";

export default function CartPage() {
  const {
    items,
    isEmpty,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    updateQuantity,
  } = useCart();
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  return (
    <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-medium tracking-tight">Your cart</h1>
      <p className="mt-2 text-muted-foreground">
        {isEmpty
          ? "Your bag is empty."
          : `${count} ${count === 1 ? "item" : "items"} ready for checkout.`}
      </p>

      {isEmpty ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Browse the catalog and add something you want to live with."
            action={
              <Button asChild>
                <Link href="/">Continue shopping</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-border sm:flex-row sm:items-center"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  width={96}
                  height={96}
                  className="size-24 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.productId}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {item.title}
                  </Link>
                  {item.variantLabel ? (
                    <p className="text-sm text-muted-foreground">
                      {item.variantLabel}
                    </p>
                  ) : null}
                  <p className="mt-1 tabular-nums">{formatPrice(item.price)}</p>
                </div>
                <div className="flex flex-wrap items-end gap-3 sm:items-center">
                  <QuantitySelector
                    compact
                    label={`Quantity for ${item.title}`}
                    value={item.quantity}
                    stock={item.stock}
                    onValidChange={(next) => {
                      if (next === item.quantity + 1) {
                        if (!canAcceptIncrease(items, item.id)) {
                          notifyError(
                            "Invalid quantity",
                            `Only ${item.stock} in stock.`,
                          );
                          return;
                        }
                        increaseQuantity(item.id);
                        return;
                      }
                      if (next === item.quantity - 1) {
                        if (!canAcceptDecrease(items, item.id)) return;
                        decreaseQuantity(item.id);
                        return;
                      }
                      if (!canAcceptUpdate(items, item.id, next)) {
                        notifyError("Invalid quantity");
                        return;
                      }
                      updateQuantity(item.id, next);
                    }}
                    onInvalid={(message) =>
                      notifyError("Invalid quantity", message)
                    }
                  />
                  <p className="min-w-16 text-right font-medium tabular-nums">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.title} from cart`}
                    onClick={() => {
                      removeItem(item.id);
                      notifySuccess("Removed from cart", item.title);
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 rounded-xl bg-surface p-5 shadow-border sm:flex-row sm:items-center sm:justify-between">
            <p className="text-lg">
              Subtotal{" "}
              <span className="font-medium tabular-nums">
                {formatPrice(subtotal)}
              </span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="secondary" size="lg">
                <Link href="/">Continue shopping</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/checkout">Checkout</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
