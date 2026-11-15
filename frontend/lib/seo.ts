/**
 * Automatic URL, headings and meta tags for product pages.
 * Same rules as backend/app/seo.py, so the admin preview matches what gets saved.
 */
export const BRAND = "Aurelle";
export const SLUG_MAX = 80;
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

export const DEFAULT_HIGHLIGHTS_HEADING = "Key benefits";
export const DEFAULT_NUTRITION_HEADING = "Nutrition facts";
export const DEFAULT_USAGE_HEADING = "How to use";

/** "Aurelle Whey Protein Chocolate 1 kg" -> "aurelle-whey-protein-chocolate-1-kg" */
export function slugify(text: string): string {
  let s = text
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  if (s.length > SLUG_MAX) {
    s = s.slice(0, SLUG_MAX);
    const i = s.lastIndexOf("-");
    if (i >= 0) s = s.slice(0, i);
  }
  return s;
}

/** Shorten at a word boundary and add an ellipsis. */
export function truncate(text: string, limit: number): string {
  const t = text.split(/\s+/).filter(Boolean).join(" ");
  if (t.length <= limit) return t;
  let cut = t.slice(0, limit - 1);
  const i = cut.lastIndexOf(" ");
  if (i > 0) cut = cut.slice(0, i);
  return `${cut.replace(/[,.;:\-–]+$/, "")}…`;
}

const variant = (flavour: string, size: string) =>
  [flavour, size].filter(Boolean).join(", ");

/** 2499 -> "2,499" (same grouping as the backend) */
const groupDigits = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const defaultSlug = (title: string, flavour: string, size: string) =>
  slugify([title, flavour, size].filter(Boolean).join(" "));

export function defaultH1(title: string, flavour: string, size: string) {
  const v = variant(flavour, size);
  return v ? `${title} – ${v}` : title;
}

export const defaultH2 = (title: string) => `About ${title}`;

export function defaultMetaTitle(h1: string) {
  const withBrand = `${h1} | ${BRAND}`;
  if (h1.toLowerCase().includes(BRAND.toLowerCase()) || withBrand.length > META_TITLE_MAX) {
    return truncate(h1, META_TITLE_MAX);
  }
  return withBrand;
}

export function defaultMetaDescription(description: string, h1: string, price: number) {
  if (description.trim()) return truncate(description, META_DESCRIPTION_MAX);
  return truncate(
    `Buy ${h1} online from ${BRAND} at ₹${groupDigits(price || 0)}. ` +
      "Genuine products with fast delivery across India.",
    META_DESCRIPTION_MAX,
  );
}