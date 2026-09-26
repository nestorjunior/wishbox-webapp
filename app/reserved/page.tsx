import type { Metadata } from "next";
import ReservedPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservados",
};

export default function Page() {
  return <ReservedPage />;
}
