import type { Metadata } from "next";
import Home from "./page-client";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function Page() {
  return <Home />;
}
