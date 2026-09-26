import type { Metadata } from "next";
import ProductPage from "./page-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  return { title: `Produto ${productId.slice(0, 8)}` };
}

export default function Page() {
  return <ProductPage />;
}
