import type { Metadata } from "next";
import SignupPage from "./page-client";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function Page() {
  return <SignupPage />;
}
