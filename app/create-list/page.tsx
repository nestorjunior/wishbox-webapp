import type { Metadata } from "next";
import { Suspense } from "react";
import CreateListPage from "./page-client";

export const metadata: Metadata = {
  title: "Criar ou editar lista",
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CreateListPage />
    </Suspense>
  );
}
