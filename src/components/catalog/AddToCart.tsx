"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/types/product";

type AddToCartProps = {
  product: Product;
};

export function AddToCart({ product }: AddToCartProps) {
  const addItem = useCart((state) => state.addItem);
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const variant of product.variants) {
      initial[variant.name] = variant.options[0] ?? "";
    }
    return initial;
  });

  const variantLabel = useMemo(() => {
    return product.variants
      .map((variant) => `${variant.name}: ${selected[variant.name]}`)
      .join(" · ");
  }, [product.variants, selected]);

  const outOfStock = product.stock <= 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (outOfStock) return;
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      variantLabel: variantLabel || undefined,
    });
    toast.success(`${product.title} added to cart`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {product.variants.map((variant) => (
        <fieldset key={variant.name} className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            {variant.name}
          </legend>
          <div className="flex flex-wrap gap-2">
            {variant.options.map((option) => {
              const active = selected[variant.name] === option;
              const optionId = `${product.id}-${variant.name}-${option}`;
              return (
                <label
                  key={option}
                  htmlFor={optionId}
                  className={`inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-150 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-foreground shadow-border hover:bg-surface-muted"
                  }`}
                >
                  <input
                    id={optionId}
                    className="sr-only"
                    type="radio"
                    name={variant.name}
                    value={option}
                    checked={active}
                    onChange={() =>
                      setSelected((current) => ({
                        ...current,
                        [variant.name]: option,
                      }))
                    }
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
      <Button type="submit" size="lg" disabled={outOfStock}>
        {outOfStock ? "Out of stock" : "Add to cart"}
      </Button>
    </form>
  );
}
