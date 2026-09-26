import type { Metadata } from "next";
import ConnectionsPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conexões",
};

export default function Page() {
  return <ConnectionsPage />;
}
