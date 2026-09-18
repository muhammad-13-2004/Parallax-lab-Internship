"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cartCount, useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/", label: "Catalog" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
];

export function Header() {
  const items = useCart((state) => state.items);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const count = hydrated ? cartCount(items) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Skip to catalog
        </a>
        <Link
          href="/"
          className="min-w-0 shrink font-display text-lg tracking-tight text-foreground sm:text-xl"
        >
          Northline
        </Link>
        <nav aria-label="Primary" className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "hidden h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 md:inline-flex",
                "hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            href="/cart"
            className="relative inline-flex size-11 items-center justify-center rounded-md text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={count > 0 ? `Cart, ${count} items` : "Cart, empty"}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {count > 0 ? (
              <span className="absolute right-1.5 top-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium tabular-nums text-primary-foreground">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
