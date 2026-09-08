import type { Metadata } from "next";
import CalendarPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendário",
};

export default function Page() {
  return <CalendarPage />;
}
