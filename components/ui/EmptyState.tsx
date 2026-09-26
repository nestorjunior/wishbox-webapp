import type { ReactNode } from "react";

export function EmptyState({
  emoji,
  title,
  description,
  action,
}: {
  emoji: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-10 text-center">
      <div className="flex size-[72px] items-center justify-center rounded-full bg-primary-soft">
        <span className="text-3xl">{emoji}</span>
      </div>
      <p className="text-[17px] font-bold text-(--foreground)">{title}</p>
      {description ? (
        <p className="text-xs leading-[18px] text-(--color-muted)">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}
