"use client";

import { createActorContext } from "@xstate/react";
import { useEffect, type ReactNode } from "react";
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
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(snapshot.context.items),
      );
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
  const state = CartActorContext.useSelector((snapshot) => snapshot.value);

  return {
    items,
    state,
    isEmpty: state === "empty",
    addItem: (item: CartItemInput) => actor.send({ type: "ADD_ITEM", item }),
    removeItem: (id: string) => actor.send({ type: "REMOVE_ITEM", id }),
    increaseQuantity: (id: string) =>
      actor.send({ type: "INCREASE_QUANTITY", id }),
    decreaseQuantity: (id: string) =>
      actor.send({ type: "DECREASE_QUANTITY", id }),
    updateQuantity: (id: string, quantity: number) =>
      actor.send({ type: "UPDATE_QUANTITY", id, quantity }),
    clear: () => actor.send({ type: "CLEAR" }),
    getSnapshot: () => actor.getSnapshot(),
  };
}

export { cartCount, cartSubtotal };
export type { CartItem, CartItemInput };
