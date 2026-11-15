import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/product-gallery";
import { getProductBySlug } from "@/lib/catalog";
import { discountPercent, formatPrice } from "@/lib/format";
import { siteConfig } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };

  const image = product.images[0];
  return {
    title: { absolute: product.meta_title },
    description: product.meta_description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.meta_title,
      description: product.meta_description,
      url: `/products/${product.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.meta_title,
      description: product.meta_description,
      images: image ? [image.url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const discount = discountPercent(product.mrp, product.price);
  const paragraphs = product.description.split(/\n\s*\n/).filter((p) => p.trim());

  // Structured data so search engines can show price and stock in results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.h1,
    description: product.meta_description,
    image: product.images.map((img) => img.url),
    sku: product.id,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.price.toFixed(2),
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-navy">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-navy">Products</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-neutral-700">{product.title}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} />

        <div className="lg:pt-4">
          <h1 className="font-heading text-3xl leading-tight text-navy sm:text-4xl">{product.h1}</h1>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold text-neutral-900">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-base text-neutral-400 line-through">MRP {formatPrice(product.mrp)}</span>
            )}
            {discount > 0 && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-semibold text-emerald-700">
                {discount}% off
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-neutral-500">Inclusive of all taxes</p>

          <p className={`mt-6 text-sm font-medium ${product.in_stock ? "text-emerald-700" : "text-red-600"}`}>
            {product.in_stock ? "In stock" : "Currently out of stock"}
          </p>

          {(product.flavour || product.size) && (
            <dl className="mt-6 grid max-w-sm grid-cols-2 gap-4 border-t border-neutral-200 pt-6 text-sm">
              {product.flavour && (
                <div>
                  <dt className="text-neutral-500">Flavour</dt>
                  <dd className="mt-0.5 font-medium text-neutral-900">{product.flavour}</dd>
                </div>
              )}
              {product.size && (
                <div>
                  <dt className="text-neutral-500">Size</dt>
                  <dd className="mt-0.5 font-medium text-neutral-900">{product.size}</dd>
                </div>
              )}
            </dl>
          )}

          {product.highlights.length > 0 && (
            <ul className="mt-6 space-y-2 border-t border-neutral-200 pt-6 text-sm text-neutral-700">
              {product.highlights.slice(0, 4).map((h) => (
                <li key={h} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-14 max-w-3xl space-y-12 border-t border-neutral-200 pt-12">
        {paragraphs.length > 0 && (
          <section>
            <h2 className="font-heading text-2xl text-navy">{product.h2}</h2>
            <div className="mt-4 space-y-4 text-[15px] leading-7 text-neutral-700">
              {paragraphs.map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p.trim()}</p>
              ))}
            </div>
          </section>
        )}

        {product.highlights.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-neutral-900">{product.highlights_heading}</h3>
            <ul className="mt-4 space-y-2 text-[15px] leading-7 text-neutral-700">
              {product.highlights.map((h) => (
                <li key={h} className="flex gap-3">
                  <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {product.nutrition.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-neutral-900">{product.nutrition_heading}</h3>
            <table className="mt-4 w-full max-w-md text-sm">
              <tbody>
                {product.nutrition.map((row) => (
                  <tr key={row.label} className="border-b border-neutral-200">
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal text-neutral-600">{row.label}</th>
                    <td className="py-2.5 text-right font-medium text-neutral-900">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {product.usage.trim() && (
          <section>
            <h3 className="text-lg font-semibold text-neutral-900">{product.usage_heading}</h3>
            <p className="mt-4 text-[15px] leading-7 whitespace-pre-line text-neutral-700">{product.usage}</p>
          </section>
        )}
      </div>
    </main>
  );
}