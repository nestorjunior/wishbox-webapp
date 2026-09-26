import type { Metadata } from "next";
import NotificationsPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notificações",
};

export default function Page() {
  return <NotificationsPage />;
}
