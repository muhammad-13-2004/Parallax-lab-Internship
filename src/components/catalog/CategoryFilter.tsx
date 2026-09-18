import { cn } from "@/lib/cn";

type CategoryFilterProps = {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
};

export function CategoryFilter({
  categories,
  value,
  onChange,
}: CategoryFilterProps) {
  const options = ["All", ...categories];

  return (
    <div className="flex flex-col gap-2">
      <p id="category-filter-label" className="text-sm font-medium text-foreground">
        Category
      </p>
      <div className="md:hidden">
        <label htmlFor="category-select" className="sr-only">
          Category
        </label>
        <select
          id="category-select"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-md bg-surface px-3 text-base text-foreground shadow-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option === "All" ? "All categories" : option}
            </option>
          ))}
        </select>
      </div>
      <div
        role="radiogroup"
        aria-labelledby="category-filter-label"
        className="hidden flex-wrap gap-2 md:flex"
      >
        {options.map((option) => {
          const selected = value === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={cn(
                "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-[background-color,color] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-foreground shadow-border hover:bg-surface-muted",
              )}
            >
              {option === "All" ? "All categories" : option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
