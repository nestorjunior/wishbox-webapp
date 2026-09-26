"use client";

import { Check, Plus, X } from "lucide-react";

import { Button } from "@/components/ui";
import type { GiftList } from "@/lib/data";

type ProductListDialogProps = {
  lists: GiftList[];
  selectedListId: string;
  busy: boolean;
  canSubmit: boolean;
  message: string;
  itemCount: (listId: string) => number;
  onClose: () => void;
  onCreateList: () => void;
  onSelectList: (listId: string) => void;
};

export function ProductListDialog({
  lists,
  selectedListId,
  busy,
  canSubmit,
  message,
  itemCount,
  onClose,
  onCreateList,
  onSelectList,
}: ProductListDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-dialog-title"
        className="relative w-full max-w-[420px] rounded-xl bg-card p-6 shadow-2xl"
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted"
        >
          <X size={19} />
        </button>
        <h2
          id="list-dialog-title"
          className="text-lg font-bold text-foreground"
        >
          Em qual lista?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Escolha a lista onde esse presente vai ficar.
        </p>

        <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">
          {lists.map((list) => {
            const selected = list.id === selectedListId;
            const count = itemCount(list.id);

            return (
              <button
                type="button"
                key={list.id}
                onClick={() => onSelectList(list.id)}
                aria-pressed={selected}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selected ? "border-primary bg-primary-soft" : "border-border bg-card"}`}
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-background text-xl">
                  {list.emoji || "🎁"}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm text-foreground">{list.name}</strong>
                  <small className="text-xs text-muted">
                    {count} {count === 1 ? "item" : "itens"}
                  </small>
                </span>
                {selected ? <Check size={19} className="text-primary" strokeWidth={2.5} /> : null}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onCreateList}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Plus size={20} />
            </span>
            <strong className="text-sm text-foreground">
              Criar lista nova
            </strong>
          </button>
        </div>

        {message ? (
          <p role="alert" className="mt-3 text-sm text-danger">
            {message}
          </p>
        ) : null}
        <Button
          type="submit"
          form="product-form"
          title="Adicionar à lista"
          loading={busy}
          disabled={!canSubmit}
          className="mt-4 h-[46px] w-full"
        />
      </section>
    </div>
  );
}
