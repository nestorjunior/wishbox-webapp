import type { Metadata } from "next";
import SettingsPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configurações",
};

export default function Page() {
  return <SettingsPage />;
}
