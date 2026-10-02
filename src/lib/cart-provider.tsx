"use client";

import { createActorContext } from "@xstate/react";
import { useEffect, type ReactNode } from "react";
import { notifyError, notifySuccess } from "@/lib/notify";
import { runOptimisticCartMutation, type CartMutation } from "@/lib/cart-operations";
import {
  cartCount,
  cartMachine,
  cartSubtotal,
  type CartItem,
  type CartItemInput,
} from "@/lib/cart-machine";

export const CartActorContext = createActorContext(cartMachine);

const STORAGE_KEY = "northline-cart-machine";
const LEGACY_KEY = "northline-cart";

function normalizeItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const entry = item as CartItem;
      return {
        ...entry,
        stock: typeof entry.stock === "number" ? entry.stock : 99,
        quantity: typeof entry.quantity === "number" ? entry.quantity : 1,
      };
    });
}

function readStoredItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) {
      return normalizeItems(JSON.parse(current));
    }
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { state?: { items?: unknown } };
      return normalizeItems(parsed?.state?.items);
    }
  } catch {
    return [];
  }
  return [];
}

function PersistAndHydrate() {
  const actor = CartActorContext.useActorRef();

  useEffect(() => {
    const stored = readStoredItems();
    if (stored.length > 0) {
      actor.send({ type: "HYDRATE", items: stored });
    }
    const subscription = actor.subscribe((snapshot) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.context.items));
    });
    return () => subscription.unsubscribe();
  }, [actor]);

  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <CartActorContext.Provider>
      <PersistAndHydrate />
      {children}
    </CartActorContext.Provider>
  );
}

export function useCart() {
  const actor = CartActorContext.useActorRef();
  const items = CartActorContext.useSelector((snapshot) => snapshot.context.items);
  const pending = CartActorContext.useSelector((snapshot) => snapshot.context.pending);
  const state = CartActorContext.useSelector((snapshot) => snapshot.value);

  async function persistMutation(mutation: CartMutation) {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mutation),
    });
    if (!response.ok) throw new Error("Cart update was rejected");
  }

  async function updateQuantity(id: string, quantity: number) {
    const result = await runOptimisticCartMutation(
      actor,
      { type: "UPDATE_QUANTITY", id, quantity },
      persistMutation,
    );
    if (result === "saved") notifySuccess("Cart updated");
    if (result === "failed") {
      notifyError("Unable to update cart", "Your previous quantity has been restored.");
    }
    if (result === "invalid") notifyError("Invalid quantity");
    return result;
  }

  async function removeItem(id: string) {
    const result = await runOptimisticCartMutation(
      actor,
      { type: "REMOVE_ITEM", id },
      persistMutation,
    );
    if (result === "saved") notifySuccess("Removed from cart");
    if (result === "failed") {
      notifyError("Unable to remove item", "Your previous cart has been restored.");
    }
    return result;
  }

  return {
    items,
    state,
    isEmpty: state === "empty",
    addItem: (item: CartItemInput) => actor.send({ type: "ADD_ITEM", item }),
    isPending: (id: string) => Boolean(pending[id]),
    removeItem,
    increaseQuantity: (id: string) => {
      const item = actor.getSnapshot().context.items.find((entry) => entry.id === id);
      return item ? updateQuantity(id, item.quantity + 1) : Promise.resolve("invalid" as const);
    },
    decreaseQuantity: (id: string) => {
      const item = actor.getSnapshot().context.items.find((entry) => entry.id === id);
      return item ? updateQuantity(id, item.quantity - 1) : Promise.resolve("invalid" as const);
    },
    updateQuantity,
    clear: () => actor.send({ type: "CLEAR" }),
    getSnapshot: () => actor.getSnapshot(),
  };
}

export { cartCount, cartSubtotal };
export type { CartItem, CartItemInput };
