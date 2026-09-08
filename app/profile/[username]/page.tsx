import type { Metadata } from "next";
import ProfilePage from "./page-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

export default function Page() {
  return <ProfilePage />;
}
