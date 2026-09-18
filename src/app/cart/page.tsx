"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cartCount, cartSubtotal, useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const count = cartCount(items);
  const subtotal = cartSubtotal(items);

  return (
    <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-medium tracking-tight">Cart</h1>
      <p className="mt-2 text-muted-foreground">
        {count === 0
          ? "Your bag is empty."
          : `${count} ${count === 1 ? "item" : "items"} ready for checkout.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Browse the catalog and add something you want to live with."
            action={
              <Button asChild>
                <Link href="/">Back to catalog</Link>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Decrease quantity of ${item.title}`}
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="size-4" aria-hidden="true" />
                  </Button>
                  <span className="min-w-8 text-center tabular-nums" aria-live="polite">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Increase quantity of ${item.title}`}
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.title} from cart`}
                    onClick={() => removeItem(item.id)}
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
            <Button asChild size="lg">
              <Link href="/checkout">Continue to checkout</Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
