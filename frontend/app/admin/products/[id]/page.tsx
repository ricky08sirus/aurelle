import { ProductEditor } from "@/components/admin/product-editor";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
};

export default async function EditProductPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { notice } = await searchParams;
  return <ProductEditor id={id} notice={notice} />;
}