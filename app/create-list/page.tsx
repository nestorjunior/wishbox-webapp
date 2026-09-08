import type { Metadata } from "next";
import CreateListPage from "./page-client";

export const metadata: Metadata = {
  title: "Criar lista",
};

export default function Page() {
  return <CreateListPage />;
}
