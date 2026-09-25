"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/catalog/QuantitySelector";
import { canAcceptAdd } from "@/lib/cart-machine";
import { useCart } from "@/lib/cart-provider";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { Product } from "@/types/product";

type AddToCartProps = {
  product: Product;
};

export function AddToCart({ product }: AddToCartProps) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);
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
  const remaining = Math.max(0, product.stock);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (outOfStock) {
      notifyError("Out of stock", `${product.title} is not available.`);
      return;
    }
    const payload = {
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      stock: product.stock,
      variantLabel: variantLabel || undefined,
      quantity,
    };
    if (!canAcceptAdd(items, payload)) {
      notifyError(
        "Could not add to cart",
        remaining > 0
          ? `Only ${remaining} in stock, including items already in your cart.`
          : "This item is out of stock.",
      );
      return;
    }
    addItem(payload);
    notifySuccess("Added to cart", product.title);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
      <QuantitySelector
        value={quantity}
        stock={product.stock}
        disabled={outOfStock}
        onValidChange={setQuantity}
        onInvalid={(message) => notifyError("Invalid quantity", message)}
      />
      <Button type="submit" size="lg" disabled={outOfStock}>
        {outOfStock ? "Out of stock" : "Add to cart"}
      </Button>
    </form>
  );
}
