import { Catalog } from "@/components/catalog/Catalog";

export default function HomePage() {
  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <Catalog />
    </main>
  );
}
