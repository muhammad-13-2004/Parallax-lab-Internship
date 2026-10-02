import { assign, setup } from "xstate";
import {
  paymentSchema,
  shippingSchema,
  type PaymentFields,
  type SafePaymentInfo,
  type ShippingFields,
  type ShippingInfo,
} from "@/lib/checkout-validation";

export type CheckoutCartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

export type CheckoutOrder = {
  orderNumber: string;
  items: CheckoutCartItem[];
  total: number;
};

export type CheckoutContext = {
  cartItems: CheckoutCartItem[];
  shipping: ShippingInfo | null;
  payment: SafePaymentInfo | null;
  order: CheckoutOrder | null;
};

export type CheckoutEvent =
  | { type: "SYNC_CART"; items: CheckoutCartItem[] }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "SUBMIT_SHIPPING"; shipping: ShippingFields }
  | { type: "SUBMIT_PAYMENT"; payment: PaymentFields }
  | { type: "CONFIRM_ORDER" }
  | { type: "RESET" };

let nextOrderNumber = 0;

export const checkoutMachine = setup({
  types: {
    context: {} as CheckoutContext,
    events: {} as CheckoutEvent,
  },
  guards: {
    hasCartItems: ({ context }) => context.cartItems.length > 0,
    validShipping: ({ event }) =>
      event.type === "SUBMIT_SHIPPING" && shippingSchema.safeParse(event.shipping).success,
    validPayment: ({ event }) =>
      event.type === "SUBMIT_PAYMENT" && paymentSchema.safeParse(event.payment).success,
    canConfirmOrder: ({ context }) =>
      context.cartItems.length > 0 && context.shipping !== null && context.payment !== null,
  },
  actions: {
    syncCart: assign({
      cartItems: ({ event }) => (event.type === "SYNC_CART" ? event.items : []),
    }),
    saveShipping: assign(({ event }) => {
      if (event.type !== "SUBMIT_SHIPPING") return {};
      const result = shippingSchema.safeParse(event.shipping);
      return result.success ? { shipping: result.data, payment: null } : {};
    }),
    savePayment: assign(({ event }) => {
      if (event.type !== "SUBMIT_PAYMENT") return {};
      const result = paymentSchema.safeParse(event.payment);
      if (!result.success) return {};
      return {
        payment: {
          cardholderName: result.data.cardholderName,
          lastFour: result.data.cardNumber.slice(-4),
        },
      };
    }),
    createOrder: assign(({ context }) => {
      const sequence = ++nextOrderNumber;
      return {
        order: {
          orderNumber: `NL-${Date.now().toString(36).toUpperCase()}-${sequence}`,
          items: context.cartItems.map((item) => ({ ...item })),
          total: context.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        },
      };
    }),
    resetCheckout: assign(({ context }) => ({
      cartItems: context.cartItems,
      shipping: null,
      payment: null,
      order: null,
    })),
  },
}).createMachine({
  id: "checkout",
  initial: "cart",
  context: {
    cartItems: [],
    shipping: null,
    payment: null,
    order: null,
  },
  on: {
    SYNC_CART: { actions: "syncCart" },
    RESET: { target: ".cart", actions: "resetCheckout" },
  },
  states: {
    cart: {
      on: {
        NEXT: { guard: "hasCartItems", target: "shipping" },
      },
    },
    shipping: {
      on: {
        BACK: { target: "cart" },
        SUBMIT_SHIPPING: {
          guard: "validShipping",
          target: "payment",
          actions: "saveShipping",
        },
      },
    },
    payment: {
      on: {
        BACK: { target: "shipping" },
        SUBMIT_PAYMENT: { guard: "validPayment", actions: "savePayment" },
        CONFIRM_ORDER: {
          guard: "canConfirmOrder",
          target: "confirmation",
          actions: "createOrder",
        },
      },
    },
    confirmation: {},
  },
});
