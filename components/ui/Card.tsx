import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
