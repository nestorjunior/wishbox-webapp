"use client";

import { useEffect, useRef, useState } from "react";
import { CirclePause, CirclePlay, Pencil, Share2, Trash2 } from "lucide-react";
import type { GiftList } from "@/lib/data";
import { useListActions } from "@/hooks/use-list-actions";
import { ShareListSheet } from "@/components/ShareListSheet";
import { ConfirmDialog } from "@/components/ui";
import { isListOwner, useWishbox } from "@/store/wishbox-store";

export function ListActionsSheet({
  list,
  visible,
  onClose,
}: {
  list: GiftList;
  visible: boolean;
  onClose: () => void;
}) {
  const { backendUser } = useWishbox();
  const canManageMembers = isListOwner(list, backendUser);
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

  return (
    <>
      {visible ? <div
        ref={menuRef}
        role="menu"
        className="absolute top-full right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-menu"
      >
        <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-(--color-background)"
          onClick={() => runAndClose(editList)}
        >
          <Pencil size={16} className="text-(--foreground)" />
          <span className="text-[13px] text-(--foreground)">Editar lista</span>
        </button>

        <button
          type="button"
          role="menuitem"
          disabled={saving}
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-(--color-background) disabled:opacity-50"
          onClick={() => runAndClose(() => void togglePause())}
        >
          {list.paused ? <CirclePlay size={16} /> : <CirclePause size={16} />}
          <span className="text-[13px] text-(--foreground)">
            {list.paused ? "Retomar lista" : "Pausar lista"}
          </span>
        </button>

        {canManageMembers ? <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-(--color-background)"
          onClick={() => {
            onClose();
            setShareOpen(true);
          }}
        >
          <Share2 size={16} className="text-(--foreground)" />
          <span className="text-[13px] text-(--foreground)">
            Compartilhar
          </span>
        </button> : null}

        {canManageMembers ? <button
          type="button"
          role="menuitem"
          className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-(--color-background)"
          onClick={requestRemove}
        >
          <Trash2 size={16} className="text-(--color-danger)" />
          <span className="text-[13px] text-(--color-danger)">
            Excluir lista
          </span>
        </button> : null}
      </div> : null}

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
