import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/catalog/AddToCart";
import { ProductCard } from "@/components/catalog/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { getAllProducts, getProductById } from "@/lib/catalog";
import { formatPrice, stockLabel, stockTone } from "@/lib/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) return { title: "Product" };
  return { title: product.title, description: product.description };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const related = getAllProducts()
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 4);

  return (
    <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-foreground">
              Catalog
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{product.title}</li>
        </ol>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl bg-surface shadow-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.title}
            width={900}
            height={900}
            className="aspect-square w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{product.category}</Badge>
              <Badge tone={stockTone(product.stock)}>
                {stockLabel(product.stock)}
              </Badge>
            </div>
            <h1 className="font-display text-4xl font-medium tracking-tight">
              {product.title}
            </h1>
            <p className="text-2xl font-medium tabular-nums">
              {formatPrice(product.price)}
            </p>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              {product.description}
            </p>
          </div>
          <AddToCart product={product} />
        </div>
      </div>
      {related.length > 0 ? (
        <section className="mt-16" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="mb-6 font-display text-2xl font-medium tracking-tight"
          >
            More in {product.category}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
