import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/cn";

export function Screen({
  children,
  header = false,
  headerMaxWidthClass,
  contentClassName,
}: {
  children: ReactNode;
  header?: boolean;
  headerMaxWidthClass?: string;
  contentClassName?: string;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      {header ? <AppHeader maxWidthClass={headerMaxWidthClass} /> : null}

      <div
        className={cn(
          "mx-auto flex min-h-[calc(100vh-1px)] w-full max-w-app flex-col gap-4 px-4 pt-4 pb-24",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
