"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Ellipsis, Lock, Plus, Users } from "lucide-react";
import { FormHeader } from "@/components/FormHeader";
import { Screen } from "@/components/Screen";
import { ProductCard } from "@/components/Cards";
import { ListActionsSheet } from "@/components/ListActionsSheet";
import { Avatar, Button, EmptyState } from "@/components/ui";
import { tints } from "@/lib/theme";
import { useWishbox } from "@/store/wishbox-store";

export default function ListPage() {
  const { listId } = useParams<{ listId: string }>();
  const router = useRouter();
  const { listById, productsOf, userById, backendUser } = useWishbox();
  const [menuOpen, setMenuOpen] = useState(false);

  const list = listById(String(listId));

  if (!list) {
    return (
      <Screen>
        <FormHeader />
        <EmptyState emoji="🤔" title="Lista não encontrada" />
      </Screen>
    );
  }

  const owner = userById(list.ownerId);
  const products = productsOf(list.id);
  const isOwner = Boolean(backendUser && list.ownerId === backendUser.id);

  return (
    <Screen>
      <FormHeader />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex size-14 items-center justify-center rounded-(--radius-md)"
            style={{ backgroundColor: tints[list.tint] ?? tints.lilac }}
          >
            <span className="text-2xl">{list.emoji}</span>
          </div>
          <div>
            <p className="text-[17px] font-bold text-(--foreground)">
              {list.name}
            </p>
            {owner ? (
              <div className="mt-1 flex items-center gap-1.5">
                <Avatar photo={owner.photo} emoji={owner.emoji} tint={owner.tint} size={18} />
                <span className="text-xs text-(--color-muted)">@{owner.username}</span>
              </div>
            ) : null}
          </div>
        </div>

        {isOwner ? (
          <button
            type="button"
            aria-label="Opções da lista"
            onClick={() => setMenuOpen(true)}
            className="flex size-9 items-center justify-center rounded-full border border-(--color-border) bg-(--color-card)"
          >
            <Ellipsis size={18} className="text-(--color-muted)" />
          </button>
        ) : null}
      </div>

      {list.privacy !== "public" ? (
        <span className="flex w-fit items-center gap-1 rounded-(--radius-full,999px) border border-(--color-border) bg-(--color-card) px-2.5 py-1 text-[11px] font-semibold text-(--color-muted)">
          {list.privacy === "private" ? <Lock size={12} /> : <Users size={12} />}
          {list.privacy === "private" ? "Privada" : "Convidados"}
        </span>
      ) : null}

      {list.description ? (
        <p className="text-sm leading-[20px] text-(--color-muted)">
          {list.description}
        </p>
      ) : null}

      {isOwner ? (
        <Button
          title="Adicionar produto"
          icon={<Plus size={18} />}
          onClick={() => router.push("/add-product")}
        />
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title="Nenhum produto ainda"
          description={
            isOwner
              ? "Adicione produtos para começar sua lista."
              : "Essa lista ainda não tem produtos."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              ownerPhoto={owner?.photo}
              onPress={() => router.push(`/product/${product.id}`)}
              showActions={isOwner}
              isReservedByMe={Boolean(
                backendUser && product.reservedBy === backendUser.id,
              )}
            />
          ))}
        </div>
      )}

      {isOwner ? (
        <ListActionsSheet
          list={list}
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </Screen>
  );
}