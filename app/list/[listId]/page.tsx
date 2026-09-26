import type { Metadata } from "next";
import ListPage from "./page-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listId: string }>;
}): Promise<Metadata> {
  const { listId } = await params;
  return { title: `Lista ${listId.slice(0, 8)}` };
}

export default function Page() {
  return <ListPage />;
}