import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/sections/page-placeholder";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Aurelle team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return <PagePlaceholder title="Contact Us" />;
}