import { apiFetch, readError } from "@/lib/api";
import type { Product, ProductInput } from "@/lib/types";

const base = "/api/admin/products";

export const adminApi = {
  list: () => apiFetch<Product[]>(base),
  get: (id: string) => apiFetch<Product>(`${base}/${id}`),
  create: (body: ProductInput) =>
    apiFetch<Product>(base, { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: ProductInput) =>
    apiFetch<Product>(`${base}/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  publish: (id: string) => apiFetch<Product>(`${base}/${id}/publish`, { method: "POST" }),
  unpublish: (id: string) => apiFetch<Product>(`${base}/${id}/unpublish`, { method: "POST" }),
  remove: (id: string) => apiFetch<null>(`${base}/${id}`, { method: "DELETE" }),
  slugCheck: (slug: string, excludeId?: string) => {
    const q = new URLSearchParams({ slug });
    if (excludeId) q.set("exclude_id", excludeId);
    return apiFetch<{ slug: string; available: boolean }>(`${base}/slug-check?${q}`);
  },
};

export type UploadedImage = { key: string; url: string };

/** Upload one image to Cloudflare R2 through the backend (admin only). */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const form = new FormData();
  form.append("file", file);
  // No Content-Type header: the browser adds multipart/form-data with its boundary
  const res = await fetch("/api/images?folder=products", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) throw new Error(await readError(res));
  return res.json();
}

/** Delete an image from R2 that was uploaded but never saved on a product. */
export async function deleteImage(key: string): Promise<void> {
  await fetch(`/api/images/${key}`, { method: "DELETE", credentials: "include" });
}