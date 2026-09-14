import type { Metadata } from "next";
import AddProductPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Adicionar produto",
};

export default function Page() {
  return <AddProductPage />;
}
