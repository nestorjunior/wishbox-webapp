import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

export function Screen({
  children,
  header = false,
}: {
  children: ReactNode;
  header?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 bg-background p-4 pb-24">
      {header ? <AppHeader /> : null}
      {children}
    </div>
  );
}
