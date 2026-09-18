import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16">
      <EmptyState
        title="Page not found"
        description="That route is not part of the Northline catalog."
        action={
          <Button asChild>
            <Link href="/">Back to catalog</Link>
          </Button>
        }
      />
    </main>
  );
}
