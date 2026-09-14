"use client";

import { useEffect, useRef, useState } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  const runAndClose = (action: () => void) => {
    onClose();
    action();
  };

  useEffect(() => {
    if (!visible) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <>
      <div
        ref={menuRef}
        role="menu"
        className="absolute top-full right-0 z-50 mt-1.5 w-52 overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-card) py-1 shadow-[0_10px_30px_-6px_rgba(27,27,51,0.2)]"
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-(--color-background)"
          onClick={() => runAndClose(editList)}
        >
          <Pencil size={16} className="text-(--foreground)" />
          <span className="text-[13px] text-(--foreground)">Editar lista</span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-(--color-background)"
          onClick={() => {
            onClose();
            setShareOpen(true);
          }}
        >
          <Share2 size={16} className="text-(--foreground)" />
          <span className="text-[13px] text-(--foreground)">
            Compartilhar lista
          </span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-(--color-background)"
          onClick={() => runAndClose(togglePause)}
        >
          {list.paused ? (
            <PlayCircle size={16} className="text-(--foreground)" />
          ) : (
            <PauseCircle size={16} className="text-(--foreground)" />
          )}
          <span className="text-[13px] text-(--foreground)">
            {list.paused ? "Retomar lista" : "Pausar lista"}
          </span>
        </button>

        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-(--color-background)"
          onClick={requestRemove}
        >
          <Trash2 size={16} className="text-(--color-danger)" />
          <span className="text-[13px] text-(--color-danger)">
            Excluir lista
          </span>
        </button>
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
