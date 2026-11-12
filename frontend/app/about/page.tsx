import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Aurelle and what we stand for.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <PagePlaceholder title="About Us" />;
}