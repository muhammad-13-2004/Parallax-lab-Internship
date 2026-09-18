import { http, HttpResponse, delay } from "msw";
import {
  filterProducts,
  getAllProducts,
  getCategories,
  getProductById,
} from "@/lib/catalog";

export const handlers = [
  http.get("/api/products", async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const category = url.searchParams.get("category") ?? "All";
    await delay(80);
    return HttpResponse.json({
      products: filterProducts(getAllProducts(), q, category),
      categories: getCategories(),
    });
  }),
  http.get("/api/products/:id", async ({ params }) => {
    await delay(80);
    const product = getProductById(String(params.id));
    if (!product) {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }
    return HttpResponse.json({ product });
  }),
];
