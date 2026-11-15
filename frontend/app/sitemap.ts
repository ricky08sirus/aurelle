import type { MetadataRoute } from "next";
import { getPublishedProducts } from "@/lib/catalog";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/products", "/about", "/faq", "/contact"].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
  }));

  const products = (await getPublishedProducts()).map((p) => ({
    url: `${siteConfig.url}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    images: p.images.map((img) => img.url),
  }));

  return [...pages, ...products];
}