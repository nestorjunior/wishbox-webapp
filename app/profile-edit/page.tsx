import type { Metadata } from "next";
import ProfileEditPage from "./page-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editar perfil",
};

export default function Page() {
  return <ProfileEditPage />;
}
