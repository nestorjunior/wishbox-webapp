import type { Metadata } from "next";
import MessagesPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mensagens",
};

export default function Page() {
  return <MessagesPage />;
}
