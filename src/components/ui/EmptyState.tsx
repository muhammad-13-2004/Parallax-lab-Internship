import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl bg-surface px-6 py-16 text-center shadow-border",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground"
      >
        {icon ?? <SearchX className="size-6" strokeWidth={1.75} />}
      </span>
      <div className="flex max-w-md flex-col gap-2">
        <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
