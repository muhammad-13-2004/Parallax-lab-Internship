"use client";

import { useEffect, useId, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { parseQuantity } from "@/lib/quantity";

type QuantitySelectorProps = {
  value: number;
  stock: number;
  disabled?: boolean;
  label?: string;
  id?: string;
  compact?: boolean;
  onValidChange: (value: number) => void;
  onInvalid?: (message: string) => void;
};

export function QuantitySelector({
  value,
  stock,
  disabled = false,
  label = "Quantity",
  id,
  compact = false,
  onValidChange,
  onInvalid,
}: QuantitySelectorProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [draft, setDraft] = useState(String(value));
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    setDraft(String(value));
    setError(undefined);
  }, [value]);

  function commit(raw: string) {
    const result = parseQuantity(raw, stock);
    if (!result.ok) {
      setError(result.message);
      onInvalid?.(result.message);
      return;
    }
    setError(undefined);
    if (result.value !== value) {
      onValidChange(result.value);
    } else {
      setDraft(String(result.value));
    }
  }

  const atMin = value <= 1;
  const atMax = value >= Math.min(stock, 99);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={cn(
          "text-sm font-medium text-foreground",
          compact && "sr-only",
        )}
      >
        {label}
      </label>
      <div className="inline-flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={compact ? "size-10 min-h-10 min-w-10" : undefined}
          aria-label="Decrease quantity"
          disabled={disabled || atMin}
          onClick={() => onValidChange(value - 1)}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <input
          id={inputId}
          name="quantity"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={draft}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(undefined);
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            }
          }}
          className={cn(
            "h-11 w-16 rounded-md bg-surface text-center text-base tabular-nums text-foreground shadow-border",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-2 ring-destructive",
            compact && "h-10 w-14",
          )}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={compact ? "size-10 min-h-10 min-w-10" : undefined}
          aria-label="Increase quantity"
          disabled={disabled || atMax}
          onClick={() => onValidChange(value + 1)}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
