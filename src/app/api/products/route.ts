import { NextResponse } from "next/server";
import {
  filterProducts,
  getAllProducts,
  getCategories,
} from "@/lib/catalog";

export async function GET(request: Request) {
  await new Promise((resolve) => setTimeout(resolve, 450));
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "All";
  const products = filterProducts(getAllProducts(), q, category);

  return NextResponse.json({
    products,
    categories: getCategories(),
  });
}
