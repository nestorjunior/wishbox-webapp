import type { Metadata } from "next";
import ExplorePage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explorar",
};

export default function Page() {
  return <ExplorePage />;
}
