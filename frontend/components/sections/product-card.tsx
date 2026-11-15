import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { discountPercent, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  eager = false,
}: {
  product: Product;
  /** Load immediately instead of lazily: use for cards visible without scrolling */
  eager?: boolean;
}) {
  const { title, flavour, size, mrp, price, slug, in_stock } = product;
  const image = product.images[0];
  const discount = discountPercent(mrp, price);

  return (
    <Link
      href={`/products/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-navy focus-visible:outline-none"
    >
      {/* White square with padding so the whole tub is always visible */}
      <div className="relative aspect-square w-full bg-white">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-105 sm:p-6"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-300">
            <ImageIcon className="size-10" aria-hidden="true" />
          </div>
        )}
        {!in_stock && (
          <span className="absolute top-3 left-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-[11px] font-medium text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500">{[flavour, size].filter(Boolean).join(", ")}</p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-3">
          <span className="text-base font-semibold text-neutral-900">{formatPrice(price)}</span>
          {mrp > price && (
            <span className="text-xs text-neutral-400 line-through">{formatPrice(mrp)}</span>
          )}
          {discount > 0 && (
            <span className="text-xs font-semibold text-emerald-700">{discount}% off</span>
          )}
        </div>
      </div>
    </Link>
  );
}