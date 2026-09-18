"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-16">
      <EmptyState
        title="Something went wrong"
        description={error.message || "An unexpected error occurred. Try reloading the page."}
        action={<Button onClick={reset}>Try again</Button>}
      />
    </main>
  );
}
