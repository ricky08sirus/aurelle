"use client";

import { useEffect, useState } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { adminApi } from "@/lib/admin-api";
import type { Product } from "@/lib/types";

const NOTICES: Record<string, string> = {
  created: "Product saved as a draft.",
  published: "Product published. It's now live on the website.",
};

export function ProductEditor({ id, notice }: { id: string; notice?: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    adminApi
      .get(id)
      .then((p) => active && setProduct(p))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!product) return <p className="text-sm text-neutral-500">Loading product…</p>;

  return <ProductForm product={product} initialNotice={notice ? NOTICES[notice] : undefined} />;
}