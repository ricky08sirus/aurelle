import { siteConfig } from "@/lib/site";

/** Approximation of how the page appears in Google search results. */
export function SeoPreview({ title, description, slug }: { title: string; description: string; slug: string }) {
  const host = siteConfig.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <p className="mb-2 text-xs text-neutral-500">Search result preview</p>
      <p className="truncate text-xs text-neutral-700">
        {host} › products › {slug || "…"}
      </p>
      <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{title || "Page title"}</p>
      <p className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-600">
        {description || "The meta description appears here."}
      </p>
    </div>
  );
}