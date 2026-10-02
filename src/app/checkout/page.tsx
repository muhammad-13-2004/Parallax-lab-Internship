"use client";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export default function CheckoutPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="mb-8 font-display text-4xl font-medium tracking-tight">Checkout</h1>
      <CheckoutFlow />
    </main>
  );
}
