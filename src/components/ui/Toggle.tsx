import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ToggleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pressed: boolean;
};

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { pressed, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-[background-color,color,box-shadow] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        pressed
          ? "bg-primary text-primary-foreground"
          : "bg-transparent text-foreground hover:bg-surface-muted",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
