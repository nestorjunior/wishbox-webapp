"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  title,
  variant = "primary",
  size = "md",
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
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  textColor?: string;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const sizeClasses = {
    sm: "h-9 rounded-lg px-3 text-xs",
    md: "h-10 rounded-lg px-4 text-sm",
    lg: "h-11 rounded-lg px-5 text-sm",
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "flex items-center justify-center gap-2 font-bold transition-opacity disabled:opacity-70",
        sizeClasses[size],
        iconPosition === "right" && "flex-row-reverse",

        isPrimary &&
          "bg-primary text-white shadow-[0_6px_12px_-4px_var(--color-primary)]",

        variant === "outline" &&
          "border border-border bg-card text-foreground",

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