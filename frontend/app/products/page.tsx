import type { Metadata } from "next";
import { ProductGrid } from "@/components/sections/product-grid";
import { getPublishedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Products",
  description: "Shop Aurelle whey protein, whey isolate, plant protein and mass gainers.",
  alternates: { canonical: "/products" },
};

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-heading text-4xl text-navy sm:text-5xl">All products</h1>
        <p className="mt-3 text-sm text-neutral-500">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </header>
      <ProductGrid products={products} />
    </main>
  );
}