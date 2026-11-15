"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/status-badge";
import { adminApi } from "@/lib/admin-api";
import { formatDate, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductList() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    let active = true;
    adminApi
      .list()
      .then((items) => active && setProducts(items))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  function replace(updated: Product) {
    setProducts((list) => list?.map((p) => (p.id === updated.id ? updated : p)) ?? null);
  }

  async function togglePublish(p: Product) {
    setBusyId(p.id);
    setError("");
    try {
      replace(p.status === "published" ? await adminApi.unpublish(p.id) : await adminApi.publish(p.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId("");
    }
  }

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.h1}"? Its page and images will be removed permanently.`)) return;
    setBusyId(p.id);
    setError("");
    try {
      await adminApi.remove(p.id);
      setProducts((list) => list?.filter((x) => x.id !== p.id) ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId("");
    }
  }

  const published = products?.filter((p) => p.status === "published").length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Products</h1>
          {products && (
            <p className="mt-1 text-sm text-neutral-500">
              {products.length} total, {published} live on the website
            </p>
          )}
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-4 text-sm font-medium text-white hover:bg-navy-dark"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add product
        </Link>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!products && !error && <p className="mt-8 text-sm text-neutral-500">Loading products…</p>}

      {products && products.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-neutral-600">No products yet. Add your first one to show it on the website.</p>
        </div>
      )}

      {products && products.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => (
                <tr key={p.id} className="align-middle">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                        {p.images[0] ? (
                          <Image src={p.images[0].url} alt="" fill sizes="48px" className="object-contain p-1" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-neutral-300">
                            <ImageIcon className="size-5" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span>
                        <span className="block font-medium text-neutral-900 hover:underline">{p.title}</span>
                        <span className="block text-xs text-neutral-500">
                          {[p.flavour, p.size].filter(Boolean).join(", ") || "No variant"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-neutral-900">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3 text-neutral-500">{formatDate(p.updated_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {p.status === "published" && (
                        <a
                          href={`/products/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 items-center rounded-md px-2.5 text-[0.8rem] text-neutral-600 hover:bg-neutral-100"
                        >
                          View
                        </a>
                      )}
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="inline-flex h-7 items-center rounded-md border border-neutral-200 px-2.5 text-[0.8rem] hover:bg-neutral-50"
                      >
                        Edit
                      </Link>
                      <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => togglePublish(p)}>
                        {p.status === "published" ? "Unpublish" : "Publish"}
                      </Button>
                      <Button size="sm" variant="destructive" disabled={busyId === p.id} onClick={() => remove(p)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}