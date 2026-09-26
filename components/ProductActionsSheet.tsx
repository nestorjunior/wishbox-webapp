"use client";

import { useState } from "react";
import { Copy, Flag, Gift, PauseCircle, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/lib/data";
import { ConfirmDialog, Field } from "@/components/ui";
import { Button } from "@/components/ui";

export function ProductActionsSheet({
  product,
  visible,
  onClose,
  onReserve,
  onUnreserve,
  onCopy,
  onReport,
  onEdit,
  onTogglePause,
  onDelete,
  isReservedByMe = false,
  reservationUnavailable = false,
  loading = false,
}: {
  product: Product;
  visible: boolean;
  onClose: () => void;
  onReserve: () => void;
  onUnreserve: () => void;
  onCopy: () => void;
  onReport: () => void;
  onEdit?: () => void;
  onTogglePause?: () => void;
  onDelete?: () => void;
  isReservedByMe?: boolean;
  reservationUnavailable?: boolean;
  loading?: boolean;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const runAndClose = (action: () => void) => {
    onClose();
    action();
  };

  const reserveLabel = isReservedByMe
    ? "Desfazer reserva"
    : "Reservar presente";
  const isOwnerMenu = Boolean(onEdit || onTogglePause || onDelete);

  const handleReservePress = () => {
    if (isReservedByMe) {
      setConfirmOpen(true);
      return;
    }
    runAndClose(onReserve);
  };

  const confirmUnreserve = () => {
    setConfirmOpen(false);
    runAndClose(onUnreserve);
  };

  return (
    <>
      {visible ? <div className="fixed inset-0 z-50 flex items-end">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(20,20,28,0.72)]"
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-actions-title"
          className="relative w-full rounded-t-(--radius-xl) bg-(--color-card) px-5 pt-2.5 pb-[calc(1.75rem+env(safe-area-inset-bottom))] shadow-sheet sm:px-8"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--color-border)" />
          <p id="product-actions-title" className="mb-2 truncate text-[17px] font-bold text-(--foreground)">
            {product.name}
          </p>

          {isOwnerMenu ? (
            <>
              <SheetItem
                icon={<Pencil size={18} />}
                label="Editar produto"
                onClick={() => onEdit && runAndClose(onEdit)}
              />
              <SheetItem
                icon={<Copy size={18} />}
                label="Duplicar em outra lista"
                onClick={() => runAndClose(onCopy)}
              />
              <SheetItem
                icon={<PauseCircle size={18} />}
                label={product.paused ? "Retomar produto" : "Pausar produto"}
                onClick={() => onTogglePause && runAndClose(onTogglePause)}
              />
              <SheetItem
                icon={<Trash2 size={18} />}
                label="Excluir produto"
                danger
                onClick={() => {
                  onClose();
                  setDeleteConfirmOpen(true);
                }}
              />
            </>
          ) : (
            <>
              <SheetItem
                icon={<Gift size={18} />}
                label={reservationUnavailable ? "Presente já reservado" : reserveLabel}
                onClick={handleReservePress}
                disabled={reservationUnavailable || loading}
              />
              <SheetItem
                icon={<Copy size={18} />}
                label="Copiar para minha lista"
                onClick={() => runAndClose(onCopy)}
                disabled={loading}
              />
              <SheetItem
                icon={<Flag size={18} />}
                label="Denunciar produto"
                danger
                onClick={() => runAndClose(onReport)}
                disabled={loading}
              />
            </>
          )}
        </section>
      </div> : null}

      <ConfirmDialog
        visible={confirmOpen}
        title="Cancelar reserva?"
        description="O presente volta a ficar disponível para outras pessoas reservarem."
        confirmLabel="Cancelar reserva"
        cancelLabel="Voltar"
        onConfirm={confirmUnreserve}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        visible={deleteConfirmOpen}
        title="Excluir produto?"
        description={`“${product.name}” será removido definitivamente de todas as listas.`}
        confirmLabel="Excluir produto"
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          onDelete?.();
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
}

function SheetItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-1 py-3.5 text-left transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-45 ${danger ? "text-(--color-danger)" : "text-(--foreground)"}`}
      onClick={onClick}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

const reportReasons = [
  "Produto inadequado ou ofensivo",
  "Golpe ou link suspeito",
  "Produto falsificado",
  "Conteúdo com direitos autorais",
  "Spam ou propaganda",
  "Outro motivo",
];

export function ReportProductSheet({
  product,
  visible,
  onClose,
  onSubmit,
}: {
  product: Product;
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { reason: string; detail: string }) => void;
}) {
  const [selectedReason, setSelectedReason] = useState("");
  const [detail, setDetail] = useState("");

  const submit = () => {
    if (!selectedReason && !detail.trim()) return;
    onSubmit({
      reason: selectedReason || "Outro motivo",
      detail: detail.trim(),
    });
    setSelectedReason("");
    setDetail("");
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(20,20,28,0.72)]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-product-title"
        className="relative w-full rounded-t-(--radius-xl) bg-(--color-card) px-5 pt-4 pb-6 shadow-sheet sm:max-w-[360px] sm:rounded-(--radius-md) sm:px-6 sm:py-6"
      >
        <div className="mb-2.5 flex items-center justify-between">
          <p id="report-product-title" className="flex items-center gap-2 text-[17px] font-bold text-(--foreground)">
            <Flag size={17} className="text-danger" />
            Denunciar produto
          </p>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <span className="text-sm text-(--color-muted)">✕</span>
          </button>
        </div>

        <p className="mb-3 text-xs text-(--color-muted)">
          Conte o motivo da denúncia de “{product.name}”.
        </p>

        <div className="mb-3 flex flex-col gap-2.5">
          {reportReasons.map((reason) => {
            const active = selectedReason === reason;
            return (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`rounded-(--radius-md) border px-3.5 py-3 text-left text-sm text-(--foreground) ${
                  active
                    ? "border-primary bg-primary-soft"
                    : "border-(--color-border) bg-(--background)"
                }`}
              >
                {reason}
              </button>
            );
          })}
        </div>

        <Field
          multiline
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="Quer contar mais algum detalhe? (opcional)"
          className="mb-4"
        />

        <Button
          title="Enviar denúncia"
          onClick={submit}
          disabled={!selectedReason && !detail.trim()}
          className="mb-2.5 w-full"
        />
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 text-sm text-(--foreground)"
        >
          Cancelar
        </button>
      </section>
    </div>
  );
}
