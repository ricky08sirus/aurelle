import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

export const metadata: Metadata = {
  title: "Products",
  description: "Explore the Aurelle product range.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return <PagePlaceholder title="Products" />;
}