import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <Input
      label="Search products"
      type="search"
      name="q"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search titles, descriptions, or categories"
      autoComplete="off"
      trailing={<Search className="size-4" aria-hidden="true" />}
    />
  );
}
