import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about Aurelle.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return <PagePlaceholder title="FAQ" />;
}