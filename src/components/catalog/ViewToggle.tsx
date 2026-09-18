import { LayoutGrid, List } from "lucide-react";
import { Toggle } from "@/components/ui/Toggle";
import type { ViewMode } from "@/types/product";

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
};

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Product layout"
      className="inline-flex rounded-md bg-surface p-1 shadow-border"
    >
      <Toggle
        pressed={value === "grid"}
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        className="rounded-sm"
      >
        <LayoutGrid className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Grid</span>
      </Toggle>
      <Toggle
        pressed={value === "list"}
        onClick={() => onChange("list")}
        aria-label="List view"
        className="rounded-sm"
      >
        <List className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">List</span>
      </Toggle>
    </div>
  );
}
