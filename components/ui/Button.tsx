"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

export function Button({
  title,
  variant = "primary",
  icon,
  iconPosition = "left",
  loading,
  disabled,
  className,
  textColor,
  ...props
}: {
  title: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  textColor?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "flex h-[46px] items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition-opacity disabled:opacity-70",
        iconPosition === "right" && "flex-row-reverse",
        isPrimary &&
          "bg-primary text-white shadow-[0_8px_16px_-4px_var(--color-primary)]",
        variant === "outline" && "border border-border bg-card text-foreground",
        variant === "ghost" && "bg-transparent text-foreground",
        isDanger &&
          "bg-[color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-(--color-danger)",
        !disabled && !loading && "hover:opacity-90 active:opacity-80",
        className,
      )}
      style={textColor ? { color: textColor } : undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          {iconPosition === "left" && icon}
          <span>{title}</span>
          {iconPosition === "right" && icon}
        </>
      )}
    </button>
  );
}
