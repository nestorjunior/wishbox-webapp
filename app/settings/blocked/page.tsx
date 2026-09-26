import type { Metadata } from "next";
import BlockedAccountsPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contas bloqueadas",
};

export default function Page() {
  return <BlockedAccountsPage />;
}
