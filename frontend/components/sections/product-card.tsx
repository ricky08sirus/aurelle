import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { Product } from "@/lib/products";

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductCard({ product }: { product: Product }) {
  const { name, flavour, size, mrp, price, image } = product;
  const discount = Math.round(((mrp - price) / mrp) * 100);
  const alt = [name, flavour, size].filter(Boolean).join(" ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-md">
      <div className="relative aspect-square w-full bg-neutral-100">
        {image ? (
          <Image
            src={image}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-300">
            <ImageIcon className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">
          {name}
        </h3>
        <p className="text-xs text-neutral-500">
          {[flavour, size].filter(Boolean).join(" · ")}
        </p>

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pt-3">
          <span className="text-base font-semibold text-neutral-900">
            {formatPrice(price)}
          </span>
          <span className="text-xs text-neutral-400 line-through">
            {formatPrice(mrp)}
          </span>
          {discount > 0 && (
            <span className="text-xs font-semibold text-emerald-700">
              {discount}% off
            </span>
          )}
        </div>
      </div>
    </article>
  );
}