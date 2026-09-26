"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { GiftList, Product } from "@/lib/data";

export function CloneProductSheet({
  product,
  lists,
  selectedListId,
  visible,
  loading,
  onClose,
  onSelect,
  onSubmit,
}: {
  product: Product | null;
  lists: GiftList[];
  selectedListId: string | null;
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSelect: (listId: string) => void;
  onSubmit: () => void;
}) {
  if (!visible || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button type="button" aria-label="Fechar" disabled={loading} onClick={onClose} className="absolute inset-0 bg-black/72" />
      <section role="dialog" aria-modal="true" aria-labelledby="clone-product-title" className="relative w-full rounded-t-(--radius-xl) bg-card px-5 pt-5 pb-7 shadow-sheet sm:mx-auto sm:max-w-[520px]">
        <button type="button" aria-label="Fechar" disabled={loading} onClick={onClose} className="absolute top-5 right-5 text-muted"><X size={20} /></button>
        <h2 id="clone-product-title" className="pr-8 text-[17px] font-bold text-foreground">Escolha a lista de destino</h2>
        <p className="mt-1 text-xs text-muted">Duplicar “{product.name}” em:</p>
        <div className="mt-4 max-h-[55vh] space-y-1 overflow-y-auto">
          {lists.length === 0 ? <p className="py-8 text-center text-sm text-muted">Não há outra lista disponível.</p> : null}
          {lists.map((list) => {
            const selected = selectedListId === list.id;
            return (
              <button key={list.id} type="button" disabled={loading} onClick={() => onSelect(list.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${selected ? "bg-primary-soft" : "hover:bg-background"}`}>
                <span className="flex size-10 items-center justify-center rounded-xl bg-background text-xl">{list.emoji || "🎁"}</span>
                <strong className="min-w-0 flex-1 truncate text-sm text-foreground">{list.name}</strong>
                {selected ? <Check size={18} className="text-primary" /> : null}
              </button>
            );
          })}
        </div>
        <Button
          title="Salvar em outra lista"
          loading={loading}
          disabled={!selectedListId || loading}
          onClick={onSubmit}
          className="mt-4 w-full"
        />
      </section>
    </div>
  );
}
