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
  pending: Record<string, { operationId: string; item: CartItem; index: number }>;
};

export type CartEvent =
  | { type: "ADD_ITEM"; item: CartItemInput }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "INCREASE_QUANTITY"; id: string }
  | { type: "DECREASE_QUANTITY"; id: string }
  | { type: "UPDATE_QUANTITY"; id: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] }
  | { type: "OPTIMISTIC_UPDATE"; id: string; quantity: number; operationId: string }
  | { type: "OPTIMISTIC_REMOVE"; id: string; operationId: string }
  | { type: "MUTATION_SUCCEEDED"; id: string; operationId: string }
  | { type: "MUTATION_FAILED"; id: string; operationId: string };

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

export function canAcceptUpdate(items: CartItem[], id: string, quantity: number) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return false;
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= maxAllowed(item.stock);
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
    hydrateHasItems: ({ event }) => event.type === "HYDRATE" && event.items.length > 0,
    canAdd: ({ context, event }) =>
      event.type === "ADD_ITEM" &&
      !context.pending[makeCartItemId(event.item.productId, event.item.variantLabel)] &&
      canAcceptAdd(context.items, event.item),
    canRemove: ({ context, event }) =>
      event.type === "REMOVE_ITEM" &&
      !context.pending[event.id] &&
      context.items.some((item) => item.id === event.id),
    canIncrease: ({ context, event }) =>
      event.type === "INCREASE_QUANTITY" &&
      !context.pending[event.id] &&
      canAcceptIncrease(context.items, event.id),
    canDecrease: ({ context, event }) =>
      event.type === "DECREASE_QUANTITY" &&
      !context.pending[event.id] &&
      canAcceptDecrease(context.items, event.id),
    canUpdate: ({ context, event }) =>
      event.type === "UPDATE_QUANTITY" &&
      !context.pending[event.id] &&
      canAcceptUpdate(context.items, event.id, event.quantity),
    canOptimisticallyUpdate: ({ context, event }) =>
      event.type === "OPTIMISTIC_UPDATE" &&
      !context.pending[event.id] &&
      canAcceptUpdate(context.items, event.id, event.quantity),
    canOptimisticallyRemove: ({ context, event }) =>
      event.type === "OPTIMISTIC_REMOVE" &&
      !context.pending[event.id] &&
      context.items.some((item) => item.id === event.id),
    matchesPendingOperation: ({ context, event }) =>
      (event.type === "MUTATION_SUCCEEDED" || event.type === "MUTATION_FAILED") &&
      context.pending[event.id]?.operationId === event.operationId,
    noPendingMutations: ({ context }) => Object.keys(context.pending).length === 0,
  },
  actions: {
    addItem: assign({
      items: ({ context, event }) =>
        event.type === "ADD_ITEM" ? addToItems(context.items, event.item) : context.items,
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
              item.id === event.id ? { ...item, quantity: item.quantity + 1 } : item,
            )
          : context.items,
    }),
    decreaseQuantity: assign({
      items: ({ context, event }) =>
        event.type === "DECREASE_QUANTITY"
          ? context.items.map((item) =>
              item.id === event.id ? { ...item, quantity: item.quantity - 1 } : item,
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
    clearCart: assign({ items: [], pending: {} }),
    optimisticallyUpdate: assign(({ context, event }) => {
      if (event.type !== "OPTIMISTIC_UPDATE") return {};
      const index = context.items.findIndex((item) => item.id === event.id);
      const item = context.items[index];
      if (!item) return {};
      return {
        items: context.items.map((entry) =>
          entry.id === event.id ? { ...entry, quantity: event.quantity } : entry,
        ),
        pending: {
          ...context.pending,
          [event.id]: { operationId: event.operationId, item, index },
        },
      };
    }),
    optimisticallyRemove: assign(({ context, event }) => {
      if (event.type !== "OPTIMISTIC_REMOVE") return {};
      const index = context.items.findIndex((item) => item.id === event.id);
      const item = context.items[index];
      if (!item) return {};
      return {
        items: context.items.filter((entry) => entry.id !== event.id),
        pending: {
          ...context.pending,
          [event.id]: { operationId: event.operationId, item, index },
        },
      };
    }),
    settleMutation: assign(({ context, event }) => {
      if (
        (event.type !== "MUTATION_SUCCEEDED" && event.type !== "MUTATION_FAILED") ||
        context.pending[event.id]?.operationId !== event.operationId
      ) {
        return {};
      }
      const pending = { ...context.pending };
      delete pending[event.id];
      return { pending };
    }),
    rollbackMutation: assign(({ context, event }) => {
      if (event.type !== "MUTATION_FAILED") return {};
      const snapshot = context.pending[event.id];
      if (!snapshot || snapshot.operationId !== event.operationId) return {};
      const items = [...context.items];
      const currentIndex = items.findIndex((item) => item.id === event.id);
      if (currentIndex >= 0) items[currentIndex] = snapshot.item;
      else items.splice(Math.min(snapshot.index, items.length), 0, snapshot.item);
      const pending = { ...context.pending };
      delete pending[event.id];
      return { items, pending };
    }),
    hydrate: assign({
      items: ({ context, event }) => (event.type === "HYDRATE" ? event.items : context.items),
      pending: {},
    }),
  },
}).createMachine({
  id: "cart",
  initial: "empty",
  context: { items: [], pending: {} },
  on: {
    HYDRATE: [
      { guard: "hydrateHasItems", target: ".hasItems", actions: "hydrate" },
      { target: ".empty", actions: "hydrate" },
    ],
    OPTIMISTIC_UPDATE: {
      guard: "canOptimisticallyUpdate",
      target: ".hasItems",
      actions: "optimisticallyUpdate",
    },
    OPTIMISTIC_REMOVE: {
      guard: "canOptimisticallyRemove",
      actions: "optimisticallyRemove",
    },
    MUTATION_SUCCEEDED: {
      guard: "matchesPendingOperation",
      actions: "settleMutation",
    },
    MUTATION_FAILED: {
      guard: "matchesPendingOperation",
      target: ".hasItems",
      actions: "rollbackMutation",
    },
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
        REMOVE_ITEM: { guard: "canRemove", actions: "removeItem" },
        INCREASE_QUANTITY: { guard: "canIncrease", actions: "increaseQuantity" },
        DECREASE_QUANTITY: { guard: "canDecrease", actions: "decreaseQuantity" },
        UPDATE_QUANTITY: { guard: "canUpdate", actions: "updateQuantity" },
        CLEAR: {
          guard: "noPendingMutations",
          target: "empty",
          actions: "clearCart",
        },
      },
    },
  },
});
