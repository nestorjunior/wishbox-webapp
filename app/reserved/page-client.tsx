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
import { ApiError } from "@/lib/api";
import { useWishbox } from "@/store/wishbox-store";

export default function ReservedPage() {
  const { reserved, cancelProductReservation, listById, userById } = useWishbox();
  const { showToast } = useToast();
  const [confirmCancel, setConfirmCancel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const confirmCancelAction = async () => {
    if (!confirmCancel || cancelling) return;

    try {
      setCancelling(true);
      await cancelProductReservation(confirmCancel.id);
      showToast({ tone: "success", text: "Reserva desfeita" });
      setConfirmCancel(null);
    } catch (error) {
      showToast({
        tone: "warning",
        text:
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Não foi possível cancelar a reserva.",
      });
    } finally {
      setCancelling(false);
    }
  };

  if (reserved.length === 0) {
    return (
      <Screen
        header
        headerMaxWidthClass="max-w-[960px]"
        contentClassName="sm:max-w-[960px] sm:px-[18px] sm:pt-9"
      >
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
    <Screen
      header
      headerMaxWidthClass="max-w-[960px]"
      contentClassName="sm:max-w-[960px] sm:px-[18px] sm:pt-9"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-foreground">Suas reservas</h1>
        <span className="text-xs text-muted">
          {reserved.length} {reserved.length === 1 ? "reservado" : "reservados"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {reserved.map((product) => {
          const list = listById(product.listId);
          const owner = list ? userById(list.ownerId) : undefined;

          return (
            <article
              key={product.id}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card"
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
              <div className="flex flex-1 flex-col gap-1.5 p-2.5">
                <p className="truncate text-xs font-semibold text-primary">
                  {product.store || "Produto"}
                </p>
                <p className="line-clamp-2 min-h-10 text-sm font-bold text-foreground">
                  {product.name}
                </p>
                <p className="text-sm font-extrabold text-primary">
                  {brl(product.price)}
                </p>
                <div className="flex min-h-[30px] items-center gap-1.5">
                  {owner ? (
                    <>
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
                    </>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-col gap-1.5">
                  <Link className="block" href={`/product/${product.id}`}>
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
        loading={cancelling}
        onConfirm={() => void confirmCancelAction()}
        onCancel={() => setConfirmCancel(null)}
      />
      <BottomNav />
    </Screen>
  );
}
