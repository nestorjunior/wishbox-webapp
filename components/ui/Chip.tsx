"use client";

import { cn } from "@/lib/cn";

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={cn(
        "flex h-[34px] items-center justify-center rounded-(--radius-full,999px) border px-3.5 text-[13px] font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-white"
          : "border-(--color-border) bg-(--color-card) text-(--color-muted) hover:border-primary/50",
      )}
    >
      {label}
    </button>
  );
}
