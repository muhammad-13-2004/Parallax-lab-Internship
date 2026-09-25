import { assign, setup } from "xstate";
import { MAX_QUANTITY, maxAllowed } from "./quantity";

export type CartItem = {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  variantLabel?: string;
};

export type CartItemInput = Omit<CartItem, "id" | "quantity"> & {
  quantity?: number;
};

export type CartContext = {
  items: CartItem[];
};

export type CartEvent =
  | { type: "ADD_ITEM"; item: CartItemInput }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "INCREASE_QUANTITY"; id: string }
  | { type: "DECREASE_QUANTITY"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

export function makeCartItemId(productId: string, variantLabel?: string) {
  return `${productId}::${variantLabel ?? ""}`;
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function toCartItem(incoming: CartItemInput, quantity: number): CartItem {
  return {
    id: makeCartItemId(incoming.productId, incoming.variantLabel),
    productId: incoming.productId,
    title: incoming.title,
    price: incoming.price,
    image: incoming.image,
    quantity,
    stock: incoming.stock,
    variantLabel: incoming.variantLabel,
  };
}

export function canAcceptAdd(items: CartItem[], incoming: CartItemInput) {
  const addBy = incoming.quantity ?? 1;
  if (!Number.isInteger(addBy) || addBy < 1 || addBy > MAX_QUANTITY) {
    return false;
  }
  const id = makeCartItemId(incoming.productId, incoming.variantLabel);
  const existing = items.find((item) => item.id === id);
  const current = existing?.quantity ?? 0;
  const stock = existing?.stock ?? incoming.stock;
  return current + addBy <= maxAllowed(stock);
}

export function canAcceptIncrease(items: CartItem[], id: string) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return false;
  return item.quantity + 1 <= maxAllowed(item.stock);
}

export function canAcceptDecrease(items: CartItem[], id: string) {
  const item = items.find((entry) => entry.id === id);
  return Boolean(item && item.quantity > 1);
}

export function canAcceptUpdate(
  items: CartItem[],
  id: string,
  quantity: number,
) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return false;
  return (
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= maxAllowed(item.stock)
  );
}

function addToItems(items: CartItem[], incoming: CartItemInput): CartItem[] {
  const addBy = incoming.quantity ?? 1;
  const id = makeCartItemId(incoming.productId, incoming.variantLabel);
  const existing = items.find((item) => item.id === id);
  if (existing) {
    return items.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + addBy } : item,
    );
  }
  return [...items, toCartItem(incoming, addBy)];
}

export const cartMachine = setup({
  types: {
    context: {} as CartContext,
    events: {} as CartEvent,
  },
  guards: {
    cartHasItems: ({ context }) => context.items.length > 0,
    cartIsEmpty: ({ context }) => context.items.length === 0,
    hydrateHasItems: ({ event }) =>
      event.type === "HYDRATE" && event.items.length > 0,
    canAdd: ({ context, event }) =>
      event.type === "ADD_ITEM" && canAcceptAdd(context.items, event.item),
    canIncrease: ({ context, event }) =>
      event.type === "INCREASE_QUANTITY" &&
      canAcceptIncrease(context.items, event.id),
    canDecrease: ({ context, event }) =>
      event.type === "DECREASE_QUANTITY" &&
      canAcceptDecrease(context.items, event.id),
    canUpdate: ({ context, event }) =>
      event.type === "UPDATE_QUANTITY" &&
      canAcceptUpdate(context.items, event.id, event.quantity),
  },
  actions: {
    addItem: assign({
      items: ({ context, event }) =>
        event.type === "ADD_ITEM"
          ? addToItems(context.items, event.item)
          : context.items,
    }),
    removeItem: assign({
      items: ({ context, event }) =>
        event.type === "REMOVE_ITEM"
          ? context.items.filter((item) => item.id !== event.id)
          : context.items,
    }),
    increaseQuantity: assign({
      items: ({ context, event }) =>
        event.type === "INCREASE_QUANTITY"
          ? context.items.map((item) =>
              item.id === event.id
                ? { ...item, quantity: item.quantity + 1 }
                : item,
            )
          : context.items,
    }),
    decreaseQuantity: assign({
      items: ({ context, event }) =>
        event.type === "DECREASE_QUANTITY"
          ? context.items.map((item) =>
              item.id === event.id
                ? { ...item, quantity: item.quantity - 1 }
                : item,
            )
          : context.items,
    }),
    updateQuantity: assign({
      items: ({ context, event }) =>
        event.type === "UPDATE_QUANTITY"
          ? context.items.map((item) =>
              item.id === event.id ? { ...item, quantity: event.quantity } : item,
            )
          : context.items,
    }),
    clearCart: assign({ items: [] }),
    hydrate: assign({
      items: ({ context, event }) =>
        event.type === "HYDRATE" ? event.items : context.items,
    }),
  },
}).createMachine({
  id: "cart",
  initial: "empty",
  context: { items: [] },
  on: {
    HYDRATE: [
      { guard: "hydrateHasItems", target: ".hasItems", actions: "hydrate" },
      { target: ".empty", actions: "hydrate" },
    ],
  },
  states: {
    empty: {
      on: {
        ADD_ITEM: {
          guard: "canAdd",
          target: "hasItems",
          actions: "addItem",
        },
      },
    },
    hasItems: {
      always: { guard: "cartIsEmpty", target: "empty" },
      on: {
        ADD_ITEM: { guard: "canAdd", actions: "addItem" },
        REMOVE_ITEM: { actions: "removeItem" },
        INCREASE_QUANTITY: { guard: "canIncrease", actions: "increaseQuantity" },
        DECREASE_QUANTITY: { guard: "canDecrease", actions: "decreaseQuantity" },
        UPDATE_QUANTITY: { guard: "canUpdate", actions: "updateQuantity" },
        CLEAR: { target: "empty", actions: "clearCart" },
      },
    },
  },
});
