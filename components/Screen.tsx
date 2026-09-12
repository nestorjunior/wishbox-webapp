import type { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

const APP_MAX_WIDTH = "max-w-[840px]";

export function Screen({
  children,
  header = false,
}: {
  children: ReactNode;
  header?: boolean;
}) {
  return (
    <div className="min-h-screen w-full bg-background">
      {header ? <AppHeader maxWidthClass={APP_MAX_WIDTH} /> : null}

      <div
        className={`mx-auto flex min-h-[calc(100vh-1px)] w-full ${APP_MAX_WIDTH} flex-col gap-4 px-4 pt-4 pb-24`}
      >
        {children}
      </div>
    </div>
  );
}