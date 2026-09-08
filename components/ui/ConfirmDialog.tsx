"use client";

import { Button } from "./Button";

/**
 * Standard confirmation dialog used across the app (destructive and non-destructive actions).
 */
export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
}: {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  danger?: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-3">
      <button
        type="button"
        aria-label="Fechar"
        disabled={loading}
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />
      <div className="relative w-full max-w-sm rounded-(--radius-lg) bg-(--color-card) p-6">
        <p className="mb-2.5 text-center text-[17px] font-bold text-(--foreground)">
          {title}
        </p>
        {description ? (
          <p className="mb-4 text-center text-sm leading-5 text-(--color-muted)">
            {description}
          </p>
        ) : null}
        <Button
          title={confirmLabel}
          variant="primary"
          loading={loading}
          disabled={loading}
          textColor={danger ? "#fff" : undefined}
          className={danger ? "mb-2 w-full bg-(--color-danger)" : "mb-2 w-full"}
          onClick={onConfirm}
        />
        <Button
          title={cancelLabel}
          variant="outline"
          disabled={loading}
          className="w-full"
          onClick={onCancel}
        />
      </div>
    </div>
  );
}
