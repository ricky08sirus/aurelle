import type { Metadata } from "next";
import { HeroCarousel } from "@/components/sections/hero-carousel";
import { ProductGrid } from "@/components/sections/product-grid";
import { banners } from "@/lib/banners";
import { getPublishedProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: { absolute: "Aurelle | Premium Protein Powders" },
  description:
    "Shop whey protein, whey isolate, plant protein and mass gainers from Aurelle.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const products = await getPublishedProducts();

  return (
    <main>
      <HeroCarousel slides={banners} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="font-heading text-4xl text-navy sm:text-5xl">
            Protein Powders
          </h1>
          <p className="mt-3 text-sm text-neutral-500">
            Clean, high-quality protein for every goal.
          </p>
        </header>

        <section aria-label="Protein powders">
          <ProductGrid products={products} />
        </section>
      </div>
    </main>
  );
}