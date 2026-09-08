"use client";

export function Toggle({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onValueChange(!value)}
      className="flex h-7 w-[46px] items-center rounded-full p-0.5 transition-colors"
      style={{
        backgroundColor: value ? "var(--color-primary)" : "var(--color-border)",
      }}
    >
      <span
        className="size-6 rounded-full bg-(--color-card) shadow-sm transition-transform"
        style={{ transform: value ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}
