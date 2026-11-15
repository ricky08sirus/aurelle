/**
 * Product data for public pages (used only in server components).
 * `no-store` means every request reads the latest data, so a product
 * appears on the site as soon as an admin publishes it.
 */
import type { Product } from "@/lib/types";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8000";

export async function getPublishedProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BACKEND}/products`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error("Could not load products:", e);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${BACKEND}/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Could not load product (HTTP ${res.status})`);
  return res.json();
}