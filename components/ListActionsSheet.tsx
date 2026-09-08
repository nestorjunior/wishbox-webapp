"use client";

import { useState } from "react";
import { PauseCircle, Pencil, PlayCircle, Share2, Trash2 } from "lucide-react";
import type { GiftList } from "@/lib/data";
import { useListActions } from "@/hooks/use-list-actions";
import { ShareListSheet } from "@/components/ShareListSheet";
import { ConfirmDialog } from "@/components/ui";

export function ListActionsSheet({
  list,
  visible,
  onClose,
}: {
  list: GiftList;
  visible: boolean;
  onClose: () => void;
}) {
  const {
    saving,
    editList,
    togglePause,
    remove,
    confirmOpen,
    requestRemove,
    cancelRemove,
  } = useListActions(list, { onDeleted: onClose });
  const [shareOpen, setShareOpen] = useState(false);

  const runAndClose = (action: () => void) => {
    onClose();
    action();
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end">
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(20,20,28,0.4)]"
        />
        <div className="relative w-full rounded-t-(--radius-xl) bg-(--color-card) px-5 pt-2.5 pb-7 shadow-[0_-6px_20px_-4px_rgba(27,27,51,0.15)]">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-(--color-border)" />
          <p className="mb-2 truncate text-[17px] font-bold text-(--foreground)">
            {list.name}
          </p>

          <button
            type="button"
            className="flex w-full items-center gap-3 py-3.5 text-left"
            onClick={() => runAndClose(editList)}
          >
            <Pencil size={18} className="text-(--foreground)" />
            <span className="text-sm text-(--foreground)">Editar lista</span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 py-3.5 text-left"
            onClick={() => {
              onClose();
              setShareOpen(true);
            }}
          >
            <Share2 size={18} className="text-(--foreground)" />
            <span className="text-sm text-(--foreground)">
              Compartilhar lista
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 py-3.5 text-left"
            onClick={() => runAndClose(togglePause)}
          >
            {list.paused ? (
              <PlayCircle size={18} className="text-(--foreground)" />
            ) : (
              <PauseCircle size={18} className="text-(--foreground)" />
            )}
            <span className="text-sm text-(--foreground)">
              {list.paused ? "Retomar lista" : "Pausar lista"}
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 py-3.5 text-left"
            onClick={requestRemove}
          >
            <Trash2 size={18} className="text-(--color-danger)" />
            <span className="text-sm text-(--color-danger)">Excluir lista</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        visible={confirmOpen}
        title="Excluir lista"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        loading={saving}
        onConfirm={() => void remove()}
        onCancel={cancelRemove}
      />

      <ShareListSheet
        list={list}
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  );
}
