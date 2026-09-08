"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, Lock, Undo2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { Avatar, Button, ConfirmDialog, EmptyState } from "@/components/ui";
import { brl } from "@/lib/theme";
import { useWishbox } from "@/store/wishbox-store";

export default function ReservedPage() {
  const { reserved, dispatch, listById, userById } = useWishbox();
  const { showToast } = useToast();
  const [confirmCancel, setConfirmCancel] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const confirmCancelAction = () => {
    if (!confirmCancel) return;
    dispatch({ type: "product/unreserve", id: confirmCancel.id });
    showToast({ tone: "success", text: "Reserva desfeita" });
    setConfirmCancel(null);
  };

  if (reserved.length === 0) {
    return (
      <Screen header>
        <EmptyState
          emoji="🔒"
          title="Nenhum item reservado"
          description="Ao reservar um presente de alguém, ele aparece aqui — e a pessoa nunca sabe quem foi."
          action={
            <Link href="/connections">
              <Button title="Explorar amigos" variant="outline" />
            </Link>
          }
        />
        <BottomNav />
      </Screen>
    );
  }

  return (
    <Screen header>
      <div className="grid grid-cols-2 gap-3">
        {reserved.map((product) => {
          const list = listById(product.listId);
          const owner = list ? userById(list.ownerId) : undefined;

          return (
            <article
              key={product.id}
              className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_6px_14px_-2px_rgba(27,27,51,0.06)]"
            >
              <div className="relative aspect-square w-full">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary-soft">
                    <span className="text-4xl">{product.emoji}</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-md bg-card">
                  <Lock size={13} className="text-primary" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 p-2.5">
                <p className="truncate text-xs font-semibold text-primary">
                  {product.store || "Produto"}
                </p>
                <p className="line-clamp-2 text-sm font-bold text-foreground">
                  {product.name}
                </p>
                <p className="text-sm font-extrabold text-primary">
                  {brl(product.price)}
                </p>
                {owner ? (
                  <div className="flex min-h-[30px] items-center gap-1.5">
                    <Avatar
                      photo={owner.photo}
                      emoji={owner.emoji}
                      tint={owner.tint}
                      size={22}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {owner.name}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {list?.name}
                      </p>
                    </div>
                  </div>
                ) : null}
                <Link href={`/product/${product.id}`}>
                  <Button
                    title="Comprar"
                    icon={<Gift size={14} />}
                    className="w-full"
                  />
                </Link>
                <Button
                  title="Cancelar reserva"
                  icon={<Undo2 size={14} />}
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setConfirmCancel({ id: product.id, name: product.name })
                  }
                />
              </div>
            </article>
          );
        })}
      </div>

      <ConfirmDialog
        visible={confirmCancel !== null}
        title="Cancelar reserva?"
        description="O presente volta a ficar disponível para outras pessoas reservarem."
        confirmLabel="Cancelar reserva"
        cancelLabel="Voltar"
        onConfirm={confirmCancelAction}
        onCancel={() => setConfirmCancel(null)}
      />
      <BottomNav />
    </Screen>
  );
}
