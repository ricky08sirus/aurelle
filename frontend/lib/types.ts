export type ProductImage = { key: string; alt: string; url: string };
export type NutritionRow = { label: string; value: string };
export type ProductStatus = "draft" | "published";

/** A product as returned by the API (matches ProductOut in the backend). */
export type Product = {
  id: string;
  title: string;
  flavour: string;
  size: string;
  mrp: number;
  price: number;
  in_stock: boolean;
  sort_order: number;
  slug: string;
  h1: string;
  h2: string;
  description: string;
  highlights_heading: string;
  highlights: string[];
  nutrition_heading: string;
  nutrition: NutritionRow[];
  usage_heading: string;
  usage: string;
  meta_title: string;
  meta_description: string;
  images: ProductImage[];
  status: ProductStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Body for creating/updating a product (matches ProductIn in the backend). */
export type ProductInput = Omit<
  Product,
  "id" | "status" | "published_at" | "created_at" | "updated_at" | "images"
> & { images: { key: string; alt: string }[] };