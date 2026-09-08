"use client";

import type {
  InputHTMLAttributes,
  ChangeEventHandler,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

type FieldBaseProps = {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  rightAccessory?: ReactNode;
  className?: string;
  as?: "input" | "select";
  children?: ReactNode;
  multiline?: boolean;
  onChange?: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >;
};

type FieldProps = FieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "onChange">;

export function Field({
  label,
  hint,
  icon,
  rightAccessory,
  multiline,
  className,
  as,
  children,
  ...props
}: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? (
        <span className="text-[13px] font-semibold text-(--foreground)">
          {label}
        </span>
      ) : null}
      <div
        className={cn(
          "flex items-center rounded-md border border-border bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10",
          multiline ? "h-[92px] items-start" : "h-[46px]",
        )}
      >
        {icon ? (
          <div className={cn("pl-3.5", multiline && "pt-3.5")}>{icon}</div>
        ) : null}
        {multiline ? (
          <textarea
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            className={cn(
              "h-full flex-1 resize-none bg-transparent px-3.5 pt-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none",
              icon && "pl-2",
              className,
            )}
          />
        ) : as === "select" ? (
          <select
            {...(props as SelectHTMLAttributes<HTMLSelectElement>)}
            className={cn(
              "h-full flex-1 appearance-none bg-transparent px-3.5 text-sm text-foreground focus:outline-none",
              className,
            )}
          >
            {children}
          </select>
        ) : (
          <input
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
            className={cn(
              "h-full flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted focus:outline-none",
              icon && "pl-2",
              className,
            )}
          />
        )}
        {rightAccessory}
      </div>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}
