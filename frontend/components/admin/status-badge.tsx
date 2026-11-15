import type { ProductStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: ProductStatus }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
      <span className="size-1.5 rounded-full bg-neutral-400" aria-hidden="true" />
      Draft
    </span>
  );
}