import type { Metadata } from "next";
import { HeroBanner } from "@/components/sections/hero-banner";
import { ProductCard } from "@/components/sections/product-card";
import { products } from "@/lib/products";

export const metadata: Metadata = {
  title: { absolute: "Aurelle | Premium Protein Powders" },
  description:
    "Shop whey protein, whey isolate, plant protein and mass gainers from Aurelle.",
  alternates: { canonical: "/" },
};

// Add your banner here later, e.g. image: "/banner.jpg"
const banner = {
  image: "/banner.png" as string | undefined,
  alt: "Aurelle Diwali Dhamaka Sale, up to 50% off on protein powders",
  href: undefined as string | undefined,
};

export default function HomePage() {
  return (
    <main>
      <HeroBanner image={banner.image} alt={banner.alt} href={banner.href} />

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
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}